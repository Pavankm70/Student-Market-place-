package com.campus.marketplace.controller;

import com.campus.marketplace.dto.EmailDiagnosticResult;
import com.campus.marketplace.service.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.Map;

@RestController
public class HealthController {

    private final EmailService emailService;

    public HealthController(EmailService emailService) {
        this.emailService = emailService;
    }

    /**
     * Public health check endpoints returning HTTP 200 with {"status":"UP"}
     * Accessible without authentication.
     */
    @GetMapping({"/api/health", "/health", "/"})
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Collections.singletonMap("status", "UP"));
    }

    @GetMapping("/api/health/email-diagnostics")
    public ResponseEntity<EmailDiagnosticResult> emailDiagnostics() {
        return ResponseEntity.ok(emailService.diagnoseSmtp());
    }

    @GetMapping("/api/health/smtp-test")
    public ResponseEntity<EmailDiagnosticResult> testSmtpGet(@RequestParam(required = false) String to) {
        return ResponseEntity.ok(emailService.testSmtpConnection(to));
    }

    @PostMapping("/api/health/smtp-test")
    public ResponseEntity<EmailDiagnosticResult> testSmtpPost(@RequestParam(required = false) String to) {
        return ResponseEntity.ok(emailService.testSmtpConnection(to));
    }
}
