package com.campus.marketplace.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class OrderRequestDto {

    @NotNull(message = "Listing ID is required")
    private Long listingId;

    @Size(max = 500, message = "Pickup notes cannot exceed 500 characters")
    private String pickupNotes;

    public OrderRequestDto() {
    }

    public OrderRequestDto(Long listingId, String pickupNotes) {
        this.listingId = listingId;
        this.pickupNotes = pickupNotes;
    }

    public Long getListingId() {
        return listingId;
    }

    public void setListingId(Long listingId) {
        this.listingId = listingId;
    }

    public String getPickupNotes() {
        return pickupNotes;
    }

    public void setPickupNotes(String pickupNotes) {
        this.pickupNotes = pickupNotes;
    }
}
