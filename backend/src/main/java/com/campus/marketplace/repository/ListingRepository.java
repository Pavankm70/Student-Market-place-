package com.campus.marketplace.repository;

import com.campus.marketplace.entity.Category;
import com.campus.marketplace.entity.Listing;
import com.campus.marketplace.entity.ListingStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ListingRepository extends JpaRepository<Listing, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT l FROM Listing l WHERE l.id = :id")
    Optional<Listing> findByIdForUpdate(@Param("id") Long id);

    List<Listing> findBySellerIdOrderByCreatedAtDesc(Long sellerId);

    List<Listing> findBySellerIdAndStatusNotOrderByCreatedAtDesc(Long sellerId, ListingStatus status);

    Page<Listing> findBySellerIdOrderByCreatedAtDesc(Long sellerId, Pageable pageable);

    Page<Listing> findBySellerIdAndStatusNotOrderByCreatedAtDesc(Long sellerId, ListingStatus status, Pageable pageable);

    List<Listing> findTop6ByStatusOrderByCreatedAtDesc(ListingStatus status);

    long countByStatus(ListingStatus status);

    long countBySellerId(Long sellerId);

    long countBySellerIdAndStatus(Long sellerId, ListingStatus status);

    @Query("SELECT l FROM Listing l WHERE " +
           "l.status <> com.campus.marketplace.entity.ListingStatus.ARCHIVED AND " +
           "(:status IS NULL OR l.status = :status) AND " +
           "(:category IS NULL OR l.category = :category) AND " +
           "(:conditionType IS NULL OR :conditionType = '' OR l.conditionType = :conditionType) AND " +
           "(:minPrice IS NULL OR l.price >= :minPrice) AND " +
           "(:maxPrice IS NULL OR l.price <= :maxPrice) AND " +
           "(:searchTerm IS NULL OR :searchTerm = '' OR " +
           " LOWER(l.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           " LOWER(l.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    List<Listing> searchAndFilter(
            @Param("searchTerm") String searchTerm,
            @Param("category") Category category,
            @Param("status") ListingStatus status,
            @Param("conditionType") String conditionType,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            Sort sort
    );

    Page<Listing> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
