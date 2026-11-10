package com.campus.marketplace.dto;

import com.campus.marketplace.entity.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class OrderResponseDto {

    private Long id;
    private Long listingId;
    private String listingTitle;
    private String listingImageUrl;
    private BigDecimal amount;
    private OrderStatus status;
    private String pickupNotes;
    private String pickupLocation;
    private String paymentStatus;
    private String paymentProvider;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private Long orderNumber;

    private Long buyerId;
    private String buyerName;
    private String buyerEmail;

    private Long sellerId;
    private String sellerName;
    private String sellerEmail;
    private String sellerPhone;

    private boolean eligibleForReview;
    private boolean alreadyReviewed;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public OrderResponseDto() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getListingId() {
        return listingId;
    }

    public void setListingId(Long listingId) {
        this.listingId = listingId;
    }

    public String getListingTitle() {
        return listingTitle;
    }

    public void setListingTitle(String listingTitle) {
        this.listingTitle = listingTitle;
    }

    public String getListingImageUrl() {
        return listingImageUrl;
    }

    public void setListingImageUrl(String listingImageUrl) {
        this.listingImageUrl = listingImageUrl;
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

    public Long getBuyerId() {
        return buyerId;
    }

    public void setBuyerId(Long buyerId) {
        this.buyerId = buyerId;
    }

    public String getBuyerName() {
        return buyerName;
    }

    public void setBuyerName(String buyerName) {
        this.buyerName = buyerName;
    }

    public String getBuyerEmail() {
        return buyerEmail;
    }

    public void setBuyerEmail(String buyerEmail) {
        this.buyerEmail = buyerEmail;
    }

    public Long getSellerId() {
        return sellerId;
    }

    public void setSellerId(Long sellerId) {
        this.sellerId = sellerId;
    }

    public String getSellerName() {
        return sellerName;
    }

    public void setSellerName(String sellerName) {
        this.sellerName = sellerName;
    }

    public String getSellerEmail() {
        return sellerEmail;
    }

    public void setSellerEmail(String sellerEmail) {
        this.sellerEmail = sellerEmail;
    }

    public String getSellerPhone() {
        return sellerPhone;
    }

    public void setSellerPhone(String sellerPhone) {
        this.sellerPhone = sellerPhone;
    }

    public boolean isEligibleForReview() {
        return eligibleForReview;
    }

    public void setEligibleForReview(boolean eligibleForReview) {
        this.eligibleForReview = eligibleForReview;
    }

    public boolean isAlreadyReviewed() {
        return alreadyReviewed;
    }

    public void setAlreadyReviewed(boolean alreadyReviewed) {
        this.alreadyReviewed = alreadyReviewed;
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

    public String getPickupLocation() {
        return pickupLocation;
    }

    public void setPickupLocation(String pickupLocation) {
        this.pickupLocation = pickupLocation;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public String getPaymentProvider() {
        return paymentProvider;
    }

    public void setPaymentProvider(String paymentProvider) {
        this.paymentProvider = paymentProvider;
    }

    public String getRazorpayOrderId() {
        return razorpayOrderId;
    }

    public void setRazorpayOrderId(String razorpayOrderId) {
        this.razorpayOrderId = razorpayOrderId;
    }

    public String getRazorpayPaymentId() {
        return razorpayPaymentId;
    }

    public void setRazorpayPaymentId(String razorpayPaymentId) {
        this.razorpayPaymentId = razorpayPaymentId;
    }

    public Long getOrderNumber() {
        return orderNumber != null ? orderNumber : id;
    }

    public void setOrderNumber(Long orderNumber) {
        this.orderNumber = orderNumber;
    }
}
