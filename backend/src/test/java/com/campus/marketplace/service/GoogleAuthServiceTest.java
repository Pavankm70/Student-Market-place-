package com.campus.marketplace.service;

import com.campus.marketplace.dto.AuthResponse;
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
import com.google.api.client.json.webtoken.JsonWebSignature;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class GoogleAuthServiceTest {

    private static final String CLIENT_ID = "750855684518-dekld62m5n91sllj00o21mtu3ssbqjn7.apps.googleusercontent.com";
    private static final String GOOGLE_ISSUER = "https://accounts.google.com";

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtService jwtService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private GoogleIdTokenVerifier mockVerifier;

    private GoogleAuthService googleAuthService;

    @BeforeEach
    void setUp() {
        googleAuthService = new GoogleAuthService(userRepository, jwtService, passwordEncoder);
        googleAuthService.setGoogleClientId(CLIENT_ID);
        googleAuthService.setAllowedDomainsConfig("nmit.ac.in,campus.edu");
        googleAuthService.setRequireVerificationReview(false);
        googleAuthService.setEnforceGmailOnly(false);
        googleAuthService.setVerifier(mockVerifier);
    }

    private GoogleIdToken buildToken(String email,
                                     boolean emailVerified,
                                     String audience,
                                     String issuer,
                                     long expSeconds,
                                     String sub,
                                     String name,
                                     String hd) {
        GoogleIdToken.Payload payload = new GoogleIdToken.Payload();
        payload.setEmail(email);
        payload.setEmailVerified(emailVerified);
        payload.setAudience(audience);
        payload.setIssuer(issuer);
        payload.setExpirationTimeSeconds(expSeconds);
        payload.setSubject(sub);
        if (name != null) payload.set("name", name);
        if (hd != null) payload.set("hd", hd);

        JsonWebSignature.Header header = new JsonWebSignature.Header();
        header.setAlgorithm("RS256");
        return new GoogleIdToken(header, payload, new byte[0], new byte[0]);
    }

    private long futureExp() {
        return (System.currentTimeMillis() / 1000L) + 3600L;
    }

    private long pastExp() {
        return (System.currentTimeMillis() / 1000L) - 3600L;
    }

    @Test
    @DisplayName("Successful sign-in creates new student account with ROLE_STUDENT and never admin")
    void testSuccessfulSignIn_NewUser_NeverAdmin() throws GeneralSecurityException, IOException {
        String tokenStr = "valid.google.token";
        GoogleIdToken idToken = buildToken(
                "newstudent@nmit.ac.in",
                true,
                CLIENT_ID,
                GOOGLE_ISSUER,
                futureExp(),
                "google-sub-101",
                "New Student",
                "nmit.ac.in"
        );

        when(mockVerifier.verify(tokenStr)).thenReturn(idToken);
        when(userRepository.findByGoogleSub("google-sub-101")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("newstudent@nmit.ac.in")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("hashed-random-password");
        when(jwtService.generateToken(any(), eq("newstudent@nmit.ac.in"), eq("New Student"))).thenReturn("jwt-student-token");

        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(99L);
            return u;
        });

        AuthResponse response = googleAuthService.authenticateGoogleUser(tokenStr, "register");

        assertNotNull(response);
        assertEquals("jwt-student-token", response.getToken());
        assertEquals("newstudent@nmit.ac.in", response.getUser().getEmail());
        assertEquals(Role.ROLE_STUDENT, response.getUser().getRole());
        assertTrue(response.getUser().isCollegeVerified());

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertEquals(Role.ROLE_STUDENT, savedUser.getRole(), "New user MUST strictly receive ROLE_STUDENT");
        assertNotEquals(Role.ROLE_SUPER_ADMIN, savedUser.getRole(), "Google sign-in must NEVER grant administrator privileges");
        assertEquals("GOOGLE", savedUser.getAuthProvider());
        assertEquals("google-sub-101", savedUser.getGoogleSub());
    }

    @Test
    @DisplayName("Login mode for unregistered user throws ResourceNotFoundException and directs to registration")
    void testLoginMode_UnregisteredUser_ThrowsResourceNotFound() throws GeneralSecurityException, IOException {
        String tokenStr = "valid.google.token";
        GoogleIdToken idToken = buildToken(
                "unregistered@gmail.com",
                true,
                CLIENT_ID,
                GOOGLE_ISSUER,
                futureExp(),
                "google-sub-999",
                "Unregistered Student",
                null
        );

        when(mockVerifier.verify(tokenStr)).thenReturn(idToken);
        when(userRepository.findByGoogleSub("google-sub-999")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("unregistered@gmail.com")).thenReturn(Optional.empty());

        com.campus.marketplace.exception.ResourceNotFoundException ex = assertThrows(
                com.campus.marketplace.exception.ResourceNotFoundException.class,
                () -> googleAuthService.authenticateGoogleUser(tokenStr, "login")
        );
        assertTrue(ex.getMessage().contains("No CampusLoop account found"));
        assertTrue(ex.getMessage().contains("Registration"));
    }

    @Test
    @DisplayName("Unsafe account linking attempt with different Google Sub throws BadRequestException")
    void testUnsafeAccountLinking_ThrowsBadRequest() throws GeneralSecurityException, IOException {
        String tokenStr = "valid.google.token";
        GoogleIdToken idToken = buildToken(
                "attacker@gmail.com",
                true,
                CLIENT_ID,
                GOOGLE_ISSUER,
                futureExp(),
                "google-sub-attacker",
                "Attacker",
                null
        );

        User existingUser = new User();
        existingUser.setId(55L);
        existingUser.setEmail("attacker@gmail.com");
        existingUser.setGoogleSub("google-sub-legitimate-owner");

        when(mockVerifier.verify(tokenStr)).thenReturn(idToken);
        when(userRepository.findByGoogleSub("google-sub-attacker")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("attacker@gmail.com")).thenReturn(Optional.of(existingUser));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                googleAuthService.authenticateGoogleUser(tokenStr, "login")
        );
        assertTrue(ex.getMessage().contains("already linked to a different Google account"));
    }

    @Test
    @DisplayName("Successful sign-in for existing user preserves their account and existing role")
    void testSuccessfulSignIn_ExistingUser_PreservesRole() throws GeneralSecurityException, IOException {
        String tokenStr = "valid.google.token";
        GoogleIdToken idToken = buildToken(
                "existing@campus.edu",
                true,
                CLIENT_ID,
                GOOGLE_ISSUER,
                futureExp(),
                "google-sub-202",
                "Existing Student",
                "campus.edu"
        );

        User existingUser = new User();
        existingUser.setId(42L);
        existingUser.setName("Existing Student");
        existingUser.setEmail("existing@campus.edu");
        existingUser.setRole(Role.ROLE_STUDENT);
        existingUser.setAuthProvider("LOCAL");
        existingUser.setVerificationStatus(VerificationStatus.COLLEGE_VERIFIED);

        when(mockVerifier.verify(tokenStr)).thenReturn(idToken);
        when(userRepository.findByGoogleSub("google-sub-202")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("existing@campus.edu")).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtService.generateToken(eq(42L), eq("existing@campus.edu"), eq("Existing Student"))).thenReturn("jwt-existing-token");

        AuthResponse response = googleAuthService.authenticateGoogleUser(tokenStr);

        assertNotNull(response);
        assertEquals("jwt-existing-token", response.getToken());
        assertEquals(Role.ROLE_STUDENT, response.getUser().getRole());
        assertEquals("GOOGLE", existingUser.getAuthProvider());
        assertEquals("google-sub-202", existingUser.getGoogleSub());
    }

    @Test
    @DisplayName("Existing administrator logging in via Google preserves admin role without escalation or privilege grant")
    void testExistingAdminRolePreserved() throws GeneralSecurityException, IOException {
        String tokenStr = "admin.google.token";
        GoogleIdToken idToken = buildToken(
                "admin@campus.edu",
                true,
                CLIENT_ID,
                GOOGLE_ISSUER,
                futureExp(),
                "google-sub-admin",
                "Admin User",
                null
        );

        User adminUser = new User();
        adminUser.setId(1L);
        adminUser.setName("Admin User");
        adminUser.setEmail("admin@campus.edu");
        adminUser.setRole(Role.ROLE_SUPER_ADMIN);
        adminUser.setAuthProvider("GOOGLE");
        adminUser.setVerificationStatus(VerificationStatus.COLLEGE_VERIFIED);

        when(mockVerifier.verify(tokenStr)).thenReturn(idToken);
        when(userRepository.findByGoogleSub("google-sub-admin")).thenReturn(Optional.of(adminUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtService.generateToken(eq(1L), eq("admin@campus.edu"), eq("Admin User"))).thenReturn("jwt-admin-token");

        AuthResponse response = googleAuthService.authenticateGoogleUser(tokenStr);

        assertNotNull(response);
        assertEquals(Role.ROLE_SUPER_ADMIN, response.getUser().getRole());
    }

    @Test
    @DisplayName("Invalid token when verifier returns null throws UnauthorizedException")
    void testInvalidToken_VerifierReturnsNull() throws GeneralSecurityException, IOException {
        String tokenStr = "invalid.token";
        when(mockVerifier.verify(tokenStr)).thenReturn(null);

        UnauthorizedException ex = assertThrows(UnauthorizedException.class, () ->
                googleAuthService.authenticateGoogleUser(tokenStr)
        );
        assertTrue(ex.getMessage().contains("Invalid or expired Google ID token"));
    }

    @Test
    @DisplayName("Invalid token when verification fails with exception throws UnauthorizedException")
    void testInvalidToken_SignatureVerificationThrows() throws GeneralSecurityException, IOException {
        String tokenStr = "corrupt.signature.token";
        when(mockVerifier.verify(tokenStr)).thenThrow(new GeneralSecurityException("Bad cryptographic signature"));

        UnauthorizedException ex = assertThrows(UnauthorizedException.class, () ->
                googleAuthService.authenticateGoogleUser(tokenStr)
        );
        assertTrue(ex.getMessage().contains("Google authentication failed"));
        assertTrue(ex.getMessage().contains("Bad cryptographic signature"));
    }

    @Test
    @DisplayName("Expired token throws UnauthorizedException")
    void testExpiredToken() throws GeneralSecurityException, IOException {
        String tokenStr = "expired.google.token";
        GoogleIdToken expiredToken = buildToken(
                "student@nmit.ac.in",
                true,
                CLIENT_ID,
                GOOGLE_ISSUER,
                pastExp(), // Expired 1 hour ago
                "sub-expired",
                "Student",
                null
        );

        when(mockVerifier.verify(tokenStr)).thenReturn(expiredToken);

        UnauthorizedException ex = assertThrows(UnauthorizedException.class, () ->
                googleAuthService.authenticateGoogleUser(tokenStr)
        );
        assertTrue(ex.getMessage().contains("expired"));
    }

    @Test
    @DisplayName("Incorrect audience throws UnauthorizedException")
    void testIncorrectAudience() throws GeneralSecurityException, IOException {
        String tokenStr = "wrong.audience.token";
        GoogleIdToken wrongAudienceToken = buildToken(
                "student@nmit.ac.in",
                true,
                "some-other-rogue-client-id.apps.googleusercontent.com", // Mismatch
                GOOGLE_ISSUER,
                futureExp(),
                "sub-aud",
                "Student",
                null
        );

        when(mockVerifier.verify(tokenStr)).thenReturn(wrongAudienceToken);

        UnauthorizedException ex = assertThrows(UnauthorizedException.class, () ->
                googleAuthService.authenticateGoogleUser(tokenStr)
        );
        assertTrue(ex.getMessage().contains("audience mismatch"));
    }

    @Test
    @DisplayName("Unverified email claim throws UnauthorizedException")
    void testUnverifiedEmail_ThrowsUnauthorized() throws GeneralSecurityException, IOException {
        String tokenStr = "unverified.email.token";
        GoogleIdToken unverifiedEmailToken = buildToken(
                "unverified@nmit.ac.in",
                false, // email_verified = false
                CLIENT_ID,
                GOOGLE_ISSUER,
                futureExp(),
                "sub-unverified",
                "Unverified Student",
                null
        );

        when(mockVerifier.verify(tokenStr)).thenReturn(unverifiedEmailToken);

        UnauthorizedException ex = assertThrows(UnauthorizedException.class, () ->
                googleAuthService.authenticateGoogleUser(tokenStr)
        );
        assertTrue(ex.getMessage().contains("email is not verified"));
    }

    @Test
    @DisplayName("Invalid issuer throws UnauthorizedException")
    void testInvalidIssuer_ThrowsUnauthorized() throws GeneralSecurityException, IOException {
        String tokenStr = "bad.issuer.token";
        GoogleIdToken badIssuerToken = buildToken(
                "student@nmit.ac.in",
                true,
                CLIENT_ID,
                "https://malicious-issuer.com", // Invalid issuer
                futureExp(),
                "sub-issuer",
                "Student",
                null
        );

        when(mockVerifier.verify(tokenStr)).thenReturn(badIssuerToken);

        UnauthorizedException ex = assertThrows(UnauthorizedException.class, () ->
                googleAuthService.authenticateGoogleUser(tokenStr)
        );
        assertTrue(ex.getMessage().contains("Invalid Google token issuer"));
    }

    @Test
    @DisplayName("Suspended user is rejected with ForbiddenException")
    void testSuspendedUser_Rejected() throws GeneralSecurityException, IOException {
        String tokenStr = "suspended.user.token";
        GoogleIdToken idToken = buildToken(
                "suspended@nmit.ac.in",
                true,
                CLIENT_ID,
                GOOGLE_ISSUER,
                futureExp(),
                "sub-suspended",
                "Suspended Student",
                null
        );

        User suspendedUser = new User();
        suspendedUser.setId(88L);
        suspendedUser.setEmail("suspended@nmit.ac.in");
        suspendedUser.setSuspended(true);

        when(mockVerifier.verify(tokenStr)).thenReturn(idToken);
        when(userRepository.findByGoogleSub("sub-suspended")).thenReturn(Optional.of(suspendedUser));

        ForbiddenException ex = assertThrows(ForbiddenException.class, () ->
                googleAuthService.authenticateGoogleUser(tokenStr)
        );
        assertTrue(ex.getMessage().contains("suspended"));
    }

    @Test
    @DisplayName("Enforce Gmail-only policy rejects non-Gmail addresses and accepts Gmail")
    void testGmailOnlyPolicy_Enforced() throws GeneralSecurityException, IOException {
        googleAuthService.setEnforceGmailOnly(true);

        String nonGmailTokenStr = "non.gmail.token";
        GoogleIdToken nonGmailToken = buildToken(
                "student@outlook.com",
                true,
                CLIENT_ID,
                GOOGLE_ISSUER,
                futureExp(),
                "sub-nongmail",
                "Non Gmail User",
                null
        );
        when(mockVerifier.verify(nonGmailTokenStr)).thenReturn(nonGmailToken);

        ForbiddenException ex = assertThrows(ForbiddenException.class, () ->
                googleAuthService.authenticateGoogleUser(nonGmailTokenStr)
        );
        assertTrue(ex.getMessage().contains("Only Gmail accounts (@gmail.com) are permitted"));

        // Now test Gmail address with Gmail-only policy
        String gmailTokenStr = "gmail.token";
        GoogleIdToken gmailToken = buildToken(
                "student@gmail.com",
                true,
                CLIENT_ID,
                GOOGLE_ISSUER,
                futureExp(),
                "sub-gmail",
                "Gmail Student",
                null
        );
        when(mockVerifier.verify(gmailTokenStr)).thenReturn(gmailToken);
        when(userRepository.findByGoogleSub("sub-gmail")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("student@gmail.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("hashed-pwd");
        when(jwtService.generateToken(any(), eq("student@gmail.com"), eq("Gmail Student"))).thenReturn("jwt-gmail-token");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(105L);
            return u;
        });

        AuthResponse successResponse = googleAuthService.authenticateGoogleUser(gmailTokenStr, "register");
        assertNotNull(successResponse);
        assertEquals("student@gmail.com", successResponse.getUser().getEmail());
    }

    @Test
    @DisplayName("Missing ID token string throws BadRequestException")
    void testMissingTokenString_ThrowsBadRequest() {
        assertThrows(BadRequestException.class, () ->
                googleAuthService.authenticateGoogleUser("")
        );
        assertThrows(BadRequestException.class, () ->
                googleAuthService.authenticateGoogleUser(null)
        );
    }

    @Test
    @DisplayName("Unconfigured Google Client ID throws BadRequestException")
    void testUnconfiguredClientId_ThrowsBadRequest() {
        googleAuthService.setGoogleClientId("");
        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                googleAuthService.authenticateGoogleUser("some-token")
        );
        assertTrue(ex.getMessage().contains("GOOGLE_CLIENT_ID is not configured"));
    }
}
