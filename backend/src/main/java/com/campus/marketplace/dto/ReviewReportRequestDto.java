package com.campus.marketplace.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ReviewReportRequestDto {

    @NotBlank(message = "Reason for reporting is required")
    @Size(max = 255, message = "Reason cannot exceed 255 characters")
    private String reason;

    public ReviewReportRequestDto() {
    }

    public ReviewReportRequestDto(String reason) {
        this.reason = reason;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
