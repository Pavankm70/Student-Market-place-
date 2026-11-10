package com.campus.marketplace.config;

import com.campus.marketplace.entity.Role;
import com.campus.marketplace.entity.User;
import com.campus.marketplace.entity.VerificationStatus;
import com.campus.marketplace.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * DataInitializer runs on application startup.
 * Ensures the initial Super Admin account is available for platform administration
 * without generating fabricated dummy listings or fake reviews.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (!userRepository.existsByEmail("admin@nmit.ac.in")) {
            User admin = new User();
            admin.setName("Super Admin");
            admin.setEmail("admin@nmit.ac.in");
            admin.setPassword(passwordEncoder.encode("Password123!"));
            admin.setPhone("9999999999");
            admin.setCampusName("NMIT Campus Administration");
            admin.setRole(Role.ROLE_SUPER_ADMIN);
            admin.setVerificationStatus(VerificationStatus.COLLEGE_VERIFIED);
            admin.setCollegeName("NMIT");
            admin.setCollegeDomain("nmit.ac.in");
            userRepository.save(admin);
            log.info("[DATA-INIT] Initial Super Admin account established: admin@nmit.ac.in");
        }
        log.info("CampusLoop initialized successfully in clean production mode.");
    }
}
