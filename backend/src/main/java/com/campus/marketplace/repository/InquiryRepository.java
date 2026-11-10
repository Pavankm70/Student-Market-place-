package com.campus.marketplace.repository;

import com.campus.marketplace.entity.Inquiry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InquiryRepository extends JpaRepository<Inquiry, Long> {

    List<Inquiry> findByListingIdOrderByCreatedAtDesc(Long listingId);

    List<Inquiry> findByReceiverIdOrderByCreatedAtDesc(Long receiverId);

    List<Inquiry> findBySenderIdOrderByCreatedAtDesc(Long senderId);

    long countByListingId(Long listingId);

    @Query("SELECT i FROM Inquiry i WHERE i.sender.id = :userId OR i.receiver.id = :userId ORDER BY COALESCE(i.updatedAt, i.createdAt) DESC")
    List<Inquiry> findAllUserConversations(@Param("userId") Long userId);

    Optional<Inquiry> findByListingIdAndSenderId(Long listingId, Long senderId);

    @Modifying
    @Query("DELETE FROM Inquiry i WHERE i.listing.id = :listingId")
    void deleteByListingId(@Param("listingId") Long listingId);
}
