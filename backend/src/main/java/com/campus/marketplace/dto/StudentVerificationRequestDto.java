package com.campus.marketplace.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class StudentVerificationRequestDto {

    @NotBlank(message = "College ID card image URL is required")
    private String idCardImageUrl;

    @Size(max = 150, message = "College name cannot exceed 150 characters")
    private String collegeName;

    @Size(max = 100, message = "College domain cannot exceed 100 characters")
    private String collegeDomain;

    public StudentVerificationRequestDto() {
    }

    public StudentVerificationRequestDto(String idCardImageUrl, String collegeName, String collegeDomain) {
        this.idCardImageUrl = idCardImageUrl;
        this.collegeName = collegeName;
        this.collegeDomain = collegeDomain;
    }

    public String getIdCardImageUrl() {
        return idCardImageUrl;
    }

    public void setIdCardImageUrl(String idCardImageUrl) {
        this.idCardImageUrl = idCardImageUrl;
    }

    public String getCollegeName() {
        return collegeName;
    }

    public void setCollegeName(String collegeName) {
        this.collegeName = collegeName;
    }

    public String getCollegeDomain() {
        return collegeDomain;
    }

    public void setCollegeDomain(String collegeDomain) {
        this.collegeDomain = collegeDomain;
    }
}
