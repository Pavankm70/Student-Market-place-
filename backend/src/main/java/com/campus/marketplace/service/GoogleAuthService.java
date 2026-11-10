package com.campus.marketplace.service;

import com.campus.marketplace.dto.AuthResponse;
import com.campus.marketplace.dto.UserDto;
import com.campus.marketplace.entity.Role;
import com.campus.marketplace.entity.User;
import com.campus.marketplace.entity.VerificationStatus;
import com.campus.marketplace.exception.BadRequestException;
import com.campus.marketplace.exception.ForbiddenException;
import com.campus.marketplace.exception.UnauthorizedException;
import com.campus.marketplace.repository.UserRepository;
import com.campus.marketplace.security.JwtService;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class GoogleAuthService {

    private static final Logger log = LoggerFactory.getLogger(GoogleAuthService.class);

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.google.client-id:}")
    private String googleClientId;

    @Value("${app.google.enforce-gmail-only:true}")
    private boolean enforceGmailOnly;

    @Value("${app.college.allowed-domains:nmit.ac.in,campus.edu}")
    private String allowedDomainsConfig;

    @Value("${app.college.require-verification-review:false}")
    private boolean requireVerificationReview;

    private GoogleIdTokenVerifier verifier;

    public GoogleAuthService(UserRepository userRepository,
                             JwtService jwtService,
                             PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    public synchronized GoogleIdTokenVerifier getVerifier() {
        if (this.verifier == null) {
            this.verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance()
            )
                    .setAudience(Collections.singletonList(googleClientId != null ? googleClientId.trim() : ""))
                    .build();
        }
        return this.verifier;
    }

    public void setVerifier(GoogleIdTokenVerifier verifier) {
        this.verifier = verifier;
    }

    public void setGoogleClientId(String googleClientId) {
        this.googleClientId = googleClientId;
        this.verifier = null;
    }

    public void setEnforceGmailOnly(boolean enforceGmailOnly) {
        this.enforceGmailOnly = enforceGmailOnly;
    }

    public void setAllowedDomainsConfig(String allowedDomainsConfig) {
        this.allowedDomainsConfig = allowedDomainsConfig;
    }

    public void setRequireVerificationReview(boolean requireVerificationReview) {
        this.requireVerificationReview = requireVerificationReview;
    }

    @Transactional
    public AuthResponse authenticateGoogleUser(String idTokenString) {
        return authenticateGoogleUser(idTokenString, "login");
    }

    @Transactional
    public AuthResponse authenticateGoogleUser(String idTokenString, String mode) {
        if (idTokenString == null || idTokenString.trim().isEmpty()) {
            throw new BadRequestException("Google ID token is required");
        }

        if (googleClientId == null || googleClientId.trim().isEmpty()) {
            log.warn("[GOOGLE-AUTH] GOOGLE_CLIENT_ID is not configured in backend environment.");
            throw new BadRequestException("Google Sign-In is not currently enabled because GOOGLE_CLIENT_ID is not configured on the server. Please sign in with your email or set GOOGLE_CLIENT_ID.");
        }

        GoogleIdTokenVerifier tokenVerifier = getVerifier();

        GoogleIdToken idToken;
        try {
            idToken = tokenVerifier.verify(idTokenString.trim());
        } catch (Exception e) {
            log.error("[GOOGLE-AUTH-ERROR] Token verification failed: {}", e.getMessage());
            throw new UnauthorizedException("Google authentication failed: " + e.getMessage());
        }

        if (idToken == null) {
            throw new UnauthorizedException("Invalid or expired Google ID token");
        }

        GoogleIdToken.Payload payload = idToken.getPayload();
        if (payload == null) {
            throw new UnauthorizedException("Google ID token payload is missing");
        }

        // 1. Validate Issuer claim
        String issuer = payload.getIssuer();
        if (issuer == null || (!"accounts.google.com".equals(issuer) && !"https://accounts.google.com".equals(issuer))) {
            log.warn("[GOOGLE-AUTH-ERROR] Invalid issuer: {}", issuer);
            throw new UnauthorizedException("Invalid Google token issuer: " + issuer);
        }

        // 2. Validate Audience claim
        Object aud = payload.getAudience();
        boolean audienceMatches = false;
        String trimmedClientId = googleClientId.trim();
        if (aud instanceof String audStr) {
            audienceMatches = trimmedClientId.equals(audStr.trim());
        } else if (aud instanceof List<?> audList) {
            audienceMatches = audList.contains(trimmedClientId);
        }
        if (!audienceMatches) {
            log.warn("[GOOGLE-AUTH-ERROR] Audience mismatch: expected={}, received={}", trimmedClientId, aud);
            throw new UnauthorizedException("Google token audience mismatch");
        }

        // 3. Validate Expiration claim
        Long exp = payload.getExpirationTimeSeconds();
        if (exp == null || (exp * 1000L) <= System.currentTimeMillis()) {
            log.warn("[GOOGLE-AUTH-ERROR] Token expired at: {}", exp);
            throw new UnauthorizedException("Google ID token has expired");
        }

        // 4. Validate email_verified claim
        Boolean emailVerified = payload.getEmailVerified();
        if (emailVerified == null || !emailVerified) {
            log.warn("[GOOGLE-AUTH-ERROR] Email not verified by Google for sub={}", payload.getSubject());
            throw new UnauthorizedException("Google account email is not verified by Google");
        }

        // 5. Extract email strictly from verified token payload (never from client form/request body)
        String email = payload.getEmail() != null ? payload.getEmail().trim().toLowerCase() : "";
        if (email.isEmpty()) {
            throw new BadRequestException("Email address not found in Google ID token");
        }

        // 6. Enforce verified Gmail address ending in @gmail.com (or @googlemail.com)
        if (enforceGmailOnly) {
            if (!email.endsWith("@gmail.com") && !email.endsWith("@googlemail.com")) {
                log.warn("[GOOGLE-AUTH-ERROR] Rejected non-Gmail address: {}", email);
                throw new ForbiddenException("CampusLoop requires a verified @gmail.com address. Only Gmail accounts (@gmail.com) are permitted.");
            }
        }

        String name = (String) payload.get("name");
        String googleSub = payload.getSubject();
        String hostedDomain = (String) payload.get("hd");

        // CampusLoop is open to all valid Gmail users
        boolean isCollegeDomain = isEligibleCollegeEmail(email, hostedDomain) || email.endsWith("@gmail.com");
        VerificationStatus initialStatus = determineVerificationStatus(isCollegeDomain);

        // 8. Associate using Google's stable subject identifier (sub)
        User user = userRepository.findByGoogleSub(googleSub).orElse(null);

        // If not found by sub, check by email
        if (user == null) {
            java.util.Optional<User> byEmail = userRepository.findByEmail(email);
            if (byEmail.isPresent()) {
                User existing = byEmail.get();
                // 11. Prevent duplicate accounts and unsafe account linking
                if (existing.getGoogleSub() != null && !existing.getGoogleSub().equals(googleSub)) {
                    log.warn("[GOOGLE-AUTH-ERROR] Unsafe account linking attempt: email='{}', existingSub='{}', incomingSub='{}'",
                            email, existing.getGoogleSub(), googleSub);
                    throw new BadRequestException("An account with this email is already linked to a different Google account.");
                }
                existing.setGoogleSub(googleSub);
                user = existing;
            }
        }

        // 10. Login allows an existing, associated account to sign in.
        // If the account is not registered, direct the user to registration.
        boolean isLoginMode = "login".equalsIgnoreCase(mode);
        if (isLoginMode && user == null) {
            log.info("[GOOGLE-AUTH-LOGIN-UNREGISTERED] User with sub='{}' and email='{}' not registered yet", googleSub, email);
            throw new com.campus.marketplace.exception.ResourceNotFoundException(
                    "No CampusLoop account found for this Google email (" + email + "). Please create an account via Registration first.");
        }

        if (user != null) {
            // Check suspension status
            if (user.isSuspended()) {
                throw new ForbiddenException("Your student account has been suspended by an administrator. Please contact support.");
            }

            // Link Google sub and update auth provider if local account is now signing in with Google
            if (user.getGoogleSub() == null) {
                user.setGoogleSub(googleSub);
            }
            if ("LOCAL".equalsIgnoreCase(user.getAuthProvider())) {
                user.setAuthProvider("GOOGLE");
            }

            // Preserve existing user role; Google Sign-In must NEVER grant administrator privileges
            if (user.getRole() == null) {
                user.setRole(Role.ROLE_STUDENT);
            }

            // Set verified status for valid Gmail users
            if (user.getVerificationStatus() == VerificationStatus.UNVERIFIED) {
                user.setVerificationStatus(VerificationStatus.COLLEGE_VERIFIED);
                user.setCollegeDomain("gmail.com");
            }

            user = userRepository.save(user);
            log.info("[GOOGLE-AUTH-SUCCESS] Existing user login: id={}, email='{}', role={}, status={}",
                    user.getId(), user.getEmail(), user.getRole(), user.getVerificationStatus());
        } else {
            // 9. Registration creates an account only after successful backend verification
            user = new User();
            user.setName(name != null && !name.isBlank() ? name.trim() : email.split("@")[0]);
            user.setEmail(email);
            // Secure random password for OAuth accounts
            user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
            user.setGoogleSub(googleSub);
            user.setAuthProvider("GOOGLE");
            // 12. Never grant admin privileges through Google registration: strictly ROLE_STUDENT
            user.setRole(Role.ROLE_STUDENT);
            user.setVerificationStatus(VerificationStatus.COLLEGE_VERIFIED);
            user.setCampusName("CampusLoop");
            user.setCollegeDomain("gmail.com");
            user.setCollegeName("CampusLoop Verified");

            user = userRepository.save(user);
            log.info("[GOOGLE-AUTH-SUCCESS] New student registered via Google: id={}, email='{}', role={}, status={}",
                    user.getId(), user.getEmail(), user.getRole(), user.getVerificationStatus());
        }

        // 13. Issue application's existing JWT token
        String jwtToken = jwtService.generateToken(user.getId(), user.getEmail(), user.getName());
        return new AuthResponse(jwtToken, mapToUserDto(user));
    }

    public boolean isEligibleCollegeEmail(String email, String hostedDomain) {
        if (email == null) return false;
        List<String> allowedDomains = getAllowedDomains();

        String emailDomain = extractDomain(email).toLowerCase();
        for (String allowed : allowedDomains) {
            if (emailDomain.equalsIgnoreCase(allowed) || emailDomain.endsWith("." + allowed)) {
                return true;
            }
        }

        if (hostedDomain != null) {
            String hd = hostedDomain.trim().toLowerCase();
            for (String allowed : allowedDomains) {
                if (hd.equalsIgnoreCase(allowed) || hd.endsWith("." + allowed)) {
                    return true;
                }
            }
        }

        return false;
    }

    public VerificationStatus determineVerificationStatus(boolean isCollegeDomain) {
        if (!isCollegeDomain) {
            return VerificationStatus.UNVERIFIED;
        }
        return requireVerificationReview ? VerificationStatus.PENDING_REVIEW : VerificationStatus.COLLEGE_VERIFIED;
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
