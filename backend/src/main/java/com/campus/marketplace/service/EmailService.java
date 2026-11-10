package com.campus.marketplace.service;

import com.campus.marketplace.dto.EmailDiagnosticResult;
import com.campus.marketplace.entity.Order;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.*;
import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    @Value("${app.mail.from:${spring.mail.username:senserkb933@gmail.com}}")
    private String fromEmail;

    @Value("${app.mail.enabled:true}")
    private boolean mailEnabled;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${spring.mail.host:smtp.gmail.com}")
    private String mailHost;

    @Value("${spring.mail.port:465}")
    private int mailPort;

    private JavaMailSender mailSender;

    @Autowired(required = false)
    private com.campus.marketplace.repository.OrderRepository orderRepository;

    public EmailService(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void setMailSender(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void setMailEnabled(boolean mailEnabled) {
        this.mailEnabled = mailEnabled;
    }

    public void setFromEmail(String fromEmail) {
        this.fromEmail = fromEmail;
    }

    public void setMailUsername(String mailUsername) {
        this.mailUsername = mailUsername;
    }

    public void setMailPassword(String mailPassword) {
        this.mailPassword = mailPassword;
    }

    /**
     * Synchronous bridge for Order entity: converts to thread-safe payload on caller thread.
     */
    public void sendOrderConfirmation(Order order) {
        if (order == null) return;
        sendOrderConfirmation(com.campus.marketplace.dto.OrderEmailPayload.from(order, null));
    }

    /**
     * Buyer order placement confirmation (separate from payment confirmation).
     */
    @Async
    public void sendOrderConfirmation(com.campus.marketplace.dto.OrderEmailPayload payload) {
        if (payload == null || payload.getBuyerEmail() == null) return;

        String toEmail = payload.getBuyerEmail();
        String buyerName = payload.getBuyerName();
        Long orderId = payload.getOrderId();
        String title = payload.getListingTitle();
        String amount = payload.getAmount();
        String dateStr = payload.getDateStr();
        String pickupLocation = payload.getPickupLocation();

        String subject = "CampusLoop Order Confirmation: #" + orderId + " (" + title + ")";
        String message = String.format(
                "Hello %s,\n\n" +
                "Your order #%d has been created successfully on CampusLoop.\n\n" +
                "📋 Order Details:\n" +
                "----------------------------------------\n" +
                "• Order ID: %d\n" +
                "• Item: %s\n" +
                "• Amount: ₹%s\n" +
                "• Date: %s\n" +
                "• Status: %s\n" +
                "• Designated Pickup Spot: %s\n\n" +
                "Next Step: Complete the secure checkout to reserve the product and coordinate campus pickup.\n\n" +
                "Best regards,\nCampusLoop Marketplace Team",
                buyerName, orderId, orderId, title, amount, dateStr, payload.getStatus(), pickupLocation);

        boolean sent = sendEmail(toEmail, subject, message);
        if (sent && orderId != null) {
            markBuyerOrderEmailSent(orderId);
        }
    }

    /**
     * Synchronous bridge for Order entity: converts to thread-safe payload on caller thread.
     */
    public void sendSellerOrderNotification(Order order) {
        if (order == null) return;
        sendSellerOrderNotification(com.campus.marketplace.dto.OrderEmailPayload.from(order, null));
    }

    /**
     * Seller notification when an order is placed.
     */
    @Async
    public void sendSellerOrderNotification(com.campus.marketplace.dto.OrderEmailPayload payload) {
        if (payload == null || payload.getSellerEmail() == null) return;

        String toEmail = payload.getSellerEmail();
        String sellerName = payload.getSellerName();
        Long orderId = payload.getOrderId();
        String title = payload.getListingTitle();
        String amount = payload.getAmount();
        String pickupLocation = payload.getPickupLocation();

        String subject = "New Order Placed on CampusLoop: #" + orderId + " (" + title + ")";
        String message = String.format(
                "Hello %s,\n\n" +
                "A student has placed an order for your listing on CampusLoop.\n\n" +
                "📋 Order Summary:\n" +
                "----------------------------------------\n" +
                "• Order Reference: #%d\n" +
                "• Product: %s\n" +
                "• Total Amount: ₹%s\n" +
                "• Agreed Pickup Location: %s\n\n" +
                "The item is currently reserved. You will receive another notification once the payment has been verified.\n\n" +
                "Best regards,\nCampusLoop Marketplace Team",
                sellerName, orderId, title, amount, pickupLocation);

        boolean sent = sendEmail(toEmail, subject, message);
        if (sent && orderId != null) {
            markSellerOrderEmailSent(orderId);
        }
    }

    /**
     * Synchronous bridge for Order entity: converts to thread-safe payload on caller thread.
     */
    public void sendPaymentReceipt(Order order, String paymentId) {
        if (order == null) return;
        sendPaymentReceipt(com.campus.marketplace.dto.OrderEmailPayload.from(order, paymentId));
    }

    /**
     * Buyer payment receipt sent ONLY after backend verified successful payment.
     */
    @Async
    public void sendPaymentReceipt(com.campus.marketplace.dto.OrderEmailPayload payload) {
        if (payload == null || payload.getBuyerEmail() == null) return;

        String toEmail = payload.getBuyerEmail();
        String buyerName = payload.getBuyerName();
        Long orderId = payload.getOrderId();
        String title = payload.getListingTitle();
        String amount = payload.getAmount();
        String pickupLocation = payload.getPickupLocation();
        String sellerName = payload.getSellerName();
        String sellerPhone = payload.getSellerPhone();
        String paymentId = payload.getPaymentId();

        String subject = "✅ Payment Verified: CampusLoop Order #" + orderId + " (" + title + ")";
        String message = String.format(
                "Hello %s,\n\n" +
                "🎉 Congratulations! Your payment has been verified for Order #%d.\n\n" +
                "📦 Order & Payment Details:\n" +
                "----------------------------------------\n" +
                "• Item: %s\n" +
                "• Amount Paid: ₹%s\n" +
                "• Razorpay Payment ID: %s\n" +
                "• Order ID: %d\n" +
                "• Campus Pickup Location: %s\n\n" +
                "👤 Seller Contact:\n" +
                "• Name: %s\n" +
                "• Phone: %s\n\n" +
                "🤝 Next Steps for Campus Handover:\n" +
                "1. Connect with the seller via in-app messages to coordinate meetup at %s.\n" +
                "2. Inspect the item in person.\n" +
                "3. Once received, go to 'My Orders' and click 'Confirm Handover & Finalize'.\n\n" +
                "🔗 View your order: %s/orders\n\n" +
                "Thank you for being part of our campus community!\n" +
                "Best regards,\nCampusLoop Marketplace Team",
                buyerName, orderId, title, amount, paymentId, orderId, pickupLocation,
                sellerName, sellerPhone, pickupLocation, frontendUrl);

        boolean sent = sendEmail(toEmail, subject, message);
        if (sent && orderId != null) {
            markBuyerPaymentEmailSent(orderId);
        }
    }

    /**
     * Synchronous bridge for Order entity: converts to thread-safe payload on caller thread.
     */
    public void sendSellerPaymentNotification(Order order, String paymentId) {
        if (order == null) return;
        sendSellerPaymentNotification(com.campus.marketplace.dto.OrderEmailPayload.from(order, paymentId));
    }

    /**
     * Seller payment notification sent after successful payment.
     */
    @Async
    public void sendSellerPaymentNotification(com.campus.marketplace.dto.OrderEmailPayload payload) {
        if (payload == null || payload.getSellerEmail() == null) return;

        String toEmail = payload.getSellerEmail();
        String sellerName = payload.getSellerName();
        Long orderId = payload.getOrderId();
        String title = payload.getListingTitle();
        String amount = payload.getAmount();
        String pickupLocation = payload.getPickupLocation();
        String buyerName = payload.getBuyerName();
        String paymentId = payload.getPaymentId();

        String subject = "💰 Item Paid & Reserved: CampusLoop Order #" + orderId + " (" + title + ")";
        String message = String.format(
                "Hello %s,\n\n" +
                "Payment has been verified for your listing '%s' on CampusLoop!\n\n" +
                "📋 Order Details:\n" +
                "----------------------------------------\n" +
                "• Order ID: %d\n" +
                "• Item: %s\n" +
                "• Amount Secured: ₹%s\n" +
                "• Payment ID: %s\n" +
                "• Designated Pickup Location: %s\n\n" +
                "👤 Buyer: %s\n\n" +
                "Please coordinate with the buyer via in-app messages to complete the physical handover at %s.\n\n" +
                "🔗 Seller Dashboard: %s/seller/dashboard\n\n" +
                "Best regards,\nCampusLoop Marketplace Team",
                sellerName, title, orderId, title, amount, paymentId, pickupLocation, buyerName, pickupLocation, frontendUrl);

        boolean sent = sendEmail(toEmail, subject, message);
        if (sent && orderId != null) {
            markSellerPaymentEmailSent(orderId);
        }
    }

    /**
     * Notification for student verification status updates.
     */
    @Async
    public void sendVerificationUpdate(String toEmail, String studentName, String status, String note) {
        String subject = "CampusLoop Student Verification Update: " + status;
        String message = String.format(
                "Hello %s,\n\n" +
                "Your student verification review status has been updated to: %s.\n\n" +
                (note != null && !note.isBlank() ? "Reviewer Note: " + note + "\n\n" : "") +
                "Best regards,\nCampusLoop Marketplace Team",
                studentName != null ? studentName : "Student", status);
        sendEmail(toEmail, subject, message);
    }

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl = "http://localhost:5173";

    public boolean sendEmail(String toEmail, String subject, String body) {
        if (!mailEnabled || mailSender == null || isBlank(mailUsername) || isBlank(mailPassword)) {
            log.info("[EMAIL-DISABLED] Real email sending disabled (SMTP credentials absent/disabled). Logged notification: To='{}', Subject='{}'",
                    toEmail, subject);
            return false;
        }

        try {
            SimpleMailMessage mail = new SimpleMailMessage();
            String effectiveFrom = (!isBlank(fromEmail)) ? fromEmail.trim() : mailUsername.trim();
            mail.setFrom(effectiveFrom);
            mail.setTo(toEmail);
            mail.setSubject(subject);
            mail.setText(body);
            mailSender.send(mail);
            log.info("[EMAIL-SENT-SUCCESS] Delivered to: '{}' (From: '{}') | Subject: '{}'", toEmail, effectiveFrom, subject);
            return true;
        } catch (Exception e) {
            log.warn("[EMAIL-SEND-FAILED] Failed to deliver email to '{}': {}", toEmail, e.getMessage());
            // Fail gracefully without interrupting database transactions or payment status
            return false;
        }
    }

    private void markBuyerPaymentEmailSent(Long orderId) {
        if (orderRepository == null) return;
        try {
            orderRepository.findById(orderId).ifPresent(order -> {
                order.setBuyerPaymentEmailSent(true);
                orderRepository.save(order);
                log.info("[EMAIL-FLAG-PERSISTED] Order id={} buyerPaymentEmailSent=true", orderId);
            });
        } catch (Exception e) {
            log.warn("[EMAIL-FLAG-WARN] Failed to mark buyer payment email sent for order {}: {}", orderId, e.getMessage());
        }
    }

    private void markSellerPaymentEmailSent(Long orderId) {
        markSellerOrderEmailSent(orderId);
    }

    private void markSellerOrderEmailSent(Long orderId) {
        if (orderRepository == null) return;
        try {
            orderRepository.findById(orderId).ifPresent(order -> {
                order.setSellerOrderEmailSent(true);
                orderRepository.save(order);
                log.info("[EMAIL-FLAG-PERSISTED] Order id={} sellerOrderEmailSent=true", orderId);
            });
        } catch (Exception e) {
            log.warn("[EMAIL-FLAG-WARN] Failed to mark seller order email sent for order {}: {}", orderId, e.getMessage());
        }
    }

    private void markBuyerOrderEmailSent(Long orderId) {
        if (orderRepository == null) return;
        try {
            orderRepository.findById(orderId).ifPresent(order -> {
                order.setBuyerOrderEmailSent(true);
                orderRepository.save(order);
                log.info("[EMAIL-FLAG-PERSISTED] Order id={} buyerOrderEmailSent=true", orderId);
            });
        } catch (Exception e) {
            log.warn("[EMAIL-FLAG-WARN] Failed to mark buyer order email sent for order {}: {}", orderId, e.getMessage());
        }
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    public EmailDiagnosticResult diagnoseSmtp() {
        boolean configured = !isBlank(mailUsername) && !isBlank(mailPassword);
        String maskedUser = maskEmail(mailUsername);
        if (!mailEnabled) {
            return new EmailDiagnosticResult(false, "CONFIG_DISABLED",
                    "Email sending is explicitly disabled in application configuration (app.mail.enabled=false).",
                    mailHost, mailPort, maskedUser, true, java.time.LocalDateTime.now());
        }
        if (!configured || mailSender == null) {
            return new EmailDiagnosticResult(false, "CONFIG_MISSING",
                    "Gmail SMTP credentials are not configured. Set environment variables SPRING_MAIL_USERNAME (your Gmail address) and SPRING_MAIL_PASSWORD (a 16-character Google App Password).",
                    mailHost, mailPort, maskedUser, true, java.time.LocalDateTime.now());
        }
        return new EmailDiagnosticResult(true, "CONFIGURED",
                "Gmail SMTP parameters configured. Ready for email delivery via SSL/TLS on " + mailHost + ":" + mailPort,
                mailHost, mailPort, maskedUser, true, java.time.LocalDateTime.now());
    }

    public EmailDiagnosticResult testSmtpConnection(String targetEmail) {
        EmailDiagnosticResult diag = diagnoseSmtp();
        if (!"CONFIGURED".equals(diag.getStatus())) {
            return diag;
        }

        String to = (targetEmail != null && !targetEmail.isBlank()) ? targetEmail.trim() : mailUsername;
        String subject = "CampusLoop SMTP Connectivity Test";
        String body = "Hello,\n\nThis is an automated connectivity test from CampusLoop Marketplace verifying that your Spring Boot backend successfully authenticated with Google's SMTP servers and dispatched this message.\n\nTime: " + java.time.LocalDateTime.now();

        // Stage 1: DNS Resolution Test
        InetAddress[] addresses;
        try {
            addresses = InetAddress.getAllByName(mailHost);
        } catch (UnknownHostException e) {
            log.warn("[SMTP-DIAG-DNS] DNS resolution failed for '{}'", mailHost);
            return new EmailDiagnosticResult(false, "DNS_FAILURE",
                    "DNS resolution failed for '" + mailHost + "'. Your system cannot resolve the SMTP hostname. Verify internet connection or DNS configuration.",
                    mailHost, mailPort, maskEmail(mailUsername), true, java.time.LocalDateTime.now());
        }

        // Stage 2: Low-Level TCP Port Reachability Check
        boolean tcpConnected = false;
        String tcpFailureType = null;
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(addresses[0], mailPort), 7000);
            tcpConnected = true;
        } catch (SocketTimeoutException e) {
            tcpFailureType = "TIMEOUT";
        } catch (ConnectException e) {
            tcpFailureType = "REFUSED";
        } catch (IOException e) {
            tcpFailureType = "IO: " + e.getMessage();
        }

        if (!tcpConnected) {
            log.warn("[SMTP-DIAG-TCP] Failed connecting to {}:{} -> {}", mailHost, mailPort, tcpFailureType);
            if ("TIMEOUT".equals(tcpFailureType)) {
                return new EmailDiagnosticResult(false, "CONNECTION_TIMEOUT",
                        "TCP connection to " + mailHost + ":" + mailPort + " timed out after 7000ms. Outbound SMTP traffic appears blocked by your network or firewall.",
                        mailHost, mailPort, maskEmail(mailUsername), true, java.time.LocalDateTime.now());
            } else if ("REFUSED".equals(tcpFailureType)) {
                return new EmailDiagnosticResult(false, "CONNECTION_REFUSED",
                        "TCP connection actively refused by " + mailHost + ":" + mailPort + ". Verify that the host and port are correct.",
                        mailHost, mailPort, maskEmail(mailUsername), true, java.time.LocalDateTime.now());
            } else {
                return new EmailDiagnosticResult(false, "NETWORK_ERROR",
                        "Network I/O error reaching " + mailHost + ":" + mailPort + ": " + tcpFailureType,
                        mailHost, mailPort, maskEmail(mailUsername), true, java.time.LocalDateTime.now());
            }
        }

        // Stage 3: SMTP Protocol Submission, SSL/TLS, and Authentication
        try {
            SimpleMailMessage mail = new SimpleMailMessage();
            String effectiveFrom = (!isBlank(fromEmail)) ? fromEmail.trim() : mailUsername.trim();
            mail.setFrom(effectiveFrom);
            mail.setTo(to);
            mail.setSubject(subject);
            mail.setText(body);
            mailSender.send(mail);
            log.info("[EMAIL-TEST-SUCCESS] Delivered test email to '{}' (From: '{}')", to, effectiveFrom);
            return new EmailDiagnosticResult(true, "SUCCESS",
                    "Test message accepted by Gmail SMTP server (" + mailHost + ":" + mailPort + "). Note: Acceptance by SMTP server confirms valid credentials and network transmission; inbox delivery depends on recipient email provider.",
                    mailHost, mailPort, maskEmail(mailUsername), true, java.time.LocalDateTime.now());
        } catch (org.springframework.mail.MailAuthenticationException e) {
            log.warn("[EMAIL-TEST-AUTH-FAIL] SMTP Authentication failed: {}", e.getMessage());
            return new EmailDiagnosticResult(false, "AUTH_FAILURE",
                    "Gmail SMTP Authentication Failed: Google rejected the username or App Password (535 5.7.8). Ensure 2-Step Verification is enabled and generate a 16-character Google App Password (not your standard Gmail password).",
                    mailHost, mailPort, maskEmail(mailUsername), true, java.time.LocalDateTime.now());
        } catch (org.springframework.mail.MailSendException e) {
            Exception rootEx = null;
            if (e.getMessageExceptions() != null && e.getMessageExceptions().length > 0) {
                rootEx = e.getMessageExceptions()[0];
            }
            String fullMsg = rootEx != null ? rootEx.toString() : e.getMessage();
            log.warn("[EMAIL-TEST-SEND-FAIL] SMTP Send error: {}", fullMsg);

            if (fullMsg.contains("AuthenticationFailedException") || fullMsg.contains("535") || fullMsg.contains("BadCredentialsException")) {
                return new EmailDiagnosticResult(false, "AUTH_FAILURE",
                        "Gmail SMTP Authentication Failed: Google rejected the username or App Password (535 5.7.8). Ensure 2-Step Verification is enabled and generate a 16-character Google App Password.",
                        mailHost, mailPort, maskEmail(mailUsername), true, java.time.LocalDateTime.now());
            } else if (fullMsg.contains("SSLHandshakeException") || fullMsg.contains("PKIX") || fullMsg.contains("SSLProtocolException")) {
                return new EmailDiagnosticResult(false, "TLS_HANDSHAKE_FAILURE",
                        "TLS handshake failed with " + mailHost + ":" + mailPort + ": " + (rootEx != null ? rootEx.getMessage() : fullMsg),
                        mailHost, mailPort, maskEmail(mailUsername), true, java.time.LocalDateTime.now());
            } else if (fullMsg.contains("SendFailedException") || fullMsg.contains("550") || fullMsg.contains("553") || fullMsg.contains("Invalid Addresses")) {
                return new EmailDiagnosticResult(false, "RECIPIENT_FAILURE",
                        "SMTP server rejected recipient address (" + to + "): " + (rootEx != null ? rootEx.getMessage() : fullMsg),
                        mailHost, mailPort, maskEmail(mailUsername), true, java.time.LocalDateTime.now());
            } else if (fullMsg.contains("SocketTimeoutException") || fullMsg.contains("timeout")) {
                return new EmailDiagnosticResult(false, "CONNECTION_TIMEOUT",
                        "Connection or read timeout communicating with " + mailHost + ":" + mailPort + " during SMTP handshake.",
                        mailHost, mailPort, maskEmail(mailUsername), true, java.time.LocalDateTime.now());
            } else if (fullMsg.contains("ConnectException")) {
                return new EmailDiagnosticResult(false, "CONNECTION_REFUSED",
                        "Connection refused while communicating with " + mailHost + ":" + mailPort + ".",
                        mailHost, mailPort, maskEmail(mailUsername), true, java.time.LocalDateTime.now());
            } else {
                return new EmailDiagnosticResult(false, "SMTP_ERROR",
                        "SMTP delivery error: " + (rootEx != null ? rootEx.getMessage() : e.getMessage()),
                        mailHost, mailPort, maskEmail(mailUsername), true, java.time.LocalDateTime.now());
            }
        } catch (Exception e) {
            log.warn("[EMAIL-TEST-ERROR] Unexpected error testing SMTP: {}", e.getMessage());
            return new EmailDiagnosticResult(false, "ERROR",
                    "Unexpected SMTP test error: " + e.getMessage(),
                    mailHost, mailPort, maskEmail(mailUsername), true, java.time.LocalDateTime.now());
        }
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "not-configured";
        int at = email.indexOf('@');
        if (at <= 2) return "***" + email.substring(at);
        return email.substring(0, 2) + "***" + email.substring(at);
    }
}
