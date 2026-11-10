package com.campus.marketplace.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class ReviewRequestDto {

    private Long orderId;

    private Long listingId;

    @Min(value = 1, message = "Rating must be at least 1 star")
    @Max(value = 5, message = "Rating cannot exceed 5 stars")
    private int rating;

    @Size(max = 2000, message = "Review comment cannot exceed 2000 characters")
    private String comment;

    public ReviewRequestDto() {
    }

    public ReviewRequestDto(Long orderId, int rating, String comment) {
        this.orderId = orderId;
        this.rating = rating;
        this.comment = comment;
    }

    public ReviewRequestDto(Long orderId, Long listingId, int rating, String comment) {
        this.orderId = orderId;
        this.listingId = listingId;
        this.rating = rating;
        this.comment = comment;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public Long getListingId() {
        return listingId;
    }

    public void setListingId(Long listingId) {
        this.listingId = listingId;
    }

    public int getRating() {
        return rating;
    }

    public void setRating(int rating) {
        this.rating = rating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}
