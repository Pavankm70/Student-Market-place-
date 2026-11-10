package com.campus.marketplace.service;

import com.campus.marketplace.dto.ReviewReportRequestDto;
import com.campus.marketplace.dto.ReviewRequestDto;
import com.campus.marketplace.dto.ReviewResponseDto;
import com.campus.marketplace.entity.*;
import com.campus.marketplace.exception.BadRequestException;
import com.campus.marketplace.exception.ForbiddenException;
import com.campus.marketplace.exception.ResourceNotFoundException;
import com.campus.marketplace.repository.ListingRepository;
import com.campus.marketplace.repository.OrderRepository;
import com.campus.marketplace.repository.ReviewRepository;
import com.campus.marketplace.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    private static final Logger log = LoggerFactory.getLogger(ReviewService.class);

    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final AuthService authService;

    public ReviewService(ReviewRepository reviewRepository,
                         OrderRepository orderRepository,
                         ListingRepository listingRepository,
                         UserRepository userRepository,
                         AuthService authService) {
        this.reviewRepository = reviewRepository;
        this.orderRepository = orderRepository;
        this.listingRepository = listingRepository;
        this.userRepository = userRepository;
        this.authService = authService;
    }

    @Transactional
    public ReviewResponseDto createReview(ReviewRequestDto dto) {
        User reviewer = authService.getAuthenticatedUser();

        Order order = null;
        if (dto.getOrderId() != null) {
            order = orderRepository.findById(dto.getOrderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + dto.getOrderId()));
        } else if (dto.getListingId() != null) {
            order = orderRepository.findFirstByBuyerIdAndListingIdAndStatusIn(
                    reviewer.getId(),
                    dto.getListingId(),
                    Arrays.asList(OrderStatus.PAID, OrderStatus.COMPLETED)
            ).orElseThrow(() -> new ForbiddenException(
                    "Only students who completed purchase of this item can leave a review. We couldn't find a paid order for this item on your account."
            ));
        } else {
            throw new BadRequestException("Either order ID or listing ID must be provided to submit a review.");
        }

        // Rule 1: Only the verified buyer can review this purchase
        if (!order.getBuyer().getId().equals(reviewer.getId())) {
            throw new ForbiddenException("Only the buyer who completed this purchase can submit a review.");
        }

        // Rule 2: Review only permitted for verified, qualifying transactions (PAID or COMPLETED)
        if (order.getStatus() != OrderStatus.PAID && order.getStatus() != OrderStatus.COMPLETED) {
            throw new BadRequestException("Reviews can only be submitted after completing payment (Order status: " + order.getStatus() + ")");
        }

        // Rule 3: Prevent duplicate reviews for the same transaction
        if (reviewRepository.existsByOrderIdAndReviewerId(order.getId(), reviewer.getId())) {
            throw new BadRequestException("You have already submitted a review for this purchase.");
        }

        Review review = new Review();
        review.setOrder(order);
        review.setListing(order.getListing());
        review.setSeller(order.getSeller());
        review.setReviewer(reviewer);
        review.setRating(dto.getRating());
        review.setComment(dto.getComment() != null ? dto.getComment().trim() : "");
        review.setVerifiedPurchase(true);
        review.setModerated(false);
        review.setReported(false);

        Review saved = reviewRepository.save(review);

        // Update aggregated ratings for seller and listing
        updateAggregatedRatings(order.getSeller(), order.getListing());

        log.info("[REVIEW-CREATED] id={}, orderId={}, listingId={}, sellerId={}, reviewerId={}, rating={}",
                saved.getId(), order.getId(), order.getListing().getId(), order.getSeller().getId(), reviewer.getId(), saved.getRating());

        return mapToDto(saved);
    }

    @Transactional
    public void reportReview(Long reviewId, ReviewReportRequestDto dto) {
        Review review = findReviewOrThrow(reviewId);
        review.setReported(true);
        review.setReportReason(dto.getReason() != null ? dto.getReason().trim() : "Flagged for administrative review");
        reviewRepository.save(review);
        log.info("[REVIEW-REPORTED] reviewId={}, reason='{}'", reviewId, review.getReportReason());
    }

    @Transactional
    public ReviewResponseDto moderateReview(Long reviewId, boolean hide) {
        User currentUser = authService.getAuthenticatedUser();
        if (currentUser.getRole() != Role.ROLE_SUPER_ADMIN) {
            throw new ForbiddenException("Only Super Admins can moderate reviews.");
        }

        Review review = findReviewOrThrow(reviewId);
        review.setModerated(hide);
        review.setReported(false);
        Review saved = reviewRepository.save(review);

        // Update aggregated ratings
        updateAggregatedRatings(saved.getSeller(), saved.getListing());
        log.info("[REVIEW-MODERATED] reviewId={}, hidden={}", reviewId, hide);
        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<ReviewResponseDto> getReviewsForListing(Long listingId) {
        return reviewRepository.findByListingIdAndIsModeratedFalseOrderByCreatedAtDesc(listingId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReviewResponseDto> getReviewsForSeller(Long sellerId) {
        return reviewRepository.findBySellerIdAndIsModeratedFalseOrderByCreatedAtDesc(sellerId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReviewResponseDto> getReportedReviews() {
        User currentUser = authService.getAuthenticatedUser();
        if (currentUser.getRole() != Role.ROLE_SUPER_ADMIN) {
            throw new ForbiddenException("Only Super Admins can view reported reviews.");
        }
        return reviewRepository.findByIsReportedTrueOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private void updateAggregatedRatings(User seller, Listing listing) {
        // Seller
        Double sellerAvg = reviewRepository.calculateAverageRatingForSeller(seller.getId());
        long sellerCount = reviewRepository.countApprovedReviewsForSeller(seller.getId());
        seller.setAverageRating(sellerAvg != null ? Math.round(sellerAvg * 10.0) / 10.0 : null);
        seller.setTotalReviews((int) sellerCount);
        userRepository.save(seller);

        // Listing
        Double listingAvg = reviewRepository.calculateAverageRatingForListing(listing.getId());
        long listingCount = reviewRepository.countApprovedReviewsForListing(listing.getId());
        listing.setAverageRating(listingAvg != null ? Math.round(listingAvg * 10.0) / 10.0 : null);
        listing.setTotalReviews((int) listingCount);
        listingRepository.save(listing);
    }

    public Review findReviewOrThrow(Long id) {
        return reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with ID: " + id));
    }

    public ReviewResponseDto mapToDto(Review review) {
        ReviewResponseDto dto = new ReviewResponseDto();
        dto.setId(review.getId());
        dto.setOrderId(review.getOrder().getId());
        dto.setListingId(review.getListing().getId());
        dto.setListingTitle(review.getListing().getTitle());
        dto.setSellerId(review.getSeller().getId());
        dto.setSellerName(review.getSeller().getName());
        dto.setReviewerId(review.getReviewer().getId());
        dto.setReviewerName(review.getReviewer().getName());
        dto.setRating(review.getRating());
        dto.setComment(review.getComment());
        dto.setVerifiedPurchase(review.isVerifiedPurchase());
        dto.setReported(review.isReported());
        dto.setReportReason(review.getReportReason());
        dto.setModerated(review.isModerated());
        dto.setCreatedAt(review.getCreatedAt());
        return dto;
    }
}
