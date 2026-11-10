package com.campus.marketplace.dto;

public class RazorpayPaymentDetails {

    private String id;
    private String status;
    private String orderId;
    private Long amount;
    private String currency;
    private boolean captured;

    public RazorpayPaymentDetails() {
    }

    public RazorpayPaymentDetails(String id, String status, String orderId, Long amount, String currency, boolean captured) {
        this.id = id;
        this.status = status;
        this.orderId = orderId;
        this.amount = amount;
        this.currency = currency;
        this.captured = captured;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public Long getAmount() {
        return amount;
    }

    public void setAmount(Long amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public boolean isCaptured() {
        return captured;
    }

    public void setCaptured(boolean captured) {
        this.captured = captured;
    }
}
