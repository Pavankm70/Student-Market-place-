package com.campus.marketplace.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OrderStatus status = OrderStatus.PENDING_PAYMENT;

    @Column(name = "pickup_notes", length = 500)
    private String pickupNotes;

    @Column(name = "buyer_order_email_sent", nullable = false)
    private boolean buyerOrderEmailSent = false;

    @Column(name = "buyer_payment_email_sent", nullable = false)
    private boolean buyerPaymentEmailSent = false;

    @Column(name = "seller_order_email_sent", nullable = false)
    private boolean sellerOrderEmailSent = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Order() {
    }

    public Order(User buyer, User seller, Listing listing, BigDecimal amount, OrderStatus status) {
        this.buyer = buyer;
        this.seller = seller;
        this.listing = listing;
        this.amount = amount;
        this.status = status;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = OrderStatus.PENDING_PAYMENT;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getBuyer() {
        return buyer;
    }

    public void setBuyer(User buyer) {
        this.buyer = buyer;
    }

    public User getSeller() {
        return seller;
    }

    public void setSeller(User seller) {
        this.seller = seller;
    }

    public Listing getListing() {
        return listing;
    }

    public void setListing(Listing listing) {
        this.listing = listing;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public String getPickupNotes() {
        return pickupNotes;
    }

    public void setPickupNotes(String pickupNotes) {
        this.pickupNotes = pickupNotes;
    }

    public boolean isBuyerOrderEmailSent() {
        return buyerOrderEmailSent;
    }

    public void setBuyerOrderEmailSent(boolean buyerOrderEmailSent) {
        this.buyerOrderEmailSent = buyerOrderEmailSent;
    }

    public boolean isBuyerPaymentEmailSent() {
        return buyerPaymentEmailSent;
    }

    public void setBuyerPaymentEmailSent(boolean buyerPaymentEmailSent) {
        this.buyerPaymentEmailSent = buyerPaymentEmailSent;
    }

    public boolean isSellerOrderEmailSent() {
        return sellerOrderEmailSent;
    }

    public void setSellerOrderEmailSent(boolean sellerOrderEmailSent) {
        this.sellerOrderEmailSent = sellerOrderEmailSent;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
