package com.campus.marketplace.service;

import com.campus.marketplace.dto.ListingResponseDto;
import com.campus.marketplace.entity.Listing;
import com.campus.marketplace.entity.User;
import com.campus.marketplace.entity.Wishlist;
import com.campus.marketplace.exception.BadRequestException;
import com.campus.marketplace.exception.ResourceNotFoundException;
import com.campus.marketplace.repository.ListingRepository;
import com.campus.marketplace.repository.WishlistRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final ListingRepository listingRepository;
    private final AuthService authService;
    private final ListingService listingService;

    public WishlistService(WishlistRepository wishlistRepository,
                           ListingRepository listingRepository,
                           AuthService authService,
                           ListingService listingService) {
        this.wishlistRepository = wishlistRepository;
        this.listingRepository = listingRepository;
        this.authService = authService;
        this.listingService = listingService;
    }

    @Transactional
    public void addToWishlist(Long listingId) {
        User user = authService.getAuthenticatedUser();
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found with ID: " + listingId));

        if (listing.getSeller().getId().equals(user.getId())) {
            throw new BadRequestException("You cannot add your own listing to your wishlist");
        }

        if (!wishlistRepository.existsByUserIdAndListingId(user.getId(), listingId)) {
            Wishlist item = new Wishlist(user, listing);
            wishlistRepository.save(item);
        }
    }

    @Transactional
    public void removeFromWishlist(Long listingId) {
        User user = authService.getAuthenticatedUser();
        wishlistRepository.deleteByUserIdAndListingId(user.getId(), listingId);
    }

    @Transactional(readOnly = true)
    public List<ListingResponseDto> getMyWishlist() {
        User user = authService.getAuthenticatedUser();
        return wishlistRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(w -> listingService.mapToDto(w.getListing()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Long> getMyWishlistListingIds() {
        User user = authService.getAuthenticatedUser();
        return wishlistRepository.findListingIdsByUserId(user.getId());
    }

    @Transactional(readOnly = true)
    public boolean isInWishlist(Long listingId) {
        User user = authService.getAuthenticatedUser();
        return wishlistRepository.existsByUserIdAndListingId(user.getId(), listingId);
    }
}
