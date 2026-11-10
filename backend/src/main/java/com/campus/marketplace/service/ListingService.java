package com.campus.marketplace.service;

import com.campus.marketplace.dto.ListingRequestDto;
import com.campus.marketplace.dto.ListingResponseDto;
import com.campus.marketplace.entity.*;
import com.campus.marketplace.exception.BadRequestException;
import com.campus.marketplace.exception.ForbiddenException;
import com.campus.marketplace.exception.ResourceNotFoundException;
import com.campus.marketplace.repository.InquiryRepository;
import com.campus.marketplace.repository.ListingRepository;
import com.campus.marketplace.repository.OrderRepository;
import com.campus.marketplace.repository.WishlistRepository;
import com.campus.marketplace.util.GeoUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ListingService {

    private static final Logger log = LoggerFactory.getLogger(ListingService.class);

    private final ListingRepository listingRepository;
    private final AuthService authService;
    private final WishlistRepository wishlistRepository;
    private final InquiryRepository inquiryRepository;
    private final OrderRepository orderRepository;

    public ListingService(ListingRepository listingRepository,
                          AuthService authService,
                          WishlistRepository wishlistRepository,
                          InquiryRepository inquiryRepository,
                          OrderRepository orderRepository) {
        this.listingRepository = listingRepository;
        this.authService = authService;
        this.wishlistRepository = wishlistRepository;
        this.inquiryRepository = inquiryRepository;
        this.orderRepository = orderRepository;
    }

    @Transactional
    public ListingResponseDto createListing(ListingRequestDto dto) {
        User currentUser = authService.getAuthenticatedUser();

        // Validate coordinates if provided
        validateCoordinates(dto.getLatitude(), dto.getLongitude());

        Listing listing = new Listing();
        listing.setTitle(dto.getTitle().trim());
        listing.setDescription(dto.getDescription().trim());
        listing.setPrice(dto.getPrice());
        listing.setCategory(dto.getCategory());
        listing.setImageUrl(dto.getImageUrl());
        listing.setConditionType(dto.getConditionType() != null ? dto.getConditionType() : "Good");
        listing.setIsbn(dto.getIsbn());
        listing.setAuthor(dto.getAuthor());
        listing.setPickupLocation(dto.getPickupLocation() != null ? dto.getPickupLocation() : "Campus Student Center");
        listing.setPickupDescription(dto.getPickupDescription());
        listing.setLatitude(dto.getLatitude());
        listing.setLongitude(dto.getLongitude());
        listing.setStatus(ListingStatus.AVAILABLE);
        listing.setSeller(currentUser);

        Listing saved = listingRepository.save(listing);
        log.info("[LISTING-CREATED] id={}, title='{}', sellerId={}, lat={}, lng={}",
                saved.getId(), saved.getTitle(), currentUser.getId(), saved.getLatitude(), saved.getLongitude());
        return mapToDto(saved);
    }

    @Transactional
    public ListingResponseDto updateListing(Long id, ListingRequestDto dto) {
        User currentUser = authService.getAuthenticatedUser();
        Listing listing = findListingOrThrow(id);

        // Strict Owner Authorization Check (or Super Admin)
        boolean isOwner = listing.getSeller().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == Role.ROLE_SUPER_ADMIN;

        if (!isOwner && !isAdmin) {
            throw new ForbiddenException("You are not authorized to edit this listing. Only the verified seller (User ID: " + listing.getSeller().getId() + ") or an administrator has permission.");
        }

        validateCoordinates(dto.getLatitude(), dto.getLongitude());

        listing.setTitle(dto.getTitle().trim());
        listing.setDescription(dto.getDescription().trim());
        listing.setPrice(dto.getPrice());
        listing.setCategory(dto.getCategory());
        if (dto.getImageUrl() != null && !dto.getImageUrl().isBlank()) {
            listing.setImageUrl(dto.getImageUrl());
        }
        if (dto.getConditionType() != null) {
            listing.setConditionType(dto.getConditionType());
        }
        listing.setIsbn(dto.getIsbn());
        listing.setAuthor(dto.getAuthor());
        if (dto.getPickupLocation() != null) {
            listing.setPickupLocation(dto.getPickupLocation());
        }
        listing.setPickupDescription(dto.getPickupDescription());
        listing.setLatitude(dto.getLatitude());
        listing.setLongitude(dto.getLongitude());

        if (dto.getStatus() != null) {
            listing.setStatus(dto.getStatus());
        }

        Listing updated = listingRepository.save(listing);
        log.info("[LISTING-UPDATED] id={}, title='{}', sellerId={}",
                updated.getId(), updated.getTitle(), currentUser.getId());
        return mapToDto(updated);
    }

    @Transactional
    public Map<String, Object> deleteListing(Long id) {
        User currentUser = authService.getAuthenticatedUser();
        Listing listing = findListingOrThrow(id);

        boolean isOwner = listing.getSeller().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == Role.ROLE_SUPER_ADMIN;

        if (!isOwner && !isAdmin) {
            throw new ForbiddenException("You are not authorized to delete this listing. Only the verified seller (User ID: " + listing.getSeller().getId() + ") or an administrator has permission.");
        }

        // Always clean up wishlist associations
        wishlistRepository.deleteByListingId(id);

        // Check if this listing has historical orders
        boolean hasOrderHistory = orderRepository.existsByListingId(id);

        if (hasOrderHistory) {
            // Safely archive the listing so past orders, invoices, and payments remain intact
            listing.setStatus(ListingStatus.ARCHIVED);
            listingRepository.save(listing);
            log.info("[LISTING-ARCHIVED] id={}, title='{}', sellerId={}, archivedByUserId={}",
                    id, listing.getTitle(), listing.getSeller().getId(), currentUser.getId());
            return Map.of(
                    "action", "archived",
                    "status", "ARCHIVED",
                    "id", id,
                    "message", "Listing has historical order records and was safely archived. It is now hidden from the marketplace."
            );
        } else {
            // No orders exist: safe to permanently remove
            listingRepository.delete(listing);
            log.info("[LISTING-DELETED] id={}, title='{}', deletedByUserId={}", id, listing.getTitle(), currentUser.getId());
            return Map.of(
                    "action", "deleted",
                    "status", "DELETED",
                    "id", id,
                    "message", "Listing was permanently deleted successfully."
            );
        }
    }

    @Transactional
    public ListingResponseDto archiveListing(Long id) {
        wishlistRepository.deleteByListingId(id);
        return updateListingStatusByOwner(id, ListingStatus.ARCHIVED);
    }

    @Transactional
    public ListingResponseDto markAsSold(Long id) {
        return updateListingStatusByOwner(id, ListingStatus.SOLD);
    }

    @Transactional
    public ListingResponseDto markAsReserved(Long id) {
        return updateListingStatusByOwner(id, ListingStatus.RESERVED);
    }

    @Transactional
    public ListingResponseDto markAsAvailable(Long id) {
        return updateListingStatusByOwner(id, ListingStatus.AVAILABLE);
    }

    private ListingResponseDto updateListingStatusByOwner(Long id, ListingStatus newStatus) {
        User currentUser = authService.getAuthenticatedUser();
        Listing listing = findListingOrThrow(id);

        boolean isOwner = listing.getSeller().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == Role.ROLE_SUPER_ADMIN;

        if (!isOwner && !isAdmin) {
            throw new ForbiddenException("You are not authorized to modify this listing status. Only the verified seller has permission.");
        }

        listing.setStatus(newStatus);
        Listing updated = listingRepository.save(listing);
        return mapToDto(updated);
    }

    @Transactional
    public ListingResponseDto getListingById(Long id) {
        return getListingById(id, null, null);
    }

    @Transactional
    public ListingResponseDto getListingById(Long id, Double buyerLat, Double buyerLng) {
        Listing listing = findListingOrThrow(id);

        // Check if listing has a stale reservation that has expired
        if (listing.getStatus() == ListingStatus.RESERVED) {
            List<Order> pendingOrders = orderRepository.findByListingIdAndStatus(listing.getId(), OrderStatus.PENDING_PAYMENT);
            boolean hasActivePending = false;
            for (Order pending : pendingOrders) {
                if (pending.getCreatedAt() != null && pending.getCreatedAt().plusMinutes(15).isAfter(LocalDateTime.now())) {
                    hasActivePending = true;
                } else {
                    pending.setStatus(OrderStatus.CANCELLED);
                    orderRepository.save(pending);
                }
            }
            if (!hasActivePending) {
                listing.setStatus(ListingStatus.AVAILABLE);
                listing = listingRepository.save(listing);
                log.info("[LISTING-REVERTED] Listing id={} auto-reverted from RESERVED to AVAILABLE due to expired reservation", listing.getId());
            }
        }

        Double distanceKm = null;
        if (GeoUtils.isValidCoordinate(buyerLat, buyerLng)) {
            distanceKm = GeoUtils.calculateDistanceKm(buyerLat, buyerLng, listing.getLatitude(), listing.getLongitude());
        }
        return mapToDto(listing, distanceKm);
    }

    @Transactional(readOnly = true)
    public List<ListingResponseDto> getMyListings() {
        User currentUser = authService.getAuthenticatedUser();
        return listingRepository.findBySellerIdAndStatusNotOrderByCreatedAtDesc(currentUser.getId(), ListingStatus.ARCHIVED)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ListingResponseDto> searchAndFilterListings(
            String search,
            Category category,
            String sort,
            ListingStatus status,
            String conditionType,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Double buyerLat,
            Double buyerLng,
            Double radiusKm) {

        Sort sorting = Sort.by(Sort.Direction.DESC, "createdAt");
        if ("price_asc".equalsIgnoreCase(sort)) {
            sorting = Sort.by(Sort.Direction.ASC, "price");
        } else if ("price_desc".equalsIgnoreCase(sort)) {
            sorting = Sort.by(Sort.Direction.DESC, "price");
        } else if ("newest".equalsIgnoreCase(sort)) {
            sorting = Sort.by(Sort.Direction.DESC, "createdAt");
        }

        String searchTerm = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        List<Listing> listings = listingRepository.searchAndFilter(
                searchTerm, category, status, conditionType, minPrice, maxPrice, sorting);

        boolean hasBuyerCoords = GeoUtils.isValidCoordinate(buyerLat, buyerLng);

        return listings.stream()
                .map(listing -> {
                    Double dist = null;
                    if (hasBuyerCoords) {
                        dist = GeoUtils.calculateDistanceKm(buyerLat, buyerLng, listing.getLatitude(), listing.getLongitude());
                    }
                    return mapToDto(listing, dist);
                })
                .filter(dto -> {
                    // Radius filtering (if buyer coordinates and radius are supplied)
                    if (hasBuyerCoords && radiusKm != null && radiusKm > 0) {
                        // Only include listings within radiusKm
                        return dto.getDistanceKm() != null && dto.getDistanceKm() <= radiusKm;
                    }
                    return true;
                })
                .sorted((a, b) -> {
                    if ("distance".equalsIgnoreCase(sort) || "nearest".equalsIgnoreCase(sort)) {
                        if (a.getDistanceKm() == null && b.getDistanceKm() == null) return 0;
                        if (a.getDistanceKm() == null) return 1;
                        if (b.getDistanceKm() == null) return -1;
                        return Double.compare(a.getDistanceKm(), b.getDistanceKm());
                    }
                    return 0; // Preserve database sort otherwise
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ListingResponseDto> getFeaturedListings() {
        return listingRepository.findTop6ByStatusOrderByCreatedAtDesc(ListingStatus.AVAILABLE)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public Listing findListingOrThrow(Long id) {
        return listingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found with ID: " + id));
    }

    private void validateCoordinates(Double lat, Double lon) {
        if (lat != null || lon != null) {
            if (!GeoUtils.isValidCoordinate(lat, lon)) {
                throw new BadRequestException("Invalid geographical coordinates. Latitude must be between -90 and 90, and longitude between -180 and 180.");
            }
        }
    }

    public ListingResponseDto mapToDto(Listing listing) {
        return mapToDto(listing, null);
    }

    public ListingResponseDto mapToDto(Listing listing, Double distanceKm) {
        ListingResponseDto dto = new ListingResponseDto();
        dto.setId(listing.getId());
        dto.setTitle(listing.getTitle());
        dto.setDescription(listing.getDescription());
        dto.setPrice(listing.getPrice());
        dto.setCategory(listing.getCategory());
        dto.setImageUrl(listing.getImageUrl());
        dto.setStatus(listing.getStatus());
        dto.setConditionType(listing.getConditionType());
        dto.setIsbn(listing.getIsbn());
        dto.setAuthor(listing.getAuthor());
        dto.setPickupLocation(listing.getPickupLocation());
        dto.setPickupDescription(listing.getPickupDescription());
        dto.setLatitude(listing.getLatitude());
        dto.setLongitude(listing.getLongitude());
        dto.setDistanceKm(distanceKm);
        dto.setAverageRating(listing.getAverageRating());
        dto.setTotalReviews(listing.getTotalReviews() != null ? listing.getTotalReviews() : 0);

        if (listing.getSeller() != null) {
            User seller = listing.getSeller();
            dto.setSellerId(seller.getId());
            dto.setSellerUserId(seller.getId());
            dto.setSellerName(seller.getName());
            dto.setSellerEmail(seller.getEmail());
            dto.setSellerPhone(seller.getPhone());
            dto.setSellerCampus(seller.getCampusName());
            dto.setSellerCollegeVerified(seller.getVerificationStatus() == VerificationStatus.COLLEGE_VERIFIED);
            dto.setSellerVerificationStatus(seller.getVerificationStatus());
            dto.setSellerAverageRating(seller.getAverageRating());
            dto.setSellerTotalReviews(seller.getTotalReviews() != null ? seller.getTotalReviews() : 0);
        }

        dto.setCreatedAt(listing.getCreatedAt());
        dto.setUpdatedAt(listing.getUpdatedAt());
        dto.setInquiryCount(inquiryRepository.countByListingId(listing.getId()));
        dto.setHasOrderHistory(orderRepository.existsByListingId(listing.getId()));
        dto.setOrderCount(orderRepository.countByListingId(listing.getId()));

        if (listing.getStatus() == ListingStatus.RESERVED) {
            try {
                User currentUser = authService.getAuthenticatedUser();
                if (currentUser != null) {
                    var pendingOrder = orderRepository.findFirstByBuyerIdAndListingIdAndStatus(
                            currentUser.getId(), listing.getId(), OrderStatus.PENDING_PAYMENT);
                    if (pendingOrder.isPresent()) {
                        dto.setReservedByCurrentBuyer(true);
                        dto.setActivePendingOrderId(pendingOrder.get().getId());
                    }
                }
            } catch (Exception ignored) {
            }
        }

        return dto;
    }
}
