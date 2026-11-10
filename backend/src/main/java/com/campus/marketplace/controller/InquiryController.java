package com.campus.marketplace.controller;

import com.campus.marketplace.dto.InquiryReplyRequestDto;
import com.campus.marketplace.dto.InquiryRequestDto;
import com.campus.marketplace.dto.InquiryResponseDto;
import com.campus.marketplace.service.InquiryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@Tag(name = "Inquiries & Chat", description = "Student buyer-to-seller direct messaging and inquiries")
public class InquiryController {

    private final InquiryService inquiryService;

    public InquiryController(InquiryService inquiryService) {
        this.inquiryService = inquiryService;
    }

    @PostMapping("/listings/{listingId}/inquiries")
    @Operation(summary = "Send an inquiry or start a direct chat with the seller regarding a listing")
    public ResponseEntity<InquiryResponseDto> sendInquiry(
            @PathVariable Long listingId,
            @Valid @RequestBody InquiryRequestDto dto) {
        InquiryResponseDto created = inquiryService.createInquiry(listingId, dto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping("/inquiries")
    @Operation(summary = "Get all direct chat conversations for the authenticated student (buying & selling)")
    public ResponseEntity<List<InquiryResponseDto>> getAllConversations() {
        return ResponseEntity.ok(inquiryService.getAllUserConversations());
    }

    @GetMapping("/inquiries/{id}")
    @Operation(summary = "Get full conversation thread with all replies by ID")
    public ResponseEntity<InquiryResponseDto> getConversation(@PathVariable Long id) {
        return ResponseEntity.ok(inquiryService.getConversationById(id));
    }

    @PostMapping("/inquiries/{id}/reply")
    @Operation(summary = "Send a direct reply in an existing conversation thread")
    public ResponseEntity<InquiryResponseDto> sendReply(
            @PathVariable Long id,
            @Valid @RequestBody InquiryReplyRequestDto dto) {
        InquiryResponseDto updated = inquiryService.replyToInquiry(id, dto);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/inquiries/listing/{listingId}")
    @Operation(summary = "Get existing conversation for a specific listing for the authenticated user, if any")
    public ResponseEntity<InquiryResponseDto> getInquiryByListing(@PathVariable Long listingId) {
        return inquiryService.getInquiryByListingForCurrentUser(listingId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @GetMapping("/listings/{listingId}/inquiries")
    @Operation(summary = "Get inquiries for a specific listing (owner view)")
    public ResponseEntity<List<InquiryResponseDto>> getInquiriesForListing(@PathVariable Long listingId) {
        return ResponseEntity.ok(inquiryService.getInquiriesForListing(listingId));
    }

    @GetMapping("/inquiries/received")
    @Operation(summary = "Get all inquiries received by the authenticated seller")
    public ResponseEntity<List<InquiryResponseDto>> getReceivedInquiries() {
        return ResponseEntity.ok(inquiryService.getReceivedInquiries());
    }
}
