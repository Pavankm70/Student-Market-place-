package com.campus.marketplace.service;

import com.campus.marketplace.entity.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    private EmailService emailService;

    private Order order;
    private User buyer;
    private User seller;
    private Listing listing;

    @BeforeEach
    void setUp() {
        emailService = new EmailService(mailSender);
        emailService.setMailEnabled(true);
        emailService.setFromEmail("senserkb933@gmail.com");
        emailService.setMailUsername("senserkb933@gmail.com");
        emailService.setMailPassword("my-smtp-app-password");

        buyer = new User("Alice Buyer", "alice@gmail.com", "pass");
        buyer.setId(10L);

        seller = new User("Bob Seller", "bob@gmail.com", "pass");
        seller.setId(20L);
        seller.setPhone("9876543210");

        listing = new Listing();
        listing.setId(100L);
        listing.setTitle("Calculus Early Transcendentals");
        listing.setPrice(new BigDecimal("600.00"));
        listing.setPickupLocation("Campus Library Steps");

        order = new Order(buyer, seller, listing, listing.getPrice(), OrderStatus.PENDING_PAYMENT);
        order.setId(500L);
    }

    @Test
    @DisplayName("sendOrderConfirmation sends correctly addressed email to buyer's verified email")
    void testSendOrderConfirmation() {
        emailService.sendOrderConfirmation(order);

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());

        SimpleMailMessage message = captor.getValue();
        assertNotNull(message.getTo());
        assertEquals("alice@gmail.com", message.getTo()[0]);
        assertTrue(message.getSubject().contains("Order Confirmation: #500"));
        assertTrue(message.getText().contains("Alice Buyer"));
        assertTrue(message.getText().contains("Calculus Early Transcendentals"));
        assertTrue(message.getText().contains("Campus Library Steps"));
    }

    @Test
    @DisplayName("sendSellerOrderNotification sends email to seller's verified email")
    void testSendSellerOrderNotification() {
        emailService.sendSellerOrderNotification(order);

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());

        SimpleMailMessage message = captor.getValue();
        assertNotNull(message.getTo());
        assertEquals("bob@gmail.com", message.getTo()[0]);
        assertTrue(message.getSubject().contains("New Order Placed on CampusLoop: #500"));
        assertTrue(message.getText().contains("Bob Seller"));
    }

    @Test
    @DisplayName("sendPaymentReceipt sends verified payment confirmation with payment ID to buyer")
    void testSendPaymentReceipt() {
        emailService.sendPaymentReceipt(order, "pay_rzp_verified_123");

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());

        SimpleMailMessage message = captor.getValue();
        assertNotNull(message.getTo());
        assertEquals("alice@gmail.com", message.getTo()[0]);
        assertTrue(message.getSubject().contains("Payment Verified"));
        assertTrue(message.getText().contains("pay_rzp_verified_123"));
        assertTrue(message.getText().contains("Bob Seller"));
        assertTrue(message.getText().contains("9876543210"));
    }

    @Test
    @DisplayName("sendSellerPaymentNotification sends sale notification with payment reference to seller")
    void testSendSellerPaymentNotification() {
        emailService.sendSellerPaymentNotification(order, "pay_rzp_verified_123");

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());

        SimpleMailMessage message = captor.getValue();
        assertNotNull(message.getTo());
        assertEquals("bob@gmail.com", message.getTo()[0]);
        assertTrue(message.getSubject().contains("Item Paid & Reserved"));
        assertTrue(message.getText().contains("pay_rzp_verified_123"));
        assertTrue(message.getText().contains("Alice Buyer"));
    }

    @Test
    @DisplayName("Missing SMTP credentials disables delivery and does not throw exception")
    void testMissingSmtpCredentials_SafelyLogsWithoutSending() {
        emailService.setMailUsername(""); // Missing credentials
        emailService.setMailPassword("");

        emailService.sendOrderConfirmation(order);

        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    @DisplayName("SMTP network failure is caught safely and does not throw exception")
    void testSmtpNetworkFailure_SafelyHandled() {
        doThrow(new MailSendException("SMTP connection timed out")).when(mailSender).send(any(SimpleMailMessage.class));

        assertDoesNotThrow(() -> emailService.sendOrderConfirmation(order));
    }

    @Test
    @DisplayName("Recipients are resolved strictly from authenticated user entity in database")
    void testRecipientResolutionFromDatabaseEntity() {
        User maliciousOverrideBuyer = new User("Impostor", "attacker@evil.com", "pass");
        order.setBuyer(buyer); // Database entity is alice@gmail.com

        emailService.sendOrderConfirmation(order);

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());

        assertEquals("alice@gmail.com", captor.getValue().getTo()[0]);
        assertNotEquals("attacker@evil.com", captor.getValue().getTo()[0]);
    }
}
