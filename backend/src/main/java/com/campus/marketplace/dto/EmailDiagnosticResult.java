package com.campus.marketplace.dto;

import java.time.LocalDateTime;

/**
 * Diagnostic result model reporting Gmail SMTP configuration and connectivity.
 * Exposes server status safely without printing or leaking passwords or tokens.
 */
public class EmailDiagnosticResult {

    private boolean success;
    private String status; // CONFIG_MISSING, AUTH_FAILURE, CONNECTION_FAILURE, SUCCESS, ERROR
    private String message;
    private String host;
    private int port;
    private String maskedUsername;
    private boolean starttlsEnabled;
    private LocalDateTime testedAt;

    public EmailDiagnosticResult() {
    }

    public EmailDiagnosticResult(boolean success, String status, String message, String host, int port,
                                 String maskedUsername, boolean starttlsEnabled, LocalDateTime testedAt) {
        this.success = success;
        this.status = status;
        this.message = message;
        this.host = host;
        this.port = port;
        this.maskedUsername = maskedUsername;
        this.starttlsEnabled = starttlsEnabled;
        this.testedAt = testedAt;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getHost() {
        return host;
    }

    public void setHost(String host) {
        this.host = host;
    }

    public int getPort() {
        return port;
    }

    public void setPort(int port) {
        this.port = port;
    }

    public String getMaskedUsername() {
        return maskedUsername;
    }

    public void setMaskedUsername(String maskedUsername) {
        this.maskedUsername = maskedUsername;
    }

    public boolean isStarttlsEnabled() {
        return starttlsEnabled;
    }

    public void setStarttlsEnabled(boolean starttlsEnabled) {
        this.starttlsEnabled = starttlsEnabled;
    }

    public LocalDateTime getTestedAt() {
        return testedAt;
    }

    public void setTestedAt(LocalDateTime testedAt) {
        this.testedAt = testedAt;
    }
}
