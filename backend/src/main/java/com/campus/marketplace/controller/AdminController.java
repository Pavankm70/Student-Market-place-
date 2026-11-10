package com.campus.marketplace.controller;

import com.campus.marketplace.dto.AdminDashboardStatsDto;
import com.campus.marketplace.dto.PaymentTransactionResponseDto;
import com.campus.marketplace.dto.ReviewResponseDto;
import com.campus.marketplace.dto.UserDto;
import com.campus.marketplace.service.DashboardService;
import com.campus.marketplace.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAuthority('ROLE_SUPER_ADMIN')")
@Tag(name = "Super Admin Dashboard", description = "Endpoints for platform management, moderation, user administration, and reporting")
public class AdminController {

    private final DashboardService dashboardService;
    private final ReviewService reviewService;

    public AdminController(DashboardService dashboardService, ReviewService reviewService) {
        this.dashboardService = dashboardService;
        this.reviewService = reviewService;
    }

    @GetMapping("/stats")
    @Operation(summary = "Get platform overview metrics and statistics")
    public ResponseEntity<AdminDashboardStatsDto> getStats() {
        return ResponseEntity.ok(dashboardService.getAdminStats());
    }

    @GetMapping("/users")
    @Operation(summary = "Get all registered users with pagination")
    public ResponseEntity<Page<UserDto>> getUsers(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(dashboardService.getAllUsers(pageable));
    }

    @PatchMapping("/users/{id}/suspend")
    @Operation(summary = "Suspend or reinstate a student account")
    public ResponseEntity<UserDto> suspendUser(
            @PathVariable Long id,
            @RequestParam(defaultValue = "true") boolean suspend) {
        return ResponseEntity.ok(dashboardService.suspendUser(id, suspend));
    }

    @GetMapping("/verifications/pending")
    @Operation(summary = "Get pending student enrollment verification requests")
    public ResponseEntity<List<UserDto>> getPendingVerifications() {
        return ResponseEntity.ok(dashboardService.getPendingVerifications());
    }

    @PatchMapping("/verifications/{id}/review")
    @Operation(summary = "Approve or reject a college verification request")
    public ResponseEntity<UserDto> reviewVerification(
            @PathVariable Long id,
            @RequestParam boolean approve,
            @RequestParam(required = false) String note) {
        return ResponseEntity.ok(dashboardService.reviewCollegeVerification(id, approve, note));
    }

    @GetMapping("/reviews/reported")
    @Operation(summary = "Get all reported reviews for administrative moderation")
    public ResponseEntity<List<ReviewResponseDto>> getReportedReviews() {
        return ResponseEntity.ok(dashboardService.getAdminStats() != null ? reviewService.getReportedReviews() : List.of());
    }

    @PatchMapping("/reviews/{id}/moderate")
    @Operation(summary = "Moderate (hide or restore) a reported review")
    public ResponseEntity<ReviewResponseDto> moderateReview(
            @PathVariable Long id,
            @RequestParam(defaultValue = "true") boolean hide) {
        return ResponseEntity.ok(reviewService.moderateReview(id, hide));
    }

    @GetMapping("/transactions")
    @Operation(summary = "View platform payment transaction records")
    public ResponseEntity<Page<PaymentTransactionResponseDto>> getTransactions(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(dashboardService.getAllTransactions(pageable));
    }

    @GetMapping(value = "/export/transactions/csv", produces = "text/csv")
    @Operation(summary = "Export platform payment transactions to CSV")
    public ResponseEntity<String> exportTransactionsCsv() {
        String csvData = dashboardService.exportTransactionsCsv();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"campusloop_transactions.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvData);
    }
}
