package com.campus.marketplace.controller;

import com.campus.marketplace.dto.BookLookupResponseDto;
import com.campus.marketplace.service.ExternalBookService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/books")
@Tag(name = "External Book Lookup", description = "Query textbook metadata by ISBN or title")
public class ExternalBookController {

    private final ExternalBookService externalBookService;

    public ExternalBookController(ExternalBookService externalBookService) {
        this.externalBookService = externalBookService;
    }

    @GetMapping("/lookup")
    @Operation(summary = "Search external books database by title or ISBN to auto-populate listing")
    public ResponseEntity<List<BookLookupResponseDto>> lookupBooks(@RequestParam String query) {
        List<BookLookupResponseDto> results = externalBookService.searchBooks(query);
        return ResponseEntity.ok(results);
    }
}
