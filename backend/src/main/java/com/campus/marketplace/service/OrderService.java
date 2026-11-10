package com.campus.marketplace.service;

import com.campus.marketplace.dto.OrderRequestDto;
import com.campus.marketplace.dto.OrderResponseDto;
import com.campus.marketplace.dto.PaymentInitResponseDto;
import com.campus.marketplace.dto.PaymentVerificationRequestDto;
import com.campus.marketplace.entity.*;
import com.campus.marketplace.exception.BadRequestException;
import com.campus.marketplace.exception.ForbiddenException;
import com.campus.marketplace.exception.ResourceNotFoundException;
import com.campus.marketplace.repository.ListingRepository;
import com.campus.marketplace.repository.OrderRepository;
import com.campus.marketplace.repository.PaymentTransactionRepository;
import com.campus.marketplace.repository.ReviewRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    public static final int RESERVATION_EXPIRATION_MINUTES = 15;

    private final OrderRepository orderRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final ListingRepository listingRepository;
    private final AuthService authService;
    private final RazorpayService razorpayService;
    private final ReviewRepository reviewRepository;
    private final EmailService emailService;

    public OrderService(OrderRepository orderRepository,
                        PaymentTransactionRepository paymentTransactionRepository,
                        ListingRepository listingRepository,
                        AuthService authService,
                        RazorpayService razorpayService,
                        ReviewRepository reviewRepository,
                        EmailService emailService) {
        this.orderRepository = orderRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.listingRepository = listingRepository;
        this.authService = authService;
        this.razorpayService = razorpayService;
        this.reviewRepository = reviewRepository;
        this.emailService = emailService;
    }

    /**
     * Checks if a pending order has exceeded the reservation hold window (15 minutes).
     */
    public boolean isOrderExpired(Order order) {
        if (order == null || order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            return false;
        }
        if (order.getCreatedAt() == null) {
            return false;
        }
        return order.getCreatedAt().plusMinutes(RESERVATION_EXPIRATION_MINUTES).isBefore(LocalDateTime.now());
    }

    /**
     * Initiates a new order. Concurrency protection via pessimistic database lock (FOR UPDATE):
     * sets the listing status to RESERVED so no other student can buy it concurrently.
     * Automatically clears expired reservations older than 15 minutes.
     * If the current buyer already has an active (non-expired) PENDING_PAYMENT order for this listing, reuses it.
     */
    @Transactional
    public OrderResponseDto createOrder(OrderRequestDto dto) {
        User buyer = authService.getAuthenticatedUser();

        // 1. Fetch listing with pessimistic write lock (FOR UPDATE) to guarantee atomic reservation
        Listing listing = listingRepository.findByIdForUpdate(dto.getListingId())
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found with ID: " + dto.getListingId()));

        // 2. Reject self-purchase attempt
        if (listing.getSeller().getId().equals(buyer.getId())) {
            throw new BadRequestException("You cannot buy your own listing");
        }

        // Check if there was any prior transaction for this listing and buyer with a captured Razorpay payment
        var priorTx = paymentTransactionRepository.findFirstByListingIdAndBuyerIdOrderByCreatedAtDesc(listing.getId(), buyer.getId());
        if (priorTx.isPresent()) {
            PaymentTransaction pTx = priorTx.get();
            if (pTx.getStatus() == PaymentStatus.SUCCESS && pTx.getOrder().getStatus() == OrderStatus.PAID) {
                return mapToDto(pTx.getOrder(), buyer);
            }
            if (pTx.getRazorpayOrderId() != null && !pTx.getRazorpayOrderId().isBlank() && !pTx.getRazorpayOrderId().startsWith("order_test_")) {
                List<com.campus.marketplace.dto.RazorpayPaymentDetails> payments = razorpayService.fetchPaymentsForOrder(pTx.getRazorpayOrderId());
                for (com.campus.marketplace.dto.RazorpayPaymentDetails p : payments) {
                    if ("captured".equalsIgnoreCase(p.getStatus()) || "authorized".equalsIgnoreCase(p.getStatus())) {
                        log.info("[CREATE-ORDER-RECOVERED] Existing Razorpay payment {} found for buyer {} on listing {}. Reconciling order id={} to PAID.",
                                p.getId(), buyer.getId(), listing.getId(), pTx.getOrder().getId());
                        pTx.setStatus(PaymentStatus.SUCCESS);
                        pTx.setRazorpayPaymentId(p.getId());
                        paymentTransactionRepository.save(pTx);
                        Order recoveredOrder = pTx.getOrder();
                        recoveredOrder.setStatus(OrderStatus.PAID);
                        orderRepository.save(recoveredOrder);
                        listing.setStatus(ListingStatus.SOLD);
                        listingRepository.save(listing);
                        return mapToDto(recoveredOrder, buyer);
                    }
                }
            }
        }

        // 3. Clean up any expired pending orders for this listing before evaluating availability
        List<Order> pendingOrders = orderRepository.findByListingIdAndStatus(listing.getId(), OrderStatus.PENDING_PAYMENT);
        for (Order pending : pendingOrders) {
            if (isOrderExpired(pending)) {
                log.info("[RESERVATION-EXPIRED] Auto-cancelling expired pending order id={} for listing id={}",
                        pending.getId(), listing.getId());
                pending.setStatus(OrderStatus.CANCELLED);
                orderRepository.save(pending);

                paymentTransactionRepository.findByOrderId(pending.getId()).ifPresent(tx -> {
                    if (tx.getStatus() != PaymentStatus.SUCCESS) {
                        tx.setStatus(PaymentStatus.FAILED);
                        paymentTransactionRepository.save(tx);
                    }
                });
            }
        }

        // 4. If all pending orders were expired and listing was RESERVED, restore to AVAILABLE
        boolean hasActivePending = orderRepository.existsByListingIdAndStatusIn(
                listing.getId(), Arrays.asList(OrderStatus.PENDING_PAYMENT, OrderStatus.PAID));
        if (!hasActivePending && listing.getStatus() == ListingStatus.RESERVED) {
            log.info("[RESERVATION-RELEASED] Reverting listing id={} from RESERVED to AVAILABLE after expired orders",
                    listing.getId());
            listing.setStatus(ListingStatus.AVAILABLE);
            listingRepository.save(listing);
        }

        // 5. Idempotent retry: If current buyer already has an active (non-expired) pending order, reuse it
        var existingOrder = orderRepository.findFirstByBuyerIdAndListingIdAndStatus(
                buyer.getId(), listing.getId(), OrderStatus.PENDING_PAYMENT);
        if (existingOrder.isPresent() && !isOrderExpired(existingOrder.get())) {
            log.info("[ORDER-REUSED] Reusing active pending order id={} for buyer id={}",
                    existingOrder.get().getId(), buyer.getId());
            return mapToDto(existingOrder.get(), buyer);
        }

        // 6. Distinct error messages for each state
        if (listing.getStatus() == ListingStatus.ARCHIVED) {
            throw new BadRequestException("This listing has been archived and is no longer available for purchase.");
        }

        if (listing.getStatus() == ListingStatus.SOLD) {
            throw new BadRequestException("This item has already been sold.");
        }

        if (listing.getStatus() == ListingStatus.RESERVED || hasActivePending) {
            throw new BadRequestException("This listing is currently reserved by another student. Reservations automatically release if checkout is not completed within 15 minutes.");
        }

        if (listing.getStatus() != ListingStatus.AVAILABLE) {
            throw new BadRequestException("This item is not available for purchase (Status: " + listing.getStatus() + ").");
        }

        // 7. Atomic reservation
        listing.setStatus(ListingStatus.RESERVED);
        listingRepository.save(listing);

        Order order = new Order();
        order.setBuyer(buyer);
        order.setSeller(listing.getSeller());
        order.setListing(listing);
        order.setAmount(listing.getPrice());
        order.setStatus(OrderStatus.PENDING_PAYMENT);
        order.setPickupNotes(dto.getPickupNotes());

        Order saved = orderRepository.save(order);
        log.info("[ORDER-CREATED] id={}, listingId={}, buyerId={}, sellerId={}, amount={}",
                saved.getId(), listing.getId(), buyer.getId(), listing.getSeller().getId(), saved.getAmount());

        // 8. Send emails asynchronously without blocking transaction
        try {
            if (!saved.isBuyerOrderEmailSent()) {
                emailService.sendOrderConfirmation(com.campus.marketplace.dto.OrderEmailPayload.from(saved, null));
            }
            if (!saved.isSellerOrderEmailSent()) {
                emailService.sendSellerOrderNotification(com.campus.marketplace.dto.OrderEmailPayload.from(saved, null));
            }
        } catch (Exception e) {
            log.warn("[ORDER-EMAIL-WARN] Non-blocking email dispatch warning: {}", e.getMessage());
        }

        return mapToDto(saved, buyer);
    }

    @Transactional
    public PaymentInitResponseDto initiatePayment(Long orderId) {
        User buyer = authService.getAuthenticatedUser();
        Order order = findOrderOrThrow(orderId);

        if (!order.getBuyer().getId().equals(buyer.getId()) && buyer.getRole() != Role.ROLE_SUPER_ADMIN) {
            throw new ForbiddenException("Only the buyer who initiated this order can make a payment.");
        }

        if (order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new BadRequestException("Order is not in PENDING_PAYMENT status (current: " + order.getStatus() + ")");
        }

        String razorpayOrderId = razorpayService.createRazorpayOrder(order.getId(), order.getAmount());

        // Create or update payment transaction record
        PaymentTransaction transaction = paymentTransactionRepository.findByOrderId(order.getId())
                .orElseGet(() -> {
                    PaymentTransaction pt = new PaymentTransaction();
                    pt.setOrder(order);
                    pt.setBuyer(buyer);
                    pt.setSeller(order.getSeller());
                    pt.setListing(order.getListing());
                    pt.setAmount(order.getAmount());
                    pt.setCurrency(razorpayService.getCurrency());
                    return pt;
                });

        transaction.setRazorpayOrderId(razorpayOrderId);
        transaction.setStatus(PaymentStatus.CREATED);
        paymentTransactionRepository.save(transaction);

        PaymentInitResponseDto response = new PaymentInitResponseDto();
        response.setOrderId(order.getId());
        response.setRazorpayOrderId(razorpayOrderId);
        response.setAmount(order.getAmount());
        response.setAmountInPaise(order.getAmount().multiply(new java.math.BigDecimal(100)).longValue());
        response.setCurrency(razorpayService.getCurrency());
        response.setKeyId(razorpayService.getKeyId());
        response.setListingTitle(order.getListing().getTitle());
        response.setBuyerName(buyer.getName());
        response.setBuyerEmail(buyer.getEmail());
        response.setPayoutDisclaimer(RazorpayService.PAYOUT_DISCLAIMER);

        return response;
    }

    @Transactional
    public OrderResponseDto verifyPayment(PaymentVerificationRequestDto dto) {
        User buyer = authService.getAuthenticatedUser();
        Order order = findOrderOrThrow(dto.getOrderId());

        if (!order.getBuyer().getId().equals(buyer.getId()) && buyer.getRole() != Role.ROLE_SUPER_ADMIN) {
            throw new ForbiddenException("Unauthorized to verify payment for this order.");
        }

        // Idempotent handling: if already PAID or COMPLETED, return cleanly
        if (order.getStatus() == OrderStatus.PAID || order.getStatus() == OrderStatus.COMPLETED) {
            log.info("[PAYMENT-IDEMPOTENT] Order id={} already verified as PAID/COMPLETED", order.getId());
            return mapToDto(order, buyer);
        }

        PaymentTransaction transaction = paymentTransactionRepository.findByOrderId(order.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment transaction not found for order ID: " + order.getId()));

        String storedRazorpayOrderId = transaction.getRazorpayOrderId();

        // Validate that client-provided order ID matches internal transaction record
        if (dto.getRazorpayOrderId() != null && !dto.getRazorpayOrderId().isBlank()) {
            if (storedRazorpayOrderId != null && !storedRazorpayOrderId.equals(dto.getRazorpayOrderId().trim())) {
                log.warn("[PAYMENT-ORDER-MISMATCH] Client submitted razorpayOrderId='{}' but stored='{}'",
                        dto.getRazorpayOrderId(), storedRazorpayOrderId);
                throw new BadRequestException("Razorpay order ID mismatch with internal transaction records.");
            }
        }

        // 1. Primary verification: HMAC-SHA256 signature using the stored Razorpay order ID
        boolean validSignature = razorpayService.verifySignature(
                storedRazorpayOrderId,
                dto.getRazorpayPaymentId(),
                dto.getRazorpaySignature()
        );

        // 2. Server-side verification fallback: Query Razorpay API directly if client signature check failed
        if (!validSignature) {
            log.info("[PAYMENT-FALLBACK-CHECK] Signature unverified. Invoking server-side Razorpay API for paymentId='{}'",
                    dto.getRazorpayPaymentId());
            com.campus.marketplace.dto.RazorpayPaymentDetails paymentDetails =
                    razorpayService.fetchPaymentDetails(dto.getRazorpayPaymentId());

            if (paymentDetails != null &&
                ("captured".equalsIgnoreCase(paymentDetails.getStatus()) || "authorized".equalsIgnoreCase(paymentDetails.getStatus()))) {
                long expectedAmountPaise = order.getAmount().multiply(new java.math.BigDecimal(100)).longValue();
                boolean amountMatches = paymentDetails.getAmount() == null || paymentDetails.getAmount() == expectedAmountPaise;
                boolean orderMatches = paymentDetails.getOrderId() == null || paymentDetails.getOrderId().equals(storedRazorpayOrderId);
                boolean currencyMatches = paymentDetails.getCurrency() == null || paymentDetails.getCurrency().equalsIgnoreCase(transaction.getCurrency());

                if (amountMatches && orderMatches && currencyMatches) {
                    log.info("[PAYMENT-SERVER-API-SUCCESS] Payment verified directly with Razorpay API!");
                    validSignature = true;
                } else {
                    log.warn("[PAYMENT-SERVER-MISMATCH] Razorpay API mismatch: amountMatches={}, orderMatches={}, currencyMatches={}",
                            amountMatches, orderMatches, currencyMatches);
                    transaction.setStatus(PaymentStatus.FAILED);
                    paymentTransactionRepository.save(transaction);
                    if (!amountMatches) {
                        throw new BadRequestException("Payment verification failed: Amount mismatch between order and payment record.");
                    }
                    if (!currencyMatches) {
                        throw new BadRequestException("Payment verification failed: Currency mismatch between order and payment record.");
                    }
                    if (!orderMatches) {
                        throw new BadRequestException("Payment verification failed: Order reference mismatch.");
                    }
                }
            }
        }

        if (!validSignature) {
            transaction.setStatus(PaymentStatus.FAILED);
            paymentTransactionRepository.save(transaction);
            log.warn("[PAYMENT-SIGNATURE-REJECTED] Order id={}, razorpayOrderId={}", order.getId(), storedRazorpayOrderId);
            throw new BadRequestException("Invalid payment signature. Payment verification failed on server.");
        }

        // Success transition
        transaction.setStatus(PaymentStatus.SUCCESS);
        transaction.setRazorpayPaymentId(dto.getRazorpayPaymentId());
        transaction.setRazorpaySignature(dto.getRazorpaySignature());
        paymentTransactionRepository.save(transaction);

        order.setStatus(OrderStatus.PAID);
        Order updatedOrder = orderRepository.save(order);

        // Transition listing status to SOLD
        Listing listing = order.getListing();
        listing.setStatus(ListingStatus.SOLD);
        listingRepository.save(listing);

        // Dispatch async order confirmation emails to buyer and seller (idempotently)
        try {
            if (!updatedOrder.isBuyerPaymentEmailSent()) {
                emailService.sendPaymentReceipt(com.campus.marketplace.dto.OrderEmailPayload.from(updatedOrder, dto.getRazorpayPaymentId()));
            }
            if (!updatedOrder.isSellerOrderEmailSent()) {
                emailService.sendSellerPaymentNotification(com.campus.marketplace.dto.OrderEmailPayload.from(updatedOrder, dto.getRazorpayPaymentId()));
            }
            log.info("[PAYMENT-EMAILS-DISPATCHED] Confirmation dispatched for order id={}", updatedOrder.getId());
        } catch (Exception e) {
            log.warn("[PAYMENT-EMAIL-FAILED] Failed to dispatch order confirmation emails: {}", e.getMessage());
        }

        log.info("[PAYMENT-VERIFIED-SUCCESS] Order id={}, amount={}, razorpayPaymentId={}",
                order.getId(), order.getAmount(), dto.getRazorpayPaymentId());

        return mapToDto(updatedOrder, buyer);
    }

    /**
     * Reconciles a pending order directly against Razorpay's API status.
     * Prevents requiring buyers to re-pay when payment already succeeded.
     */
    @Transactional
    public OrderResponseDto reconcilePayment(Long orderId) {
        User currentUser = authService.getAuthenticatedUser();
        Order order = findOrderOrThrow(orderId);

        boolean isBuyer = order.getBuyer().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == Role.ROLE_SUPER_ADMIN;
        if (!isBuyer && !isAdmin) {
            throw new ForbiddenException("Unauthorized to reconcile this order.");
        }

        if (order.getStatus() == OrderStatus.PAID || order.getStatus() == OrderStatus.COMPLETED) {
            return mapToDto(order, currentUser);
        }

        PaymentTransaction transaction = paymentTransactionRepository.findByOrderId(order.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment transaction not found for order ID: " + order.getId()));

        com.campus.marketplace.dto.RazorpayPaymentDetails matchedPayment = null;
        String paymentIdToQuery = transaction.getRazorpayPaymentId();

        if (paymentIdToQuery != null && !paymentIdToQuery.isBlank()) {
            matchedPayment = razorpayService.fetchPaymentDetails(paymentIdToQuery);
        }

        if (matchedPayment == null && transaction.getRazorpayOrderId() != null && !transaction.getRazorpayOrderId().isBlank()) {
            List<com.campus.marketplace.dto.RazorpayPaymentDetails> orderPayments =
                    razorpayService.fetchPaymentsForOrder(transaction.getRazorpayOrderId());
            for (com.campus.marketplace.dto.RazorpayPaymentDetails p : orderPayments) {
                if ("captured".equalsIgnoreCase(p.getStatus()) || "authorized".equalsIgnoreCase(p.getStatus())) {
                    matchedPayment = p;
                    break;
                }
            }
        }

        if (matchedPayment != null &&
            ("captured".equalsIgnoreCase(matchedPayment.getStatus()) || "authorized".equalsIgnoreCase(matchedPayment.getStatus()))) {

            long expectedAmountPaise = order.getAmount().multiply(new java.math.BigDecimal(100)).longValue();
            boolean amountMatches = matchedPayment.getAmount() == null || matchedPayment.getAmount() == expectedAmountPaise;
            boolean currencyMatches = matchedPayment.getCurrency() == null || matchedPayment.getCurrency().equalsIgnoreCase(transaction.getCurrency());

            if (amountMatches && currencyMatches) {
                transaction.setStatus(PaymentStatus.SUCCESS);
                transaction.setRazorpayPaymentId(matchedPayment.getId());
                paymentTransactionRepository.save(transaction);

                order.setStatus(OrderStatus.PAID);
                Order saved = orderRepository.save(order);

                Listing listing = order.getListing();
                listing.setStatus(ListingStatus.SOLD);
                listingRepository.save(listing);

                try {
                    if (!saved.isBuyerPaymentEmailSent()) {
                        emailService.sendPaymentReceipt(com.campus.marketplace.dto.OrderEmailPayload.from(saved, matchedPayment.getId()));
                    }
                    if (!saved.isSellerOrderEmailSent()) {
                        emailService.sendSellerPaymentNotification(com.campus.marketplace.dto.OrderEmailPayload.from(saved, matchedPayment.getId()));
                    }
                } catch (Exception e) {
                    log.warn("[RECONCILE-EMAIL-WARN] Error dispatching reconcile emails: {}", e.getMessage());
                }

                log.info("[ORDER-RECONCILED] Order id={} successfully reconciled to PAID from Razorpay API payment id={}",
                        order.getId(), matchedPayment.getId());
                return mapToDto(saved, currentUser);
            }
        }

        log.info("[ORDER-RECONCILE-PENDING] Order id={} remains in status={}", order.getId(), order.getStatus());
        return mapToDto(order, currentUser);
    }

    /**
     * Handles server-to-server Razorpay webhooks idempotently with signature verification.
     */
    @Transactional
    public void handleRazorpayWebhook(String rawPayload, String signature) {
        if (!razorpayService.verifyWebhookSignature(rawPayload, signature)) {
            log.warn("[WEBHOOK-REJECTED] Invalid Razorpay webhook signature");
            throw new BadRequestException("Invalid webhook signature");
        }

        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(rawPayload);
            String event = root.path("event").asText("");

            log.info("[WEBHOOK-EVENT-RECEIVED] Event='{}'", event);

            if ("payment.captured".equals(event) || "order.paid".equals(event)) {
                com.fasterxml.jackson.databind.JsonNode paymentEntity = root.path("payload").path("payment").path("entity");
                String rzpPaymentId = paymentEntity.path("id").asText(null);
                String rzpOrderId = paymentEntity.path("order_id").asText(null);

                if (rzpOrderId == null || rzpOrderId.isBlank()) {
                    rzpOrderId = root.path("payload").path("order").path("entity").path("id").asText(null);
                }

                if (rzpOrderId != null && !rzpOrderId.isBlank()) {
                    var txOpt = paymentTransactionRepository.findByRazorpayOrderId(rzpOrderId);
                    if (txOpt.isPresent()) {
                        PaymentTransaction tx = txOpt.get();
                        Order order = tx.getOrder();

                        if (order.getStatus() != OrderStatus.PAID && order.getStatus() != OrderStatus.COMPLETED) {
                            tx.setStatus(PaymentStatus.SUCCESS);
                            if (rzpPaymentId != null) tx.setRazorpayPaymentId(rzpPaymentId);
                            paymentTransactionRepository.save(tx);

                            order.setStatus(OrderStatus.PAID);
                            Order savedOrder = orderRepository.save(order);

                            Listing listing = order.getListing();
                            listing.setStatus(ListingStatus.SOLD);
                            listingRepository.save(listing);

                            try {
                                if (!savedOrder.isBuyerPaymentEmailSent() && rzpPaymentId != null) {
                                    emailService.sendPaymentReceipt(com.campus.marketplace.dto.OrderEmailPayload.from(savedOrder, rzpPaymentId));
                                    savedOrder.setBuyerPaymentEmailSent(true);
                                    orderRepository.save(savedOrder);
                                }
                            } catch (Exception e) {
                                log.warn("[WEBHOOK-EMAIL-WARN] Error dispatching webhook receipt: {}", e.getMessage());
                            }
                            log.info("[WEBHOOK-ORDER-PAID] Order id={} marked PAID via webhook", order.getId());
                        }
                    }
                }
            } else if ("payment.failed".equals(event)) {
                com.fasterxml.jackson.databind.JsonNode paymentEntity = root.path("payload").path("payment").path("entity");
                String rzpOrderId = paymentEntity.path("order_id").asText(null);

                if (rzpOrderId != null && !rzpOrderId.isBlank()) {
                    paymentTransactionRepository.findByRazorpayOrderId(rzpOrderId).ifPresent(tx -> {
                        // Never overwrite an already verified PAID order with a stale failed webhook
                        if (tx.getOrder().getStatus() != OrderStatus.PAID && tx.getOrder().getStatus() != OrderStatus.COMPLETED) {
                            tx.setStatus(PaymentStatus.FAILED);
                            paymentTransactionRepository.save(tx);
                            log.info("[WEBHOOK-PAYMENT-FAILED] Transaction for order id={} updated to FAILED via webhook", tx.getOrder().getId());
                        }
                    });
                }
            }
        } catch (Exception e) {
            log.error("[WEBHOOK-PROCESSING-ERROR] Failed to process webhook: {}", e.getMessage());
            throw new BadRequestException("Webhook processing error: " + e.getMessage());
        }
    }

    @Transactional
    public OrderResponseDto completeOrder(Long orderId) {
        User currentUser = authService.getAuthenticatedUser();
        Order order = findOrderOrThrow(orderId);

        boolean isBuyer = order.getBuyer().getId().equals(currentUser.getId());
        boolean isSeller = order.getSeller().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == Role.ROLE_SUPER_ADMIN;

        if (!isBuyer && !isSeller && !isAdmin) {
            throw new ForbiddenException("You are not authorized to complete this order.");
        }

        if (order.getStatus() != OrderStatus.PAID) {
            throw new BadRequestException("Only PAID orders can be marked as COMPLETED (current status: " + order.getStatus() + ")");
        }

        order.setStatus(OrderStatus.COMPLETED);
        Order saved = orderRepository.save(order);
        log.info("[ORDER-COMPLETED] id={}, completedByUserId={}", order.getId(), currentUser.getId());
        return mapToDto(saved, currentUser);
    }

    @Transactional
    public OrderResponseDto cancelOrder(Long orderId) {
        User currentUser = authService.getAuthenticatedUser();
        Order order = findOrderOrThrow(orderId);

        boolean isBuyer = order.getBuyer().getId().equals(currentUser.getId());
        boolean isSeller = order.getSeller().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == Role.ROLE_SUPER_ADMIN;

        if (!isBuyer && !isSeller && !isAdmin) {
            throw new ForbiddenException("You are not authorized to cancel this order.");
        }

        if (order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new BadRequestException("Only orders in PENDING_PAYMENT status can be cancelled.");
        }

        // Before cancelling, verify that payment was not captured on Razorpay
        var txOpt = paymentTransactionRepository.findByOrderId(order.getId());
        if (txOpt.isPresent()) {
            PaymentTransaction tx = txOpt.get();
            if (tx.getStatus() == PaymentStatus.SUCCESS) {
                throw new BadRequestException("Cannot cancel order: Payment has already been verified.");
            }
            if (tx.getRazorpayOrderId() != null && !tx.getRazorpayOrderId().isBlank() && !tx.getRazorpayOrderId().startsWith("order_test_")) {
                List<com.campus.marketplace.dto.RazorpayPaymentDetails> payments = razorpayService.fetchPaymentsForOrder(tx.getRazorpayOrderId());
                for (com.campus.marketplace.dto.RazorpayPaymentDetails p : payments) {
                    if ("captured".equalsIgnoreCase(p.getStatus()) || "authorized".equalsIgnoreCase(p.getStatus())) {
                        log.info("[CANCEL-BLOCKED] Order id={} has captured Razorpay payment id={}. Reconciling to PAID instead of cancelling.",
                                order.getId(), p.getId());
                        tx.setStatus(PaymentStatus.SUCCESS);
                        tx.setRazorpayPaymentId(p.getId());
                        paymentTransactionRepository.save(tx);
                        order.setStatus(OrderStatus.PAID);
                        Order saved = orderRepository.save(order);
                        Listing listing = order.getListing();
                        listing.setStatus(ListingStatus.SOLD);
                        listingRepository.save(listing);
                        throw new BadRequestException("Cannot cancel order: Payment has already been captured by Razorpay. Your order is confirmed.");
                    }
                }
            }
        }

        order.setStatus(OrderStatus.CANCELLED);
        Order saved = orderRepository.save(order);

        paymentTransactionRepository.findByOrderId(order.getId()).ifPresent(tx -> {
            if (tx.getStatus() != PaymentStatus.SUCCESS) {
                tx.setStatus(PaymentStatus.FAILED);
                paymentTransactionRepository.save(tx);
            }
        });

        // Revert listing back to AVAILABLE if no other active order exists
        Listing listing = order.getListing();
        if (listing != null && listing.getStatus() == ListingStatus.RESERVED) {
            boolean hasOtherActive = orderRepository.existsByListingIdAndStatusIn(
                    listing.getId(), Arrays.asList(OrderStatus.PENDING_PAYMENT, OrderStatus.PAID));
            if (!hasOtherActive) {
                listing.setStatus(ListingStatus.AVAILABLE);
                listingRepository.save(listing);
            }
        }

        log.info("[ORDER-CANCELLED] id={}, cancelledByUserId={}", order.getId(), currentUser.getId());
        return mapToDto(saved, currentUser);
    }

    /**
     * Periodic background job: automatically expires stale PENDING_PAYMENT orders
     * older than 15 minutes and restores the listing back to AVAILABLE.
     */
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void releaseExpiredReservations() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(RESERVATION_EXPIRATION_MINUTES);
        List<Order> expiredOrders = orderRepository.findByStatusAndCreatedAtBefore(OrderStatus.PENDING_PAYMENT, cutoff);
        for (Order order : expiredOrders) {
            log.info("[SCHEDULED-CLEANUP] Auto-cancelling expired order id={} (created: {})",
                    order.getId(), order.getCreatedAt());
            order.setStatus(OrderStatus.CANCELLED);
            orderRepository.save(order);

            paymentTransactionRepository.findByOrderId(order.getId()).ifPresent(tx -> {
                if (tx.getStatus() != PaymentStatus.SUCCESS) {
                    tx.setStatus(PaymentStatus.FAILED);
                    paymentTransactionRepository.save(tx);
                }
            });

            Listing listing = order.getListing();
            if (listing != null && listing.getStatus() == ListingStatus.RESERVED) {
                boolean otherActive = orderRepository.existsByListingIdAndStatusIn(
                        listing.getId(), Arrays.asList(OrderStatus.PENDING_PAYMENT, OrderStatus.PAID));
                if (!otherActive) {
                    listing.setStatus(ListingStatus.AVAILABLE);
                    listingRepository.save(listing);
                    log.info("[SCHEDULED-CLEANUP] Reverted listing id={} back to AVAILABLE", listing.getId());
                }
            }
        }
    }

    /**
     * Periodic background retry job for unnotified paid orders.
     * Retries sending confirmation emails to buyer/seller if SMTP was previously unavailable.
     */
    @Scheduled(fixedDelay = 180000)
    public void retryFailedEmailNotifications() {
        try {
            List<Order> unnotified = orderRepository.findUnnotifiedPaidOrders(Arrays.asList(OrderStatus.PAID, OrderStatus.COMPLETED));
            if (unnotified.isEmpty()) {
                return;
            }
            log.info("[EMAIL-RETRY-JOB] Found {} paid orders needing email notification retries", unnotified.size());
            for (Order order : unnotified) {
                String paymentId = paymentTransactionRepository.findByOrderId(order.getId())
                        .map(PaymentTransaction::getRazorpayPaymentId)
                        .orElse("N/A");
                com.campus.marketplace.dto.OrderEmailPayload payload = com.campus.marketplace.dto.OrderEmailPayload.from(order, paymentId);
                if (!order.isBuyerPaymentEmailSent()) {
                    emailService.sendPaymentReceipt(payload);
                }
                if (!order.isSellerOrderEmailSent()) {
                    emailService.sendSellerPaymentNotification(payload);
                }
            }
        } catch (Exception e) {
            log.warn("[EMAIL-RETRY-JOB-WARN] Error checking unnotified orders: {}", e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<OrderResponseDto> getMyBuyerOrders() {
        User buyer = authService.getAuthenticatedUser();
        return orderRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId())
                .stream()
                .map(o -> mapToDto(o, buyer))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OrderResponseDto> getMySellerSales() {
        User seller = authService.getAuthenticatedUser();
        return orderRepository.findBySellerIdOrderByCreatedAtDesc(seller.getId())
                .stream()
                .map(o -> mapToDto(o, seller))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OrderResponseDto getOrderById(Long orderId) {
        User currentUser = authService.getAuthenticatedUser();
        Order order = findOrderOrThrow(orderId);

        boolean isBuyer = order.getBuyer().getId().equals(currentUser.getId());
        boolean isSeller = order.getSeller().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == Role.ROLE_SUPER_ADMIN;

        if (!isBuyer && !isSeller && !isAdmin) {
            throw new ForbiddenException("You are not authorized to view this order.");
        }

        return mapToDto(order, currentUser);
    }

    public Order findOrderOrThrow(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + id));
    }

    public OrderResponseDto mapToDto(Order order, User currentUser) {
        OrderResponseDto dto = new OrderResponseDto();
        dto.setId(order.getId());
        dto.setListingId(order.getListing().getId());
        dto.setListingTitle(order.getListing().getTitle());
        dto.setListingImageUrl(order.getListing().getImageUrl());
        dto.setAmount(order.getAmount());
        dto.setStatus(order.getStatus());
        dto.setPickupNotes(order.getPickupNotes());
        dto.setOrderNumber(order.getId());
        dto.setPickupLocation(order.getListing() != null ? order.getListing().getPickupLocation() : null);

        paymentTransactionRepository.findByOrderId(order.getId()).ifPresent(tx -> {
            dto.setPaymentStatus(tx.getStatus() != null ? tx.getStatus().name() : null);
            dto.setPaymentProvider("RAZORPAY");
            dto.setRazorpayOrderId(tx.getRazorpayOrderId());
            dto.setRazorpayPaymentId(tx.getRazorpayPaymentId());
        });

        if (dto.getPaymentStatus() == null) {
            dto.setPaymentStatus(order.getStatus() == OrderStatus.PAID || order.getStatus() == OrderStatus.COMPLETED
                    ? "SUCCESS" : order.getStatus() == OrderStatus.CANCELLED ? "FAILED" : "PENDING");
            dto.setPaymentProvider("RAZORPAY");
        }

        dto.setBuyerId(order.getBuyer().getId());
        dto.setBuyerName(order.getBuyer().getName());
        dto.setBuyerEmail(order.getBuyer().getEmail());

        dto.setSellerId(order.getSeller().getId());
        dto.setSellerName(order.getSeller().getName());
        dto.setSellerEmail(order.getSeller().getEmail());
        dto.setSellerPhone(order.getSeller().getPhone());

        boolean isBuyer = order.getBuyer().getId().equals(currentUser.getId());
        boolean eligible = isBuyer && (order.getStatus() == OrderStatus.PAID || order.getStatus() == OrderStatus.COMPLETED);
        dto.setEligibleForReview(eligible);
        dto.setAlreadyReviewed(reviewRepository.existsByOrderIdAndReviewerId(order.getId(), order.getBuyer().getId()));

        dto.setCreatedAt(order.getCreatedAt());
        dto.setUpdatedAt(order.getUpdatedAt());
        return dto;
    }
}
