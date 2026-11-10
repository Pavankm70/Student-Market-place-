package com.campus.marketplace.service;

import com.campus.marketplace.dto.ReviewRequestDto;
import com.campus.marketplace.dto.ReviewResponseDto;
import com.campus.marketplace.entity.*;
import com.campus.marketplace.exception.BadRequestException;
import com.campus.marketplace.exception.ForbiddenException;
import com.campus.marketplace.repository.ListingRepository;
import com.campus.marketplace.repository.OrderRepository;
import com.campus.marketplace.repository.ReviewRepository;
import com.campus.marketplace.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuthService authService;

    @InjectMocks
    private ReviewService reviewService;

    private User buyer;
    private User seller;
    private Listing listing;
    private Order order;

    @BeforeEach
    void setUp() {
        buyer = new User("Buyer Student", "buyer@nmit.ac.in", "pass123");
        buyer.setId(101L);

        seller = new User("Seller Student", "seller@nmit.ac.in", "pass123");
        seller.setId(102L);

        listing = new Listing();
        listing.setId(201L);
        listing.setTitle("Scientific Calculator FX-991");
        listing.setPrice(new BigDecimal("700.00"));
        listing.setSeller(seller);

        order = new Order(buyer, seller, listing, listing.getPrice(), OrderStatus.PAID);
        order.setId(301L);
    }

    @Test
    @DisplayName("Verified buyer can submit a review for a PAID transaction")
    void testCreateReviewSuccess() {
        when(authService.getAuthenticatedUser()).thenReturn(buyer);
        when(orderRepository.findById(301L)).thenReturn(Optional.of(order));
        when(reviewRepository.existsByOrderIdAndReviewerId(301L, 101L)).thenReturn(false);

        Review savedReview = new Review(order, listing, seller, buyer, 5, "Great condition, quick meetup!");
        savedReview.setId(401L);
        when(reviewRepository.save(any(Review.class))).thenReturn(savedReview);
        when(reviewRepository.calculateAverageRatingForSeller(102L)).thenReturn(5.0);
        when(reviewRepository.countApprovedReviewsForSeller(102L)).thenReturn(1L);
        when(reviewRepository.calculateAverageRatingForListing(201L)).thenReturn(5.0);
        when(reviewRepository.countApprovedReviewsForListing(201L)).thenReturn(1L);

        ReviewResponseDto result = reviewService.createReview(new ReviewRequestDto(301L, 5, "Great condition, quick meetup!"));

        assertNotNull(result);
        assertEquals(401L, result.getId());
        assertEquals(5, result.getRating());
        assertTrue(result.isVerifiedPurchase());
        verify(userRepository).save(seller);
        verify(listingRepository).save(listing);
    }

    @Test
    @DisplayName("Prevents unauthorized non-buyer user from reviewing another student's order")
    void testUnauthorizedUserCannotReviewOrder() {
        User otherUser = new User("Stranger", "other@nmit.ac.in", "pass123");
        otherUser.setId(999L);
        when(authService.getAuthenticatedUser()).thenReturn(otherUser);
        when(orderRepository.findById(301L)).thenReturn(Optional.of(order));

        ForbiddenException ex = assertThrows(ForbiddenException.class, () ->
                reviewService.createReview(new ReviewRequestDto(301L, 5, "Fake review attempt")));

        assertTrue(ex.getMessage().contains("Only the buyer"));
        verify(reviewRepository, never()).save(any());
    }

    @Test
    @DisplayName("Rejects review if order is still PENDING_PAYMENT or unpaid")
    void testCannotReviewUnpaidOrder() {
        order.setStatus(OrderStatus.PENDING_PAYMENT);
        when(authService.getAuthenticatedUser()).thenReturn(buyer);
        when(orderRepository.findById(301L)).thenReturn(Optional.of(order));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                reviewService.createReview(new ReviewRequestDto(301L, 5, "Unpaid review attempt")));

        assertTrue(ex.getMessage().contains("after completing payment"));
        verify(reviewRepository, never()).save(any());
    }

    @Test
    @DisplayName("Prevents duplicate reviews for the same purchase")
    void testDuplicateReviewPrevention() {
        when(authService.getAuthenticatedUser()).thenReturn(buyer);
        when(orderRepository.findById(301L)).thenReturn(Optional.of(order));
        when(reviewRepository.existsByOrderIdAndReviewerId(301L, 101L)).thenReturn(true);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                reviewService.createReview(new ReviewRequestDto(301L, 5, "Second review attempt")));

        assertTrue(ex.getMessage().contains("already submitted a review"));
        verify(reviewRepository, never()).save(any());
    }
}
