package com.campus.marketplace.dto;

import java.time.LocalDateTime;

public class InquiryReplyDto {

    private Long id;
    private Long senderId;
    private String senderName;
    private String senderEmail;
    private String message;
    private LocalDateTime createdAt;
    private boolean fromSeller;
    private boolean fromMe;

    public InquiryReplyDto() {
    }

    public InquiryReplyDto(Long id, Long senderId, String senderName, String senderEmail, String message, LocalDateTime createdAt, boolean fromSeller, boolean fromMe) {
        this.id = id;
        this.senderId = senderId;
        this.senderName = senderName;
        this.senderEmail = senderEmail;
        this.message = message;
        this.createdAt = createdAt;
        this.fromSeller = fromSeller;
        this.fromMe = fromMe;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSenderId() {
        return senderId;
    }

    public void setSenderId(Long senderId) {
        this.senderId = senderId;
    }

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public String getSenderEmail() {
        return senderEmail;
    }

    public void setSenderEmail(String senderEmail) {
        this.senderEmail = senderEmail;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isFromSeller() {
        return fromSeller;
    }

    public void setFromSeller(boolean fromSeller) {
        this.fromSeller = fromSeller;
    }

    public boolean isFromMe() {
        return fromMe;
    }

    public void setFromMe(boolean fromMe) {
        this.fromMe = fromMe;
    }
}
