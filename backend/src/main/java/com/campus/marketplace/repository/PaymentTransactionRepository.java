package com.campus.marketplace.repository;

import com.campus.marketplace.entity.PaymentStatus;
import com.campus.marketplace.entity.PaymentTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {

    Optional<PaymentTransaction> findByOrderId(Long orderId);

    Optional<PaymentTransaction> findByRazorpayOrderId(String razorpayOrderId);

    Optional<PaymentTransaction> findByRazorpayPaymentId(String razorpayPaymentId);

    List<PaymentTransaction> findByBuyerIdOrderByCreatedAtDesc(Long buyerId);

    List<PaymentTransaction> findBySellerIdOrderByCreatedAtDesc(Long sellerId);

    Page<PaymentTransaction> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<PaymentTransaction> findByListingIdOrderByCreatedAtDesc(Long listingId);

    Optional<PaymentTransaction> findFirstByListingIdAndBuyerIdOrderByCreatedAtDesc(Long listingId, Long buyerId);

    long countByStatus(PaymentStatus status);
}
