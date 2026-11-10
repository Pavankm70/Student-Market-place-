package com.campus.marketplace.service;

import com.campus.marketplace.dto.OrderEmailPayload;
import com.campus.marketplace.dto.OrderRequestDto;
import com.campus.marketplace.dto.OrderResponseDto;
import com.campus.marketplace.dto.PaymentVerificationRequestDto;
import com.campus.marketplace.entity.*;
import com.campus.marketplace.exception.BadRequestException;
import com.campus.marketplace.repository.ListingRepository;
import com.campus.marketplace.repository.OrderRepository;
import com.campus.marketplace.repository.PaymentTransactionRepository;
import com.campus.marketplace.repository.ReviewRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private AuthService authService;

    @Mock
    private RazorpayService razorpayService;

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private OrderService orderService;

    private User buyer;
    private User seller;
    private Listing listing;

    @BeforeEach
    void setUp() {
        buyer = new User("Buyer Student", "buyer@nmit.ac.in", "pass123");
        buyer.setId(101L);

        seller = new User("Seller Student", "seller@nmit.ac.in", "pass123");
        seller.setId(102L);

        listing = new Listing();
        listing.setId(201L);
        listing.setTitle("Engineering Mathematics Textbook");
        listing.setPrice(new BigDecimal("450.00"));
        listing.setStatus(ListingStatus.AVAILABLE);
        listing.setSeller(seller);
    }

    private PaymentTransaction createTx(Order order, String rzpOrderId, BigDecimal amount) {
        PaymentTransaction tx = new PaymentTransaction();
        tx.setOrder(order);
        tx.setBuyer(order.getBuyer());
        tx.setSeller(order.getSeller());
        tx.setListing(order.getListing());
        tx.setAmount(amount);
        tx.setCurrency("INR");
        tx.setRazorpayOrderId(rzpOrderId);
        tx.setStatus(PaymentStatus.CREATED);
        return tx;
    }

    @Test
    @DisplayName("Successfully creates order and reserves available listing")
    void testCreateOrderSuccess() {
        when(authService.getAuthenticatedUser()).thenReturn(buyer);
        when(listingRepository.findByIdForUpdate(201L)).thenReturn(Optional.of(listing));
        when(orderRepository.findFirstByBuyerIdAndListingIdAndStatus(101L, 201L, OrderStatus.PENDING_PAYMENT))
                .thenReturn(Optional.empty());
        when(orderRepository.existsByListingIdAndStatusIn(eq(201L), any())).thenReturn(false);

        Order savedOrder = new Order(buyer, seller, listing, listing.getPrice(), OrderStatus.PENDING_PAYMENT);
        savedOrder.setId(501L);
        when(orderRepository.save(any(Order.class))).thenReturn(savedOrder);

        OrderResponseDto result = orderService.createOrder(new OrderRequestDto(201L, "Meet at library gate"));

        assertNotNull(result);
        assertEquals(501L, result.getId());
        assertEquals(OrderStatus.PENDING_PAYMENT, result.getStatus());
        assertEquals(ListingStatus.RESERVED, listing.getStatus(), "Listing should transition to RESERVED status");
        verify(listingRepository).save(listing);
        verify(emailService).sendOrderConfirmation(any(OrderEmailPayload.class));
        verify(emailService).sendSellerOrderNotification(any(OrderEmailPayload.class));
    }

    @Test
    @DisplayName("Idempotent retry: Reuses active pending order for the same buyer and listing")
    void testCreateOrder_ReusesExistingPendingOrder() {
        when(authService.getAuthenticatedUser()).thenReturn(buyer);
        when(listingRepository.findByIdForUpdate(201L)).thenReturn(Optional.of(listing));

        Order existingOrder = new Order(buyer, seller, listing, listing.getPrice(), OrderStatus.PENDING_PAYMENT);
        existingOrder.setId(502L);
        existingOrder.setCreatedAt(java.time.LocalDateTime.now());
        when(orderRepository.findFirstByBuyerIdAndListingIdAndStatus(101L, 201L, OrderStatus.PENDING_PAYMENT))
                .thenReturn(Optional.of(existingOrder));

        OrderResponseDto result = orderService.createOrder(new OrderRequestDto(201L, "Retry"));

        assertNotNull(result);
        assertEquals(502L, result.getId());
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("Prevents seller from buying their own listing")
    void testSellerCannotBuyOwnListing() {
        when(authService.getAuthenticatedUser()).thenReturn(seller);
        when(listingRepository.findByIdForUpdate(201L)).thenReturn(Optional.of(listing));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                orderService.createOrder(new OrderRequestDto(201L, "Self purchase")));

        assertTrue(ex.getMessage().contains("cannot buy your own listing"));
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("Rejects order when item is already SOLD")
    void testCannotOrderSoldListing() {
        listing.setStatus(ListingStatus.SOLD);
        when(authService.getAuthenticatedUser()).thenReturn(buyer);
        when(listingRepository.findByIdForUpdate(201L)).thenReturn(Optional.of(listing));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                orderService.createOrder(new OrderRequestDto(201L, "Purchase attempt")));

        assertTrue(ex.getMessage().contains("already been sold"));
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("Rejects order when another buyer's order is already in progress")
    void testConflictingPurchasePrevention() {
        when(authService.getAuthenticatedUser()).thenReturn(buyer);
        when(listingRepository.findByIdForUpdate(201L)).thenReturn(Optional.of(listing));
        when(orderRepository.findFirstByBuyerIdAndListingIdAndStatus(101L, 201L, OrderStatus.PENDING_PAYMENT))
                .thenReturn(Optional.empty());
        when(orderRepository.existsByListingIdAndStatusIn(eq(201L), any())).thenReturn(true);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                orderService.createOrder(new OrderRequestDto(201L, "Conflict purchase")));

        assertTrue(ex.getMessage().contains("reserved by another student"));
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("Expired pending order is auto-cancelled and allows a new buyer to purchase")
    void testCreateOrder_ExpiredPendingOrder_AutoCancelled_AllowsNewOrder() {
        listing.setStatus(ListingStatus.RESERVED);

        User staleBuyer = new User("Stale Student", "stale@nmit.ac.in", "pass");
        staleBuyer.setId(999L);

        Order staleOrder = new Order(staleBuyer, seller, listing, listing.getPrice(), OrderStatus.PENDING_PAYMENT);
        staleOrder.setId(888L);
        // Created 30 minutes ago (expired)
        staleOrder.setCreatedAt(java.time.LocalDateTime.now().minusMinutes(30));

        when(authService.getAuthenticatedUser()).thenReturn(buyer);
        when(listingRepository.findByIdForUpdate(201L)).thenReturn(Optional.of(listing));
        when(orderRepository.findByListingIdAndStatus(201L, OrderStatus.PENDING_PAYMENT))
                .thenReturn(List.of(staleOrder));
        when(orderRepository.existsByListingIdAndStatusIn(eq(201L), any())).thenReturn(false);
        when(orderRepository.findFirstByBuyerIdAndListingIdAndStatus(101L, 201L, OrderStatus.PENDING_PAYMENT))
                .thenReturn(Optional.empty());

        Order newOrder = new Order(buyer, seller, listing, listing.getPrice(), OrderStatus.PENDING_PAYMENT);
        newOrder.setId(503L);
        when(orderRepository.save(any(Order.class))).thenReturn(newOrder);

        OrderResponseDto result = orderService.createOrder(new OrderRequestDto(201L, "New purchase after expiry"));

        assertNotNull(result);
        assertEquals(503L, result.getId());
        assertEquals(OrderStatus.CANCELLED, staleOrder.getStatus(), "Stale order must be CANCELLED");
        assertEquals(ListingStatus.RESERVED, listing.getStatus(), "Listing should be reserved for new buyer");
    }

    @Test
    @DisplayName("Cancel order releases listing reservation back to AVAILABLE")
    void testCancelOrder_ReleasesReservation() {
        listing.setStatus(ListingStatus.RESERVED);
        Order order = new Order(buyer, seller, listing, listing.getPrice(), OrderStatus.PENDING_PAYMENT);
        order.setId(701L);

        when(authService.getAuthenticatedUser()).thenReturn(buyer);
        when(orderRepository.findById(701L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));
        when(orderRepository.existsByListingIdAndStatusIn(eq(201L), any())).thenReturn(false);

        OrderResponseDto cancelled = orderService.cancelOrder(701L);

        assertNotNull(cancelled);
        assertEquals(OrderStatus.CANCELLED, order.getStatus());
        assertEquals(ListingStatus.AVAILABLE, listing.getStatus(), "Listing must revert to AVAILABLE");
        verify(listingRepository).save(listing);
    }

    @Test
    @DisplayName("Payment verification with authentic signature marks order PAID and transaction SUCCESS")
    void testVerifyPayment_ValidSignature_MarksSuccess() {
        Order order = new Order(buyer, seller, listing, new BigDecimal("450.00"), OrderStatus.PENDING_PAYMENT);
        order.setId(601L);

        PaymentTransaction tx = createTx(order, "order_rzp_601", new BigDecimal("450.00"));

        when(authService.getAuthenticatedUser()).thenReturn(buyer);
        when(orderRepository.findById(601L)).thenReturn(Optional.of(order));
        when(paymentTransactionRepository.findByOrderId(601L)).thenReturn(Optional.of(tx));
        when(razorpayService.verifySignature("order_rzp_601", "pay_abc_123", "valid_sig")).thenReturn(true);
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentVerificationRequestDto dto =
                new PaymentVerificationRequestDto(601L, "order_rzp_601", "pay_abc_123", "valid_sig");

        OrderResponseDto result = orderService.verifyPayment(dto);

        assertNotNull(result);
        assertEquals(OrderStatus.PAID, result.getStatus());
        assertEquals(PaymentStatus.SUCCESS, tx.getStatus());
        assertEquals("pay_abc_123", tx.getRazorpayPaymentId());
        verify(emailService).sendPaymentReceipt(any(OrderEmailPayload.class));
        verify(emailService).sendSellerPaymentNotification(any(OrderEmailPayload.class));
    }

    @Test
    @DisplayName("Payment verification with invalid signature falls back to server-side query; succeeds if captured")
    void testVerifyPayment_FallbackToServerApi_Success() {
        Order order = new Order(buyer, seller, listing, new BigDecimal("450.00"), OrderStatus.PENDING_PAYMENT);
        order.setId(602L);

        PaymentTransaction tx = createTx(order, "order_rzp_602", new BigDecimal("450.00"));

        when(authService.getAuthenticatedUser()).thenReturn(buyer);
        when(orderRepository.findById(602L)).thenReturn(Optional.of(order));
        when(paymentTransactionRepository.findByOrderId(602L)).thenReturn(Optional.of(tx));
        when(razorpayService.verifySignature("order_rzp_602", "pay_xyz_789", "invalid_client_sig")).thenReturn(false);

        // Server API confirms payment was captured for 45000 paise (₹450)
        com.campus.marketplace.dto.RazorpayPaymentDetails apiDetails =
                new com.campus.marketplace.dto.RazorpayPaymentDetails("pay_xyz_789", "captured", "order_rzp_602", 45000L, "INR", true);
        when(razorpayService.fetchPaymentDetails("pay_xyz_789")).thenReturn(apiDetails);
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentVerificationRequestDto dto =
                new PaymentVerificationRequestDto(602L, "order_rzp_602", "pay_xyz_789", "invalid_client_sig");

        OrderResponseDto result = orderService.verifyPayment(dto);

        assertNotNull(result);
        assertEquals(OrderStatus.PAID, result.getStatus());
        assertEquals(PaymentStatus.SUCCESS, tx.getStatus());
    }

    @Test
    @DisplayName("Payment verification rejects when server API indicates amount mismatch")
    void testVerifyPayment_AmountMismatch_Rejects() {
        Order order = new Order(buyer, seller, listing, new BigDecimal("450.00"), OrderStatus.PENDING_PAYMENT);
        order.setId(603L);

        PaymentTransaction tx = createTx(order, "order_rzp_603", new BigDecimal("450.00"));

        when(authService.getAuthenticatedUser()).thenReturn(buyer);
        when(orderRepository.findById(603L)).thenReturn(Optional.of(order));
        when(paymentTransactionRepository.findByOrderId(603L)).thenReturn(Optional.of(tx));
        when(razorpayService.verifySignature("order_rzp_603", "pay_tampered_amt", "some_sig")).thenReturn(false);

        // Server reports ₹100 instead of ₹450
        com.campus.marketplace.dto.RazorpayPaymentDetails apiDetails =
                new com.campus.marketplace.dto.RazorpayPaymentDetails("pay_tampered_amt", "captured", "order_rzp_603", 10000L, "INR", true);
        when(razorpayService.fetchPaymentDetails("pay_tampered_amt")).thenReturn(apiDetails);

        PaymentVerificationRequestDto dto =
                new PaymentVerificationRequestDto(603L, "order_rzp_603", "pay_tampered_amt", "some_sig");

        BadRequestException ex = assertThrows(BadRequestException.class, () -> orderService.verifyPayment(dto));
        assertTrue(ex.getMessage().contains("mismatch"));
    }

    @Test
    @DisplayName("Payment verification rejects when server API indicates currency mismatch")
    void testVerifyPayment_CurrencyMismatch_Rejects() {
        Order order = new Order(buyer, seller, listing, new BigDecimal("450.00"), OrderStatus.PENDING_PAYMENT);
        order.setId(604L);

        PaymentTransaction tx = createTx(order, "order_rzp_604", new BigDecimal("450.00"));

        when(authService.getAuthenticatedUser()).thenReturn(buyer);
        when(orderRepository.findById(604L)).thenReturn(Optional.of(order));
        when(paymentTransactionRepository.findByOrderId(604L)).thenReturn(Optional.of(tx));
        when(razorpayService.verifySignature("order_rzp_604", "pay_curr_mismatch", "sig")).thenReturn(false);

        // Server reports USD instead of INR
        com.campus.marketplace.dto.RazorpayPaymentDetails apiDetails =
                new com.campus.marketplace.dto.RazorpayPaymentDetails("pay_curr_mismatch", "captured", "order_rzp_604", 45000L, "USD", true);
        when(razorpayService.fetchPaymentDetails("pay_curr_mismatch")).thenReturn(apiDetails);

        PaymentVerificationRequestDto dto =
                new PaymentVerificationRequestDto(604L, "order_rzp_604", "pay_curr_mismatch", "sig");

        BadRequestException ex = assertThrows(BadRequestException.class, () -> orderService.verifyPayment(dto));
        assertTrue(ex.getMessage().contains("Currency mismatch"));
    }

    @Test
    @DisplayName("Duplicate callback on already PAID order is idempotent and does not duplicate emails")
    void testVerifyPayment_DuplicateCallbackIdempotency() {
        Order order = new Order(buyer, seller, listing, new BigDecimal("450.00"), OrderStatus.PAID);
        order.setId(605L);
        order.setBuyerPaymentEmailSent(true);

        when(authService.getAuthenticatedUser()).thenReturn(buyer);
        when(orderRepository.findById(605L)).thenReturn(Optional.of(order));

        PaymentVerificationRequestDto dto =
                new PaymentVerificationRequestDto(605L, "order_rzp_605", "pay_dup_123", "sig");

        OrderResponseDto result = orderService.verifyPayment(dto);

        assertNotNull(result);
        assertEquals(OrderStatus.PAID, result.getStatus());
        verify(emailService, never()).sendPaymentReceipt(any(), any());
    }

    @Test
    @DisplayName("Payment success is preserved even if subsequent email delivery encounters an error")
    void testPaymentSuccess_FollowedByEmailFailure_PreservesPaymentSuccess() {
        Order order = new Order(buyer, seller, listing, new BigDecimal("450.00"), OrderStatus.PENDING_PAYMENT);
        order.setId(606L);

        PaymentTransaction tx = createTx(order, "order_rzp_606", new BigDecimal("450.00"));

        when(authService.getAuthenticatedUser()).thenReturn(buyer);
        when(orderRepository.findById(606L)).thenReturn(Optional.of(order));
        when(paymentTransactionRepository.findByOrderId(606L)).thenReturn(Optional.of(tx));
        when(razorpayService.verifySignature("order_rzp_606", "pay_email_fail", "valid_sig")).thenReturn(true);
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Email service throws runtime exception (e.g. SMTP connection timeout)
        doThrow(new RuntimeException("SMTP connection refused")).when(emailService).sendPaymentReceipt(any(), any());

        PaymentVerificationRequestDto dto =
                new PaymentVerificationRequestDto(606L, "order_rzp_606", "pay_email_fail", "valid_sig");

        OrderResponseDto result = orderService.verifyPayment(dto);

        assertNotNull(result);
        assertEquals(OrderStatus.PAID, result.getStatus(), "Order must remain PAID despite email error");
        assertEquals(PaymentStatus.SUCCESS, tx.getStatus(), "Transaction must remain SUCCESS despite email error");
    }

    @Test
    @DisplayName("Reconcile payment checks Razorpay server status and upgrades PENDING order to PAID")
    void testReconcilePayment_Success() {
        Order order = new Order(buyer, seller, listing, new BigDecimal("450.00"), OrderStatus.PENDING_PAYMENT);
        order.setId(607L);

        PaymentTransaction tx = createTx(order, "order_rzp_607", new BigDecimal("450.00"));
        tx.setRazorpayPaymentId("pay_reconcile_123");
        tx.setStatus(PaymentStatus.PENDING);

        when(authService.getAuthenticatedUser()).thenReturn(buyer);
        when(orderRepository.findById(607L)).thenReturn(Optional.of(order));
        when(paymentTransactionRepository.findByOrderId(607L)).thenReturn(Optional.of(tx));

        com.campus.marketplace.dto.RazorpayPaymentDetails apiDetails =
                new com.campus.marketplace.dto.RazorpayPaymentDetails("pay_reconcile_123", "captured", "order_rzp_607", 45000L, "INR", true);
        when(razorpayService.fetchPaymentDetails("pay_reconcile_123")).thenReturn(apiDetails);
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponseDto result = orderService.reconcilePayment(607L);

        assertNotNull(result);
        assertEquals(OrderStatus.PAID, result.getStatus());
        assertEquals(PaymentStatus.SUCCESS, tx.getStatus());
    }

    @Test
    @DisplayName("Webhook with invalid signature throws BadRequestException")
    void testHandleRazorpayWebhook_InvalidSignature_ThrowsBadRequest() {
        String payload = "{\"event\":\"payment.captured\"}";
        when(razorpayService.verifyWebhookSignature(payload, "invalid_sig")).thenReturn(false);

        assertThrows(BadRequestException.class, () ->
                orderService.handleRazorpayWebhook(payload, "invalid_sig"));

        verify(orderRepository, never()).save(any());
        verify(paymentTransactionRepository, never()).save(any());
    }
}
