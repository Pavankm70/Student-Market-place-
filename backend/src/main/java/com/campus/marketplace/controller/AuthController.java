package com.campus.marketplace.controller;

import com.campus.marketplace.dto.AuthResponse;
import com.campus.marketplace.dto.GoogleLoginRequest;
import com.campus.marketplace.dto.LoginRequest;
import com.campus.marketplace.dto.RegisterRequest;
import com.campus.marketplace.dto.UserDto;
import com.campus.marketplace.service.AuthService;
import com.campus.marketplace.service.GoogleAuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Endpoints for student registration, Google Sign-In, and login")
public class AuthController {

    private final AuthService authService;
    private final GoogleAuthService googleAuthService;

    @Value("${app.google.client-id:}")
    private String googleClientId;

    public AuthController(AuthService authService, GoogleAuthService googleAuthService) {
        this.authService = authService;
        this.googleAuthService = googleAuthService;
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new college student account")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    @Operation(summary = "Login with student email and password")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/google")
    @Operation(summary = "Sign in or register with verified Google ID token")
    public ResponseEntity<AuthResponse> googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
        String mode = request.getMode() != null && !request.getMode().isBlank() ? request.getMode() : "login";
        AuthResponse response = googleAuthService.authenticateGoogleUser(request.getIdToken(), mode);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/google/login")
    @Operation(summary = "Sign in with verified Google ID token (existing accounts only)")
    public ResponseEntity<AuthResponse> googleSignIn(@Valid @RequestBody GoogleLoginRequest request) {
        AuthResponse response = googleAuthService.authenticateGoogleUser(request.getIdToken(), "login");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/google/register")
    @Operation(summary = "Register with verified Google ID token (@gmail.com verified)")
    public ResponseEntity<AuthResponse> googleRegister(@Valid @RequestBody GoogleLoginRequest request) {
        AuthResponse response = googleAuthService.authenticateGoogleUser(request.getIdToken(), "register");
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/config")
    @Operation(summary = "Get public auth configuration (Google Client ID availability, allowed college domains)")
    public ResponseEntity<Map<String, Object>> getAuthConfig() {
        boolean googleConfigured = googleClientId != null && !googleClientId.trim().isEmpty();
        return ResponseEntity.ok(Map.of(
                "googleAuthEnabled", googleConfigured,
                "googleClientId", googleConfigured ? googleClientId.trim() : "",
                "allowedDomains", authService.getAllowedDomains()
        ));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated student profile")
    public ResponseEntity<UserDto> getCurrentUser() {
        return ResponseEntity.ok(authService.mapToUserDto(authService.getAuthenticatedUser()));
    }
}
