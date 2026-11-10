package com.campus.marketplace.controller;

import com.campus.marketplace.dto.OrderRequestDto;
import com.campus.marketplace.dto.OrderResponseDto;
import com.campus.marketplace.dto.PaymentInitResponseDto;
import com.campus.marketplace.dto.PaymentVerificationRequestDto;
import com.campus.marketplace.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@Tag(name = "Orders & Payments", description = "Endpoints for order lifecycle and Razorpay checkout")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    @Operation(summary = "Initiate a purchase order for an available listing (reserves item)")
    public ResponseEntity<OrderResponseDto> createOrder(@Valid @RequestBody OrderRequestDto dto) {
        OrderResponseDto created = orderService.createOrder(dto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping("/buyer")
    @Operation(summary = "Get current buyer's order history")
    public ResponseEntity<List<OrderResponseDto>> getMyBuyerOrders() {
        return ResponseEntity.ok(orderService.getMyBuyerOrders());
    }

    @GetMapping("/seller")
    @Operation(summary = "Get current seller's sales orders")
    public ResponseEntity<List<OrderResponseDto>> getMySellerSales() {
        return ResponseEntity.ok(orderService.getMySellerSales());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get order details by ID")
    public ResponseEntity<OrderResponseDto> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    @PostMapping("/{id}/pay")
    @Operation(summary = "Initialize Razorpay payment order for this order")
    public ResponseEntity<PaymentInitResponseDto> initiatePayment(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.initiatePayment(id));
    }

    @PostMapping("/verify-payment")
    @Operation(summary = "Verify Razorpay payment signature server-side and update order to PAID")
    public ResponseEntity<OrderResponseDto> verifyPayment(@Valid @RequestBody PaymentVerificationRequestDto dto) {
        return ResponseEntity.ok(orderService.verifyPayment(dto));
    }

    @PostMapping("/{id}/reconcile")
    @Operation(summary = "Reconcile order payment status directly against Razorpay server-side API")
    public ResponseEntity<OrderResponseDto> reconcilePayment(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.reconcilePayment(id));
    }

    @PostMapping("/webhook")
    @Operation(summary = "Razorpay server-to-server webhook endpoint for payment event notifications")
    public ResponseEntity<Void> handleWebhook(
            @RequestBody String rawPayload,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {
        orderService.handleRazorpayWebhook(rawPayload, signature);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/complete")
    @Operation(summary = "Confirm campus in-person handover and mark order as COMPLETED")
    public ResponseEntity<OrderResponseDto> completeOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.completeOrder(id));
    }

    @PatchMapping("/{id}/cancel")
    @Operation(summary = "Cancel an unpaid order and release the listing reservation")
    public ResponseEntity<OrderResponseDto> cancelOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.cancelOrder(id));
    }
}
