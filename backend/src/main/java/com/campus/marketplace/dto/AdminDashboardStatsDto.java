package com.campus.marketplace.dto;

import java.math.BigDecimal;

public class AdminDashboardStatsDto {

    private long totalUsers;
    private long collegeVerifiedUsers;
    private long pendingVerificationUsers;
    private long totalListings;
    private long availableListings;
    private long reservedListings;
    private long soldListings;
    private long totalOrders;
    private long completedOrders;
    private BigDecimal platformVerifiedRevenue;
    private long reportedReviewsCount;

    public AdminDashboardStatsDto() {
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getCollegeVerifiedUsers() {
        return collegeVerifiedUsers;
    }

    public void setCollegeVerifiedUsers(long collegeVerifiedUsers) {
        this.collegeVerifiedUsers = collegeVerifiedUsers;
    }

    public long getPendingVerificationUsers() {
        return pendingVerificationUsers;
    }

    public void setPendingVerificationUsers(long pendingVerificationUsers) {
        this.pendingVerificationUsers = pendingVerificationUsers;
    }

    public long getTotalListings() {
        return totalListings;
    }

    public void setTotalListings(long totalListings) {
        this.totalListings = totalListings;
    }

    public long getAvailableListings() {
        return availableListings;
    }

    public void setAvailableListings(long availableListings) {
        this.availableListings = availableListings;
    }

    public long getReservedListings() {
        return reservedListings;
    }

    public void setReservedListings(long reservedListings) {
        this.reservedListings = reservedListings;
    }

    public long getSoldListings() {
        return soldListings;
    }

    public void setSoldListings(long soldListings) {
        this.soldListings = soldListings;
    }

    public long getTotalOrders() {
        return totalOrders;
    }

    public void setTotalOrders(long totalOrders) {
        this.totalOrders = totalOrders;
    }

    public long getCompletedOrders() {
        return completedOrders;
    }

    public void setCompletedOrders(long completedOrders) {
        this.completedOrders = completedOrders;
    }

    public BigDecimal getPlatformVerifiedRevenue() {
        return platformVerifiedRevenue;
    }

    public void setPlatformVerifiedRevenue(BigDecimal platformVerifiedRevenue) {
        this.platformVerifiedRevenue = platformVerifiedRevenue;
    }

    public long getReportedReviewsCount() {
        return reportedReviewsCount;
    }

    public void setReportedReviewsCount(long reportedReviewsCount) {
        this.reportedReviewsCount = reportedReviewsCount;
    }
}
