package com.campus.marketplace.controller;

import com.campus.marketplace.dto.ReviewReportRequestDto;
import com.campus.marketplace.dto.ReviewRequestDto;
import com.campus.marketplace.dto.ReviewResponseDto;
import com.campus.marketplace.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@Tag(name = "Reviews & Ratings", description = "Endpoints for product and seller reviews with verified purchase enforcement")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping
    @Operation(summary = "Submit a review for a verified purchased order")
    public ResponseEntity<ReviewResponseDto> createReview(@Valid @RequestBody ReviewRequestDto dto) {
        ReviewResponseDto created = reviewService.createReview(dto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping("/listing/{listingId}")
    @Operation(summary = "Get all approved reviews for a product listing")
    public ResponseEntity<List<ReviewResponseDto>> getReviewsForListing(@PathVariable Long listingId) {
        return ResponseEntity.ok(reviewService.getReviewsForListing(listingId));
    }

    @GetMapping("/seller/{sellerId}")
    @Operation(summary = "Get all approved reviews for a seller")
    public ResponseEntity<List<ReviewResponseDto>> getReviewsForSeller(@PathVariable Long sellerId) {
        return ResponseEntity.ok(reviewService.getReviewsForSeller(sellerId));
    }

    @PostMapping("/{id}/report")
    @Operation(summary = "Report an inappropriate or abusive review for admin moderation")
    public ResponseEntity<Map<String, String>> reportReview(
            @PathVariable Long id,
            @Valid @RequestBody ReviewReportRequestDto dto) {
        reviewService.reportReview(id, dto);
        return ResponseEntity.ok(Map.of("message", "Review reported for administrator moderation", "id", id.toString()));
    }
}
