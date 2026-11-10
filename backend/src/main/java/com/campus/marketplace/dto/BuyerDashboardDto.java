package com.campus.marketplace.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class BuyerDashboardDto {

    private long totalOrders;
    private long confirmedOrders;
    private long pendingOrders;
    private long cancelledOrders;
    private BigDecimal totalSpent = BigDecimal.ZERO;

    private List<OrderResponseDto> recentOrders = new ArrayList<>();

    public BuyerDashboardDto() {
    }

    public long getTotalOrders() {
        return totalOrders;
    }

    public void setTotalOrders(long totalOrders) {
        this.totalOrders = totalOrders;
    }

    public long getConfirmedOrders() {
        return confirmedOrders;
    }

    public void setConfirmedOrders(long confirmedOrders) {
        this.confirmedOrders = confirmedOrders;
    }

    public long getPendingOrders() {
        return pendingOrders;
    }

    public void setPendingOrders(long pendingOrders) {
        this.pendingOrders = pendingOrders;
    }

    public long getCancelledOrders() {
        return cancelledOrders;
    }

    public void setCancelledOrders(long cancelledOrders) {
        this.cancelledOrders = cancelledOrders;
    }

    public BigDecimal getTotalSpent() {
        return totalSpent;
    }

    public void setTotalSpent(BigDecimal totalSpent) {
        this.totalSpent = totalSpent;
    }

    public List<OrderResponseDto> getRecentOrders() {
        return recentOrders;
    }

    public void setRecentOrders(List<OrderResponseDto> recentOrders) {
        this.recentOrders = recentOrders;
    }
}
