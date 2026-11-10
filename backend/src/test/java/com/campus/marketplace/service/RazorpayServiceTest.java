package com.campus.marketplace.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

import static org.junit.jupiter.api.Assertions.*;

class RazorpayServiceTest {

    private RazorpayService razorpayService;
    private final String secret = "my_test_razorpay_secret_123";

    @BeforeEach
    void setUp() {
        razorpayService = new RazorpayService(new RestTemplateBuilder());
        ReflectionTestUtils.setField(razorpayService, "keySecret", secret);
        ReflectionTestUtils.setField(razorpayService, "keyId", "rzp_test_test123");
    }

    @Test
    @DisplayName("Valid Razorpay HMAC-SHA256 signature is successfully verified")
    void testValidSignatureVerification() throws Exception {
        String orderId = "order_EKwxwAgItmmMnv";
        String paymentId = "pay_29QQoUBi66xm2f";

        // Compute genuine HMAC SHA256 signature
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(secretKey);
        byte[] hash = mac.doFinal((orderId + "|" + paymentId).getBytes(StandardCharsets.UTF_8));
        String validSignature = HexFormat.of().formatHex(hash);

        boolean result = razorpayService.verifySignature(orderId, paymentId, validSignature);
        assertTrue(result, "Expected authentic signature to be verified successfully");
    }

    @Test
    @DisplayName("Tampered or invalid Razorpay signature is rejected")
    void testTamperedSignatureIsRejected() {
        String orderId = "order_EKwxwAgItmmMnv";
        String paymentId = "pay_29QQoUBi66xm2f";
        String invalidSignature = "invalid_tampered_signature_99999";

        boolean result = razorpayService.verifySignature(orderId, paymentId, invalidSignature);
        assertFalse(result, "Expected tampered signature to be rejected");
    }

    @Test
    @DisplayName("Valid Razorpay Webhook signature is successfully verified")
    void testValidWebhookSignature() throws Exception {
        razorpayService.setWebhookSecret("test_webhook_secret_abc");
        String payload = "{\"event\":\"payment.captured\",\"payload\":{\"payment\":{\"entity\":{\"id\":\"pay_123\"}}}}";

        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec("test_webhook_secret_abc".getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(secretKey);
        byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
        String validWebhookSig = HexFormat.of().formatHex(hash);

        assertTrue(razorpayService.verifyWebhookSignature(payload, validWebhookSig));
    }

    @Test
    @DisplayName("Invalid or tampered Webhook signature is rejected")
    void testInvalidWebhookSignature() {
        razorpayService.setWebhookSecret("test_webhook_secret_abc");
        String payload = "{\"event\":\"payment.captured\"}";
        assertFalse(razorpayService.verifyWebhookSignature(payload, "invalid_sig_12345"));
        assertFalse(razorpayService.verifyWebhookSignature(null, "sig_123"));
        assertFalse(razorpayService.verifyWebhookSignature(payload, null));
    }

    @Test
    @DisplayName("Fetch payment details with simulated test payment ID returns captured details")
    void testFetchSimulatedPaymentDetails() {
        var details = razorpayService.fetchPaymentDetails("pay_test_simulation_123");
        assertNotNull(details);
        assertEquals("pay_test_simulation_123", details.getId());
        assertEquals("captured", details.getStatus());
        assertTrue(details.isCaptured());
        assertEquals("INR", details.getCurrency());
    }

    @Test
    @DisplayName("Fetch payment details with null or blank paymentId returns null safely")
    void testFetchPaymentDetails_NullOrBlank() {
        assertNull(razorpayService.fetchPaymentDetails(null));
        assertNull(razorpayService.fetchPaymentDetails("   "));
    }
}
