package com.campus.marketplace.repository;

import com.campus.marketplace.entity.Order;
import com.campus.marketplace.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByBuyerIdOrderByCreatedAtDesc(Long buyerId);

    List<Order> findBySellerIdOrderByCreatedAtDesc(Long sellerId);

    Page<Order> findByBuyerIdOrderByCreatedAtDesc(Long buyerId, Pageable pageable);

    Page<Order> findBySellerIdOrderByCreatedAtDesc(Long sellerId, Pageable pageable);

    List<Order> findByListingIdAndStatus(Long listingId, OrderStatus status);

    List<Order> findByStatusAndCreatedAtBefore(OrderStatus status, java.time.LocalDateTime dateTime);

    Optional<Order> findFirstByListingIdAndStatusIn(Long listingId, List<OrderStatus> statuses);

    Optional<Order> findFirstByBuyerIdAndListingIdAndStatus(Long buyerId, Long listingId, OrderStatus status);

    Optional<Order> findFirstByBuyerIdAndListingIdAndStatusIn(Long buyerId, Long listingId, List<OrderStatus> statuses);

    boolean existsByListingIdAndStatusIn(Long listingId, List<OrderStatus> statuses);

    boolean existsByListingId(Long listingId);

    long countByListingId(Long listingId);

    long countByBuyerId(Long buyerId);

    long countByBuyerIdAndStatus(Long buyerId, OrderStatus status);

    @Query("SELECT COALESCE(SUM(o.amount), 0) FROM Order o WHERE o.buyer.id = :buyerId AND o.status IN (:statuses)")
    BigDecimal calculateBuyerSpending(@Param("buyerId") Long buyerId, @Param("statuses") List<OrderStatus> statuses);

    long countBySellerId(Long sellerId);

    long countBySellerIdAndStatus(Long sellerId, OrderStatus status);

    @Query("SELECT COALESCE(SUM(o.amount), 0) FROM Order o WHERE o.seller.id = :sellerId AND o.status IN (:statuses)")
    BigDecimal calculateSellerRevenue(@Param("sellerId") Long sellerId, @Param("statuses") List<OrderStatus> statuses);

    @Query("SELECT COALESCE(SUM(o.amount), 0) FROM Order o WHERE o.status IN (:statuses)")
    BigDecimal calculatePlatformRevenue(@Param("statuses") List<OrderStatus> statuses);

    long countByStatus(OrderStatus status);

    @Query("SELECT o FROM Order o WHERE o.status IN (:statuses) AND (o.buyerPaymentEmailSent = false OR o.sellerOrderEmailSent = false)")
    List<Order> findUnnotifiedPaidOrders(@Param("statuses") List<OrderStatus> statuses);
}
