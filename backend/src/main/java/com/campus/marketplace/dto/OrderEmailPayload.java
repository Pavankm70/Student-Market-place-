package com.campus.marketplace.dto;

import com.campus.marketplace.entity.Order;
import java.time.format.DateTimeFormatter;

/**
 * Thread-safe, detached data transfer object holding order notification details.
 * Prevents lazy Hibernate proxy navigation across asynchronous thread boundaries.
 */
public class OrderEmailPayload {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private Long orderId;
    private String listingTitle;
    private String amount;
    private String status;
    private String dateStr;
    private String pickupLocation;

    private String buyerName;
    private String buyerEmail;

    private String sellerName;
    private String sellerEmail;
    private String sellerPhone;

    private String paymentId;

    public OrderEmailPayload() {
    }

    public static OrderEmailPayload from(Order order, String paymentId) {
        if (order == null) return null;
        OrderEmailPayload p = new OrderEmailPayload();
        p.setOrderId(order.getId());
        p.setAmount(order.getAmount() != null ? order.getAmount().toString() : "0.00");
        p.setStatus(order.getStatus() != null ? order.getStatus().name() : "");
        p.setDateStr(order.getCreatedAt() != null ? order.getCreatedAt().format(DATE_FORMATTER) : "Recently");
        p.setPaymentId(paymentId);

        if (order.getListing() != null) {
            p.setListingTitle(order.getListing().getTitle() != null ? order.getListing().getTitle() : "Listing");
            p.setPickupLocation(order.getListing().getPickupLocation() != null ? order.getListing().getPickupLocation() : "Campus Landmark");
        } else {
            p.setListingTitle("Listing");
            p.setPickupLocation("Campus Landmark");
        }

        if (order.getBuyer() != null) {
            p.setBuyerName(order.getBuyer().getName() != null ? order.getBuyer().getName() : "Student");
            p.setBuyerEmail(order.getBuyer().getEmail());
        }

        if (order.getSeller() != null) {
            p.setSellerName(order.getSeller().getName() != null ? order.getSeller().getName() : "Seller");
            p.setSellerEmail(order.getSeller().getEmail());
            p.setSellerPhone(order.getSeller().getPhone() != null ? order.getSeller().getPhone() : "See in-app chat");
        } else {
            p.setSellerName("Seller");
            p.setSellerPhone("See in-app chat");
        }

        return p;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public String getListingTitle() {
        return listingTitle;
    }

    public void setListingTitle(String listingTitle) {
        this.listingTitle = listingTitle;
    }

    public String getAmount() {
        return amount;
    }

    public void setAmount(String amount) {
        this.amount = amount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDateStr() {
        return dateStr;
    }

    public void setDateStr(String dateStr) {
        this.dateStr = dateStr;
    }

    public String getPickupLocation() {
        return pickupLocation;
    }

    public void setPickupLocation(String pickupLocation) {
        this.pickupLocation = pickupLocation;
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

    public String getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(String paymentId) {
        this.paymentId = paymentId;
    }
}
