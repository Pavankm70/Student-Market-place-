package com.campus.marketplace.controller;

import com.campus.marketplace.dto.SellerDashboardDto;
import com.campus.marketplace.dto.StudentVerificationRequestDto;
import com.campus.marketplace.dto.UserDto;
import com.campus.marketplace.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@Tag(name = "Seller Dashboard", description = "Endpoints for seller analytics and college student verification submission")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/seller")
    @Operation(summary = "Get private seller dashboard analytics (listings breakdown, verified sales, revenue)")
    public ResponseEntity<SellerDashboardDto> getSellerDashboard() {
        return ResponseEntity.ok(dashboardService.getSellerDashboard());
    }

    @GetMapping("/buyer")
    @Operation(summary = "Get private buyer dashboard analytics (order counts, verified spend, recent activity)")
    public ResponseEntity<com.campus.marketplace.dto.BuyerDashboardDto> getBuyerDashboard() {
        return ResponseEntity.ok(dashboardService.getBuyerDashboard());
    }

    @PostMapping("/verify-student")
    @Operation(summary = "Submit college student ID card document for enrollment verification review")
    public ResponseEntity<UserDto> submitStudentVerification(@Valid @RequestBody StudentVerificationRequestDto dto) {
        return ResponseEntity.ok(dashboardService.submitStudentIdVerification(dto));
    }

    @GetMapping("/email-diagnostics")
    @Operation(summary = "Diagnose SMTP configuration and connectivity safely without exposing credentials")
    public ResponseEntity<com.campus.marketplace.dto.EmailDiagnosticResult> getEmailDiagnostics() {
        return ResponseEntity.ok(dashboardService.getEmailDiagnostics());
    }

    @PostMapping("/test-email")
    @Operation(summary = "Send a test email to verify SMTP submission")
    public ResponseEntity<com.campus.marketplace.dto.EmailDiagnosticResult> sendTestEmail(@RequestParam(required = false) String to) {
        return ResponseEntity.ok(dashboardService.testEmail(to));
    }
}
