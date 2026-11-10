package com.campus.marketplace.repository;

import com.campus.marketplace.entity.Role;
import com.campus.marketplace.entity.User;
import com.campus.marketplace.entity.VerificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByGoogleSub(String googleSub);
    boolean existsByEmail(String email);
    long countByRole(Role role);
    long countByVerificationStatus(VerificationStatus status);
    List<User> findByVerificationStatus(VerificationStatus status);
    Page<User> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
