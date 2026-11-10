package com.campus.marketplace.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class SellerDashboardDto {

    private long totalListings;
    private long availableListings;
    private long reservedListings;
    private long soldListings;

    private long ordersReceived;
    private long pendingOrders;
    private long confirmedOrders;
    private long completedHandovers;
    private long completedSalesCount;
    private long cancelledOrders;

    private BigDecimal verifiedRevenue = BigDecimal.ZERO;
    private Double averageRating;
    private int totalReviews;

    private List<OrderResponseDto> recentOrders = new ArrayList<>();
    private List<SalesTrendDto> salesOverTime = new ArrayList<>();
    private List<TopListingDto> topListings = new ArrayList<>();
    private List<ReviewResponseDto> recentReviews = new ArrayList<>();

    public SellerDashboardDto() {
    }

    // Alias getters for frontend flexibility
    public BigDecimal getTotalRevenue() {
        return verifiedRevenue != null ? verifiedRevenue : BigDecimal.ZERO;
    }

    public long getCompletedSales() {
        return completedSalesCount;
    }

    public long getAvailableCount() {
        return availableListings;
    }

    public long getReservedCount() {
        return reservedListings;
    }

    public long getSoldCount() {
        return soldListings;
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

    public long getOrdersReceived() {
        return ordersReceived;
    }

    public void setOrdersReceived(long ordersReceived) {
        this.ordersReceived = ordersReceived;
    }

    public long getPendingOrders() {
        return pendingOrders;
    }

    public void setPendingOrders(long pendingOrders) {
        this.pendingOrders = pendingOrders;
    }

    public long getConfirmedOrders() {
        return confirmedOrders;
    }

    public void setConfirmedOrders(long confirmedOrders) {
        this.confirmedOrders = confirmedOrders;
    }

    public long getCompletedHandovers() {
        return completedHandovers;
    }

    public void setCompletedHandovers(long completedHandovers) {
        this.completedHandovers = completedHandovers;
    }

    public long getCompletedSalesCount() {
        return completedSalesCount;
    }

    public void setCompletedSalesCount(long completedSalesCount) {
        this.completedSalesCount = completedSalesCount;
    }

    public long getCancelledOrders() {
        return cancelledOrders;
    }

    public void setCancelledOrders(long cancelledOrders) {
        this.cancelledOrders = cancelledOrders;
    }

    public BigDecimal getVerifiedRevenue() {
        return verifiedRevenue;
    }

    public void setVerifiedRevenue(BigDecimal verifiedRevenue) {
        this.verifiedRevenue = verifiedRevenue;
    }

    public Double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(Double averageRating) {
        this.averageRating = averageRating;
    }

    public int getTotalReviews() {
        return totalReviews;
    }

    public void setTotalReviews(int totalReviews) {
        this.totalReviews = totalReviews;
    }

    public List<OrderResponseDto> getRecentOrders() {
        return recentOrders;
    }

    public void setRecentOrders(List<OrderResponseDto> recentOrders) {
        this.recentOrders = recentOrders;
    }

    public List<SalesTrendDto> getSalesOverTime() {
        return salesOverTime;
    }

    public void setSalesOverTime(List<SalesTrendDto> salesOverTime) {
        this.salesOverTime = salesOverTime;
    }

    public List<TopListingDto> getTopListings() {
        return topListings;
    }

    public void setTopListings(List<TopListingDto> topListings) {
        this.topListings = topListings;
    }

    public List<ReviewResponseDto> getRecentReviews() {
        return recentReviews;
    }

    public void setRecentReviews(List<ReviewResponseDto> recentReviews) {
        this.recentReviews = recentReviews;
    }

    public static class SalesTrendDto {
        private String period;
        private long orderCount;
        private BigDecimal totalAmount;

        public SalesTrendDto() {
        }

        public SalesTrendDto(String period, long orderCount, BigDecimal totalAmount) {
            this.period = period;
            this.orderCount = orderCount;
            this.totalAmount = totalAmount;
        }

        public String getPeriod() {
            return period;
        }

        public void setPeriod(String period) {
            this.period = period;
        }

        public long getOrderCount() {
            return orderCount;
        }

        public void setOrderCount(long orderCount) {
            this.orderCount = orderCount;
        }

        public BigDecimal getTotalAmount() {
            return totalAmount;
        }

        public void setTotalAmount(BigDecimal totalAmount) {
            this.totalAmount = totalAmount;
        }
    }

    public static class TopListingDto {
        private Long listingId;
        private String title;
        private String imageUrl;
        private BigDecimal price;
        private String status;
        private long ordersCount;
        private long salesCount;
        private BigDecimal totalRevenue;

        public TopListingDto() {
        }

        public TopListingDto(Long listingId, String title, String imageUrl, BigDecimal price, String status, long ordersCount, long salesCount, BigDecimal totalRevenue) {
            this.listingId = listingId;
            this.title = title;
            this.imageUrl = imageUrl;
            this.price = price;
            this.status = status;
            this.ordersCount = ordersCount;
            this.salesCount = salesCount;
            this.totalRevenue = totalRevenue;
        }

        public TopListingDto(Long listingId, String title, String imageUrl, BigDecimal price, long salesCount, BigDecimal totalRevenue) {
            this(listingId, title, imageUrl, price, "AVAILABLE", salesCount, salesCount, totalRevenue);
        }

        public Long getListingId() {
            return listingId;
        }

        public void setListingId(Long listingId) {
            this.listingId = listingId;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getImageUrl() {
            return imageUrl;
        }

        public void setImageUrl(String imageUrl) {
            this.imageUrl = imageUrl;
        }

        public BigDecimal getPrice() {
            return price;
        }

        public void setPrice(BigDecimal price) {
            this.price = price;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public long getOrdersCount() {
            return ordersCount;
        }

        public void setOrdersCount(long ordersCount) {
            this.ordersCount = ordersCount;
        }

        public long getSalesCount() {
            return salesCount;
        }

        public void setSalesCount(long salesCount) {
            this.salesCount = salesCount;
        }

        public BigDecimal getTotalRevenue() {
            return totalRevenue;
        }

        public void setTotalRevenue(BigDecimal totalRevenue) {
            this.totalRevenue = totalRevenue;
        }
    }
}
