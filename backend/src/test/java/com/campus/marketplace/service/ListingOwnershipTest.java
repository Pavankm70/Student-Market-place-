package com.campus.marketplace.service;

import com.campus.marketplace.dto.ListingRequestDto;
import com.campus.marketplace.entity.Category;
import com.campus.marketplace.entity.Listing;
import com.campus.marketplace.entity.ListingStatus;
import com.campus.marketplace.entity.Role;
import com.campus.marketplace.entity.User;
import com.campus.marketplace.exception.ForbiddenException;
import com.campus.marketplace.repository.InquiryRepository;
import com.campus.marketplace.repository.ListingRepository;
import com.campus.marketplace.repository.WishlistRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ListingOwnershipTest {

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private AuthService authService;

    @Mock
    private WishlistRepository wishlistRepository;

    @Mock
    private InquiryRepository inquiryRepository;

    @Mock
    private com.campus.marketplace.repository.OrderRepository orderRepository;

    @InjectMocks
    private ListingService listingService;

    private User owner;
    private User otherStudent;
    private User superAdmin;
    private Listing listing;

    @BeforeEach
    void setUp() {
        owner = new User("Owner Student", "owner@nmit.ac.in", "pass123");
        owner.setId(101L);
        owner.setRole(Role.ROLE_STUDENT);

        otherStudent = new User("Other Student", "other@nmit.ac.in", "pass123");
        otherStudent.setId(102L);
        otherStudent.setRole(Role.ROLE_STUDENT);

        superAdmin = new User("Super Admin", "admin@nmit.ac.in", "admin123");
        superAdmin.setId(999L);
        superAdmin.setRole(Role.ROLE_SUPER_ADMIN);

        listing = new Listing();
        listing.setId(501L);
        listing.setTitle("Lab Coat & Safety Glasses");
        listing.setPrice(new BigDecimal("300.00"));
        listing.setCategory(Category.LAB_SUPPLIES);
        listing.setStatus(ListingStatus.AVAILABLE);
        listing.setSeller(owner);
    }

    @Test
    @DisplayName("Unauthorized student attempting to edit another student's listing throws HTTP 403 Forbidden")
    void testNonOwnerCannotEditListing() {
        when(authService.getAuthenticatedUser()).thenReturn(otherStudent);
        when(listingRepository.findById(501L)).thenReturn(Optional.of(listing));

        ListingRequestDto editDto = new ListingRequestDto();
        editDto.setTitle("Hacked Title");
        editDto.setDescription("Changed Description");
        editDto.setPrice(new BigDecimal("10.00"));
        editDto.setCategory(Category.LAB_SUPPLIES);

        ForbiddenException ex = assertThrows(ForbiddenException.class, () ->
                listingService.updateListing(501L, editDto));

        assertTrue(ex.getMessage().contains("not authorized to edit this listing"));
        verify(listingRepository, never()).save(any());
    }

    @Test
    @DisplayName("Unauthorized student attempting to delete another student's listing throws HTTP 403 Forbidden")
    void testNonOwnerCannotDeleteListing() {
        when(authService.getAuthenticatedUser()).thenReturn(otherStudent);
        when(listingRepository.findById(501L)).thenReturn(Optional.of(listing));

        ForbiddenException ex = assertThrows(ForbiddenException.class, () ->
                listingService.deleteListing(501L));

        assertTrue(ex.getMessage().contains("not authorized to delete this listing"));
        verify(listingRepository, never()).delete(any());
    }

    @Test
    @DisplayName("Verified owner can update their own listing")
    void testOwnerCanUpdateListing() {
        when(authService.getAuthenticatedUser()).thenReturn(owner);
        when(listingRepository.findById(501L)).thenReturn(Optional.of(listing));
        when(listingRepository.save(any(Listing.class))).thenReturn(listing);

        ListingRequestDto editDto = new ListingRequestDto();
        editDto.setTitle("Updated Lab Coat");
        editDto.setDescription("Clean condition, size L");
        editDto.setPrice(new BigDecimal("350.00"));
        editDto.setCategory(Category.LAB_SUPPLIES);

        assertDoesNotThrow(() -> listingService.updateListing(501L, editDto));
        verify(listingRepository).save(listing);
    }

    @Test
    @DisplayName("Super Admin can moderate and delete unauthorized/abusive listing")
    void testSuperAdminCanDeleteListing() {
        when(authService.getAuthenticatedUser()).thenReturn(superAdmin);
        when(listingRepository.findById(501L)).thenReturn(Optional.of(listing));

        assertDoesNotThrow(() -> listingService.deleteListing(501L));
        verify(listingRepository).delete(listing);
    }
}
