package com.campus.marketplace.repository;

import com.campus.marketplace.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByListingIdAndIsModeratedFalseOrderByCreatedAtDesc(Long listingId);

    List<Review> findBySellerIdAndIsModeratedFalseOrderByCreatedAtDesc(Long sellerId);

    Optional<Review> findByOrderIdAndReviewerId(Long orderId, Long reviewerId);

    boolean existsByOrderIdAndReviewerId(Long orderId, Long reviewerId);

    List<Review> findByIsReportedTrueOrderByCreatedAtDesc();

    Page<Review> findByIsReportedTrueOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.seller.id = :sellerId AND r.isModerated = false")
    Double calculateAverageRatingForSeller(@Param("sellerId") Long sellerId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.seller.id = :sellerId AND r.isModerated = false")
    long countApprovedReviewsForSeller(@Param("sellerId") Long sellerId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.listing.id = :listingId AND r.isModerated = false")
    Double calculateAverageRatingForListing(@Param("listingId") Long listingId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.listing.id = :listingId AND r.isModerated = false")
    long countApprovedReviewsForListing(@Param("listingId") Long listingId);
}
