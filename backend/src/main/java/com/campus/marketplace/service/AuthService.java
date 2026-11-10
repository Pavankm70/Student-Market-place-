package com.campus.marketplace.service;

import com.campus.marketplace.dto.AuthResponse;
import com.campus.marketplace.dto.LoginRequest;
import com.campus.marketplace.dto.RegisterRequest;
import com.campus.marketplace.dto.UserDto;
import com.campus.marketplace.entity.Role;
import com.campus.marketplace.entity.User;
import com.campus.marketplace.entity.VerificationStatus;
import com.campus.marketplace.exception.BadRequestException;
import com.campus.marketplace.exception.ForbiddenException;
import com.campus.marketplace.exception.ResourceNotFoundException;
import com.campus.marketplace.exception.UnauthorizedException;
import com.campus.marketplace.repository.UserRepository;
import com.campus.marketplace.security.CustomUserDetails;
import com.campus.marketplace.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Value("${app.college.allowed-domains:nmit.ac.in,campus.edu}")
    private String allowedDomainsConfig;

    @Value("${app.college.require-verification-review:false}")
    private boolean requireVerificationReview;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Feature 1: Require Google Sign-In for registration.
        // Do not allow users to create accounts merely by entering an arbitrary Gmail address and password.
        throw new BadRequestException("Direct password registration is disabled. CampusLoop requires Google Sign-In with a verified @gmail.com account to register.");
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        if (user.isSuspended()) {
            throw new ForbiddenException("Your student account has been suspended by an administrator. Please contact support.");
        }

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword())
        );

        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getName());
        UserDto userDto = mapToUserDto(user);

        return new AuthResponse(token, userDto);
    }

    public boolean isEligibleCollegeDomain(String email) {
        if (email == null) return false;
        String domain = extractDomain(email).toLowerCase();
        List<String> allowed = getAllowedDomains();
        for (String a : allowed) {
            if (domain.equalsIgnoreCase(a) || domain.endsWith("." + a)) {
                return true;
            }
        }
        return false;
    }

    public List<String> getAllowedDomains() {
        if (allowedDomainsConfig == null || allowedDomainsConfig.isBlank()) {
            return Collections.singletonList("nmit.ac.in");
        }
        return Arrays.stream(allowedDomainsConfig.split(","))
                .map(String::trim)
                .map(String::toLowerCase)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    private String extractDomain(String email) {
        int atIndex = email.indexOf("@");
        if (atIndex >= 0 && atIndex < email.length() - 1) {
            return email.substring(atIndex + 1).trim();
        }
        return "";
    }

    @Transactional(readOnly = true)
    public User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated() ||
                "anonymousUser".equals(authentication.getPrincipal())) {
            throw new UnauthorizedException("You must be logged in to perform this action");
        }

        if (authentication.getPrincipal() instanceof CustomUserDetails userDetails) {
            return userRepository.findById(userDetails.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userDetails.getId()));
        }

        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    public UserDto mapToUserDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setSellerId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setCampusName(user.getCampusName());
        dto.setRole(user.getRole() != null ? user.getRole() : Role.ROLE_STUDENT);
        dto.setVerificationStatus(user.getVerificationStatus() != null ? user.getVerificationStatus() : VerificationStatus.UNVERIFIED);
        dto.setCollegeVerified(user.getVerificationStatus() == VerificationStatus.COLLEGE_VERIFIED);
        dto.setCollegeName(user.getCollegeName());
        dto.setCollegeDomain(user.getCollegeDomain());
        dto.setIdCardImageUrl(user.getIdCardImageUrl());
        dto.setAuthProvider(user.getAuthProvider());
        dto.setSuspended(user.isSuspended());
        dto.setAverageRating(user.getAverageRating());
        dto.setTotalReviews(user.getTotalReviews() != null ? user.getTotalReviews() : 0);
        dto.setCreatedAt(user.getCreatedAt());
        return dto;
    }
}
