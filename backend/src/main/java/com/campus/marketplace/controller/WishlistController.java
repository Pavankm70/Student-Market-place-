package com.campus.marketplace.controller;

import com.campus.marketplace.dto.ListingResponseDto;
import com.campus.marketplace.service.WishlistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wishlist")
@Tag(name = "Wishlist", description = "Student wishlist & saved listings management")
public class WishlistController {

    private final WishlistService wishlistService;

    public WishlistController(WishlistService wishlistService) {
        this.wishlistService = wishlistService;
    }

    @GetMapping
    @Operation(summary = "Get all saved listings in the authenticated student's wishlist")
    public ResponseEntity<List<ListingResponseDto>> getMyWishlist() {
        return ResponseEntity.ok(wishlistService.getMyWishlist());
    }

    @GetMapping("/ids")
    @Operation(summary = "Get all listing IDs currently in the authenticated student's wishlist")
    public ResponseEntity<List<Long>> getMyWishlistListingIds() {
        return ResponseEntity.ok(wishlistService.getMyWishlistListingIds());
    }

    @PostMapping("/{listingId}")
    @Operation(summary = "Add a listing to the authenticated student's wishlist")
    public ResponseEntity<Map<String, Object>> addToWishlist(@PathVariable Long listingId) {
        wishlistService.addToWishlist(listingId);
        return ResponseEntity.ok(Map.of("message", "Listing added to wishlist", "listingId", listingId, "saved", true));
    }

    @DeleteMapping("/{listingId}")
    @Operation(summary = "Remove a listing from the authenticated student's wishlist")
    public ResponseEntity<Map<String, Object>> removeFromWishlist(@PathVariable Long listingId) {
        wishlistService.removeFromWishlist(listingId);
        return ResponseEntity.ok(Map.of("message", "Listing removed from wishlist", "listingId", listingId, "saved", false));
    }
}
