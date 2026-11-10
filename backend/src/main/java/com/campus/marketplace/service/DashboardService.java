package com.campus.marketplace.service;

import com.campus.marketplace.dto.*;
import com.campus.marketplace.entity.*;
import com.campus.marketplace.exception.BadRequestException;
import com.campus.marketplace.exception.ForbiddenException;
import com.campus.marketplace.exception.ResourceNotFoundException;
import com.campus.marketplace.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private static final Logger log = LoggerFactory.getLogger(DashboardService.class);

    private final ListingRepository listingRepository;
    private final OrderRepository orderRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final AuthService authService;
    private final OrderService orderService;
    private final EmailService emailService;

    public DashboardService(ListingRepository listingRepository,
                            OrderRepository orderRepository,
                            PaymentTransactionRepository paymentTransactionRepository,
                            ReviewRepository reviewRepository,
                            UserRepository userRepository,
                            AuthService authService,
                            OrderService orderService,
                            EmailService emailService) {
        this.listingRepository = listingRepository;
        this.orderRepository = orderRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.reviewRepository = reviewRepository;
        this.userRepository = userRepository;
        this.authService = authService;
        this.orderService = orderService;
        this.emailService = emailService;
    }

    @Transactional(readOnly = true)
    public SellerDashboardDto getSellerDashboard() {
        User seller = authService.getAuthenticatedUser();
        Long sellerId = seller.getId();

        SellerDashboardDto dto = new SellerDashboardDto();
        dto.setTotalListings(listingRepository.countBySellerId(sellerId));
        dto.setAvailableListings(listingRepository.countBySellerIdAndStatus(sellerId, ListingStatus.AVAILABLE));
        dto.setReservedListings(listingRepository.countBySellerIdAndStatus(sellerId, ListingStatus.RESERVED));
        dto.setSoldListings(listingRepository.countBySellerIdAndStatus(sellerId, ListingStatus.SOLD));

        dto.setOrdersReceived(orderRepository.countBySellerId(sellerId));
        dto.setPendingOrders(orderRepository.countBySellerIdAndStatus(sellerId, OrderStatus.PENDING_PAYMENT));
        long paidCount = orderRepository.countBySellerIdAndStatus(sellerId, OrderStatus.PAID);
        long completedCount = orderRepository.countBySellerIdAndStatus(sellerId, OrderStatus.COMPLETED);
        dto.setConfirmedOrders(paidCount);
        dto.setCompletedHandovers(completedCount);
        long cancelledCount = orderRepository.countBySellerIdAndStatus(sellerId, OrderStatus.CANCELLED);
        dto.setCancelledOrders(cancelledCount);

        BigDecimal revenue = orderRepository.calculateSellerRevenue(sellerId, Arrays.asList(OrderStatus.PAID, OrderStatus.COMPLETED));
        dto.setVerifiedRevenue(revenue != null ? revenue : BigDecimal.ZERO);

        Double avgRating = reviewRepository.calculateAverageRatingForSeller(sellerId);
        long reviewCount = reviewRepository.countApprovedReviewsForSeller(sellerId);
        dto.setAverageRating(avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : null);
        dto.setTotalReviews((int) reviewCount);

        List<Review> sellerReviews = reviewRepository.findBySellerIdAndIsModeratedFalseOrderByCreatedAtDesc(sellerId);
        dto.setRecentReviews(sellerReviews.stream()
                .map(this::mapReviewToDto)
                .collect(Collectors.toList()));

        List<Order> allSellerOrders = orderRepository.findBySellerIdOrderByCreatedAtDesc(sellerId);
        dto.setRecentOrders(allSellerOrders.stream()
                .limit(20)
                .map(o -> orderService.mapToDto(o, seller))
                .collect(Collectors.toList()));

        // Aggregate performance across all of this seller's listings
        List<Listing> sellerListings = listingRepository.findBySellerIdOrderByCreatedAtDesc(sellerId);
        Map<Long, List<Order>> ordersByListing = allSellerOrders.stream()
                .collect(Collectors.groupingBy(o -> o.getListing().getId()));

        List<SellerDashboardDto.TopListingDto> listingPerformances = new ArrayList<>();
        for (Listing l : sellerListings) {
            List<Order> lOrders = ordersByListing.getOrDefault(l.getId(), Collections.emptyList());
            long totalOrdersCount = lOrders.size();
            List<Order> paidOrders = lOrders.stream()
                    .filter(o -> o.getStatus() == OrderStatus.PAID || o.getStatus() == OrderStatus.COMPLETED)
                    .collect(Collectors.toList());
            long salesCount = paidOrders.size();
            BigDecimal totalRev = paidOrders.stream()
                    .map(Order::getAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            listingPerformances.add(new SellerDashboardDto.TopListingDto(
                    l.getId(),
                    l.getTitle(),
                    l.getImageUrl(),
                    l.getPrice(),
                    l.getStatus() != null ? l.getStatus().name() : "AVAILABLE",
                    totalOrdersCount,
                    salesCount,
                    totalRev
            ));
        }
        listingPerformances.sort((a, b) -> {
            int revComp = b.getTotalRevenue().compareTo(a.getTotalRevenue());
            if (revComp != 0) return revComp;
            return Long.compare(b.getSalesCount(), a.getSalesCount());
        });
        dto.setTopListings(listingPerformances);

        // Aggregate chronological daily sales trends over time
        Map<String, List<Order>> ordersByDate = allSellerOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.PAID || o.getStatus() == OrderStatus.COMPLETED)
                .filter(o -> o.getCreatedAt() != null)
                .collect(Collectors.groupingBy(o -> o.getCreatedAt().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd")),
                        TreeMap::new, Collectors.toList()));

        List<SellerDashboardDto.SalesTrendDto> trends = new ArrayList<>();
        ordersByDate.forEach((dateStr, orders) -> {
            BigDecimal periodTotal = orders.stream()
                    .map(Order::getAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            trends.add(new SellerDashboardDto.SalesTrendDto(dateStr, orders.size(), periodTotal));
        });
        dto.setSalesOverTime(trends);

        return dto;
    }

    @Transactional(readOnly = true)
    public com.campus.marketplace.dto.BuyerDashboardDto getBuyerDashboard() {
        User buyer = authService.getAuthenticatedUser();
        Long buyerId = buyer.getId();

        com.campus.marketplace.dto.BuyerDashboardDto dto = new com.campus.marketplace.dto.BuyerDashboardDto();
        dto.setTotalOrders(orderRepository.countByBuyerId(buyerId));
        long paid = orderRepository.countByBuyerIdAndStatus(buyerId, OrderStatus.PAID);
        long completed = orderRepository.countByBuyerIdAndStatus(buyerId, OrderStatus.COMPLETED);
        dto.setConfirmedOrders(paid + completed);
        dto.setPendingOrders(orderRepository.countByBuyerIdAndStatus(buyerId, OrderStatus.PENDING_PAYMENT));
        dto.setCancelledOrders(orderRepository.countByBuyerIdAndStatus(buyerId, OrderStatus.CANCELLED));

        BigDecimal spent = orderRepository.calculateBuyerSpending(buyerId, Arrays.asList(OrderStatus.PAID, OrderStatus.COMPLETED));
        dto.setTotalSpent(spent != null ? spent : BigDecimal.ZERO);

        Page<Order> recentOrdersPage = orderRepository.findByBuyerIdOrderByCreatedAtDesc(buyerId, PageRequest.of(0, 10));
        dto.setRecentOrders(recentOrdersPage.getContent().stream()
                .map(o -> orderService.mapToDto(o, buyer))
                .collect(Collectors.toList()));

        return dto;
    }

    @Transactional(readOnly = true)
    public AdminDashboardStatsDto getAdminStats() {
        ensureSuperAdmin();

        AdminDashboardStatsDto stats = new AdminDashboardStatsDto();
        stats.setTotalUsers(userRepository.count());
        stats.setCollegeVerifiedUsers(userRepository.countByVerificationStatus(VerificationStatus.COLLEGE_VERIFIED));
        stats.setPendingVerificationUsers(userRepository.countByVerificationStatus(VerificationStatus.PENDING_REVIEW));

        stats.setTotalListings(listingRepository.count());
        stats.setAvailableListings(listingRepository.countByStatus(ListingStatus.AVAILABLE));
        stats.setReservedListings(listingRepository.countByStatus(ListingStatus.RESERVED));
        stats.setSoldListings(listingRepository.countByStatus(ListingStatus.SOLD));

        stats.setTotalOrders(orderRepository.count());
        long paid = orderRepository.countByStatus(OrderStatus.PAID);
        long completed = orderRepository.countByStatus(OrderStatus.COMPLETED);
        stats.setCompletedOrders(paid + completed);

        BigDecimal platformRevenue = orderRepository.calculatePlatformRevenue(Arrays.asList(OrderStatus.PAID, OrderStatus.COMPLETED));
        stats.setPlatformVerifiedRevenue(platformRevenue != null ? platformRevenue : BigDecimal.ZERO);

        stats.setReportedReviewsCount(reviewRepository.findByIsReportedTrueOrderByCreatedAtDesc().size());

        return stats;
    }

    @Transactional
    public UserDto submitStudentIdVerification(StudentVerificationRequestDto dto) {
        User user = authService.getAuthenticatedUser();

        user.setIdCardImageUrl(dto.getIdCardImageUrl().trim());
        if (dto.getCollegeName() != null && !dto.getCollegeName().isBlank()) {
            user.setCollegeName(dto.getCollegeName().trim());
        }
        if (dto.getCollegeDomain() != null && !dto.getCollegeDomain().isBlank()) {
            user.setCollegeDomain(dto.getCollegeDomain().trim());
        }
        user.setVerificationStatus(VerificationStatus.PENDING_REVIEW);

        User saved = userRepository.save(user);
        log.info("[VERIFICATION-SUBMITTED] userId={}, email='{}', idCardUrl='{}'",
                saved.getId(), saved.getEmail(), saved.getIdCardImageUrl());

        return authService.mapToUserDto(saved);
    }

    @Transactional
    public UserDto reviewCollegeVerification(Long userId, boolean approve, String note) {
        ensureSuperAdmin();
        User student = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        VerificationStatus newStatus = approve ? VerificationStatus.COLLEGE_VERIFIED : VerificationStatus.REJECTED;
        student.setVerificationStatus(newStatus);
        User saved = userRepository.save(student);

        emailService.sendVerificationUpdate(student.getEmail(), student.getName(), newStatus.name(), note);

        log.info("[ADMIN-VERIFICATION-REVIEW] adminId={}, studentId={}, newStatus={}",
                authService.getAuthenticatedUser().getId(), student.getId(), newStatus);

        return authService.mapToUserDto(saved);
    }

    @Transactional
    public UserDto suspendUser(Long userId, boolean suspend) {
        ensureSuperAdmin();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        user.setSuspended(suspend);
        User saved = userRepository.save(user);
        log.info("[ADMIN-USER-SUSPENSION] adminId={}, targetUserId={}, suspended={}",
                authService.getAuthenticatedUser().getId(), userId, suspend);

        return authService.mapToUserDto(saved);
    }

    @Transactional(readOnly = true)
    public Page<UserDto> getAllUsers(Pageable pageable) {
        ensureSuperAdmin();
        return userRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(authService::mapToUserDto);
    }

    @Transactional(readOnly = true)
    public List<UserDto> getPendingVerifications() {
        ensureSuperAdmin();
        return userRepository.findByVerificationStatus(VerificationStatus.PENDING_REVIEW)
                .stream()
                .map(authService::mapToUserDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<PaymentTransactionResponseDto> getAllTransactions(Pageable pageable) {
        ensureSuperAdmin();
        return paymentTransactionRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::mapToTransactionDto);
    }

    @Transactional(readOnly = true)
    public String exportTransactionsCsv() {
        ensureSuperAdmin();
        List<PaymentTransaction> transactions = paymentTransactionRepository.findAll();

        StringBuilder csv = new StringBuilder();
        csv.append("Transaction ID,Order ID,Listing ID,Listing Title,Buyer ID,Buyer Name,Seller ID,Seller Name,Amount,Currency,Payment Status,Razorpay Order ID,Razorpay Payment ID,Payout Status,Date UTC\n");

        for (PaymentTransaction t : transactions) {
            csv.append(escapeCsv(t.getId().toString())).append(",");
            csv.append(escapeCsv(t.getOrder().getId().toString())).append(",");
            csv.append(escapeCsv(t.getListing().getId().toString())).append(",");
            csv.append(escapeCsv(t.getListing().getTitle())).append(",");
            csv.append(escapeCsv(t.getBuyer().getId().toString())).append(",");
            csv.append(escapeCsv(t.getBuyer().getName())).append(",");
            csv.append(escapeCsv(t.getSeller().getId().toString())).append(",");
            csv.append(escapeCsv(t.getSeller().getName())).append(",");
            csv.append(escapeCsv(t.getAmount().toString())).append(",");
            csv.append(escapeCsv(t.getCurrency())).append(",");
            csv.append(escapeCsv(t.getStatus().name())).append(",");
            csv.append(escapeCsv(t.getRazorpayOrderId() != null ? t.getRazorpayOrderId() : "")).append(",");
            csv.append(escapeCsv(t.getRazorpayPaymentId() != null ? t.getRazorpayPaymentId() : "")).append(",");
            csv.append(escapeCsv(t.getPayoutStatus())).append(",");
            csv.append(escapeCsv(t.getCreatedAt() != null ? t.getCreatedAt().toString() : "")).append("\n");
        }

        return csv.toString();
    }

    private void ensureSuperAdmin() {
        User currentUser = authService.getAuthenticatedUser();
        if (currentUser.getRole() != Role.ROLE_SUPER_ADMIN) {
            throw new ForbiddenException("Administrative access required. Only Super Admins can access this endpoint.");
        }
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    public PaymentTransactionResponseDto mapToTransactionDto(PaymentTransaction t) {
        PaymentTransactionResponseDto dto = new PaymentTransactionResponseDto();
        dto.setId(t.getId());
        dto.setOrderId(t.getOrder().getId());
        dto.setListingId(t.getListing().getId());
        dto.setListingTitle(t.getListing().getTitle());
        dto.setBuyerId(t.getBuyer().getId());
        dto.setBuyerName(t.getBuyer().getName());
        dto.setSellerId(t.getSeller().getId());
        dto.setSellerName(t.getSeller().getName());
        dto.setAmount(t.getAmount());
        dto.setCurrency(t.getCurrency());
        dto.setStatus(t.getStatus());
        dto.setRazorpayOrderId(t.getRazorpayOrderId());
        dto.setRazorpayPaymentId(t.getRazorpayPaymentId());
        dto.setPayoutStatus(t.getPayoutStatus());
        dto.setCreatedAt(t.getCreatedAt());
        return dto;
    }

    private ReviewResponseDto mapReviewToDto(Review review) {
        ReviewResponseDto r = new ReviewResponseDto();
        r.setId(review.getId());
        r.setOrderId(review.getOrder().getId());
        r.setListingId(review.getListing().getId());
        r.setListingTitle(review.getListing().getTitle());
        r.setSellerId(review.getSeller().getId());
        r.setSellerName(review.getSeller().getName());
        r.setReviewerId(review.getReviewer().getId());
        r.setReviewerName(review.getReviewer().getName());
        r.setRating(review.getRating());
        r.setComment(review.getComment());
        r.setVerifiedPurchase(review.isVerifiedPurchase());
        r.setReported(review.isReported());
        r.setReportReason(review.getReportReason());
        r.setModerated(review.isModerated());
        r.setCreatedAt(review.getCreatedAt());
        return r;
    }

    public com.campus.marketplace.dto.EmailDiagnosticResult getEmailDiagnostics() {
        return emailService.diagnoseSmtp();
    }

    public com.campus.marketplace.dto.EmailDiagnosticResult testEmail(String to) {
        return emailService.testSmtpConnection(to);
    }
}
