package com.campus.marketplace.dto;

import com.campus.marketplace.entity.Category;
import com.campus.marketplace.entity.ListingStatus;
import com.campus.marketplace.entity.VerificationStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ListingResponseDto {

    private Long id;
    private String title;
    private String description;
    private BigDecimal price;
    private Category category;
    private String categoryDisplayName;
    private String imageUrl;
    private ListingStatus status;
    private String conditionType;
    private String isbn;
    private String author;
    private String pickupLocation;
    private String pickupDescription;
    private Double latitude;
    private Double longitude;
    private Double distanceKm; // Computed from buyer's location
    private Double averageRating;
    private Integer totalReviews;

    // Seller summary (sellerId links directly to user ID)
    private Long sellerId;
    private Long sellerUserId;
    private String sellerName;
    private String sellerEmail;
    private String sellerPhone;
    private String sellerCampus;
    private boolean sellerCollegeVerified;
    private VerificationStatus sellerVerificationStatus;
    private Double sellerAverageRating;
    private Integer sellerTotalReviews;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long inquiryCount;
    private boolean reservedByCurrentBuyer;
    private Long activePendingOrderId;
    private boolean hasOrderHistory;
    private Long orderCount;

    public ListingResponseDto() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
        if (category != null) {
            this.categoryDisplayName = category.getDisplayName();
        }
    }

    public String getCategoryDisplayName() {
        return categoryDisplayName;
    }

    public void setCategoryDisplayName(String categoryDisplayName) {
        this.categoryDisplayName = categoryDisplayName;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public ListingStatus getStatus() {
        return status;
    }

    public void setStatus(ListingStatus status) {
        this.status = status;
    }

    public String getConditionType() {
        return conditionType;
    }

    public void setConditionType(String conditionType) {
        this.conditionType = conditionType;
    }

    public String getIsbn() {
        return isbn;
    }

    public void setIsbn(String isbn) {
        this.isbn = isbn;
    }

    public String getAuthor() {
        return author;
    }

    public void setAuthor(String author) {
        this.author = author;
    }

    public String getPickupLocation() {
        return pickupLocation;
    }

    public void setPickupLocation(String pickupLocation) {
        this.pickupLocation = pickupLocation;
    }

    public String getPickupDescription() {
        return pickupDescription;
    }

    public void setPickupDescription(String pickupDescription) {
        this.pickupDescription = pickupDescription;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Double getDistanceKm() {
        return distanceKm;
    }

    public void setDistanceKm(Double distanceKm) {
        this.distanceKm = distanceKm;
    }

    public Double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(Double averageRating) {
        this.averageRating = averageRating;
    }

    public Integer getTotalReviews() {
        return totalReviews;
    }

    public void setTotalReviews(Integer totalReviews) {
        this.totalReviews = totalReviews;
    }

    public Long getSellerId() {
        return sellerId;
    }

    public void setSellerId(Long sellerId) {
        this.sellerId = sellerId;
    }

    public Long getSellerUserId() {
        return sellerUserId;
    }

    public void setSellerUserId(Long sellerUserId) {
        this.sellerUserId = sellerUserId;
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

    public String getSellerCampus() {
        return sellerCampus;
    }

    public void setSellerCampus(String sellerCampus) {
        this.sellerCampus = sellerCampus;
    }

    public boolean isSellerCollegeVerified() {
        return sellerCollegeVerified;
    }

    public void setSellerCollegeVerified(boolean sellerCollegeVerified) {
        this.sellerCollegeVerified = sellerCollegeVerified;
    }

    public VerificationStatus getSellerVerificationStatus() {
        return sellerVerificationStatus;
    }

    public void setSellerVerificationStatus(VerificationStatus sellerVerificationStatus) {
        this.sellerVerificationStatus = sellerVerificationStatus;
    }

    public Double getSellerAverageRating() {
        return sellerAverageRating;
    }

    public void setSellerAverageRating(Double sellerAverageRating) {
        this.sellerAverageRating = sellerAverageRating;
    }

    public Integer getSellerTotalReviews() {
        return sellerTotalReviews;
    }

    public void setSellerTotalReviews(Integer sellerTotalReviews) {
        this.sellerTotalReviews = sellerTotalReviews;
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

    public Long getInquiryCount() {
        return inquiryCount;
    }

    public void setInquiryCount(Long inquiryCount) {
        this.inquiryCount = inquiryCount;
    }

    public boolean isReservedByCurrentBuyer() {
        return reservedByCurrentBuyer;
    }

    public void setReservedByCurrentBuyer(boolean reservedByCurrentBuyer) {
        this.reservedByCurrentBuyer = reservedByCurrentBuyer;
    }

    public Long getActivePendingOrderId() {
        return activePendingOrderId;
    }

    public void setActivePendingOrderId(Long activePendingOrderId) {
        this.activePendingOrderId = activePendingOrderId;
    }

    public boolean isHasOrderHistory() {
        return hasOrderHistory;
    }

    public void setHasOrderHistory(boolean hasOrderHistory) {
        this.hasOrderHistory = hasOrderHistory;
    }

    public Long getOrderCount() {
        return orderCount;
    }

    public void setOrderCount(Long orderCount) {
        this.orderCount = orderCount;
    }
}
