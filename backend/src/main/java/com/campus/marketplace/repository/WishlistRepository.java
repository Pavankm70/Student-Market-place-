package com.campus.marketplace.repository;

import com.campus.marketplace.entity.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, Long> {

    List<Wishlist> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Wishlist> findByUserIdAndListingId(Long userId, Long listingId);

    boolean existsByUserIdAndListingId(Long userId, Long listingId);

    void deleteByUserIdAndListingId(Long userId, Long listingId);

    @Query("SELECT w.listing.id FROM Wishlist w WHERE w.user.id = :userId")
    List<Long> findListingIdsByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM Wishlist w WHERE w.listing.id = :listingId")
    void deleteByListingId(@Param("listingId") Long listingId);
}
