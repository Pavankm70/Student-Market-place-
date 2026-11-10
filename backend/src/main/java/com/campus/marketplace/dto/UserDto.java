package com.campus.marketplace.dto;

import com.campus.marketplace.entity.Role;
import com.campus.marketplace.entity.VerificationStatus;

import java.time.LocalDateTime;

public class UserDto {
    private Long id;
    private Long sellerId;
    private String name;
    private String email;
    private String phone;
    private String campusName;
    private Role role = Role.ROLE_STUDENT;
    private VerificationStatus verificationStatus = VerificationStatus.UNVERIFIED;
    private boolean collegeVerified = false;
    private String collegeName;
    private String collegeDomain;
    private String idCardImageUrl;
    private String authProvider = "LOCAL";
    private boolean isSuspended = false;
    private Double averageRating;
    private Integer totalReviews = 0;
    private String accountType = "BUYER_AND_SELLER";
    private boolean canSell = true;
    private boolean canBuy = true;
    private LocalDateTime createdAt;

    public UserDto() {
    }

    public UserDto(Long id, String name, String email, String phone, String campusName, LocalDateTime createdAt) {
        this.id = id;
        this.sellerId = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.campusName = campusName;
        this.accountType = "BUYER_AND_SELLER";
        this.canSell = true;
        this.canBuy = true;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
        this.sellerId = id;
    }

    public Long getSellerId() {
        return sellerId != null ? sellerId : id;
    }

    public void setSellerId(Long sellerId) {
        this.sellerId = sellerId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getCampusName() {
        return campusName;
    }

    public void setCampusName(String campusName) {
        this.campusName = campusName;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public VerificationStatus getVerificationStatus() {
        return verificationStatus;
    }

    public void setVerificationStatus(VerificationStatus verificationStatus) {
        this.verificationStatus = verificationStatus;
        this.collegeVerified = (verificationStatus == VerificationStatus.COLLEGE_VERIFIED);
    }

    public boolean isCollegeVerified() {
        return collegeVerified || (verificationStatus == VerificationStatus.COLLEGE_VERIFIED);
    }

    public void setCollegeVerified(boolean collegeVerified) {
        this.collegeVerified = collegeVerified;
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

    public String getIdCardImageUrl() {
        return idCardImageUrl;
    }

    public void setIdCardImageUrl(String idCardImageUrl) {
        this.idCardImageUrl = idCardImageUrl;
    }

    public String getAuthProvider() {
        return authProvider;
    }

    public void setAuthProvider(String authProvider) {
        this.authProvider = authProvider;
    }

    public boolean isSuspended() {
        return isSuspended;
    }

    public void setSuspended(boolean suspended) {
        isSuspended = suspended;
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

    public String getAccountType() {
        return accountType;
    }

    public void setAccountType(String accountType) {
        this.accountType = accountType;
    }

    public boolean isCanSell() {
        return canSell;
    }

    public void setCanSell(boolean canSell) {
        this.canSell = canSell;
    }

    public boolean isCanBuy() {
        return canBuy;
    }

    public void setCanBuy(boolean canBuy) {
        this.canBuy = canBuy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
