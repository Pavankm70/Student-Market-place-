package com.campus.marketplace.controller;

import com.campus.marketplace.dto.AuthResponse;
import com.campus.marketplace.dto.GoogleLoginRequest;
import com.campus.marketplace.dto.UserDto;
import com.campus.marketplace.entity.Role;
import com.campus.marketplace.entity.VerificationStatus;
import com.campus.marketplace.exception.UnauthorizedException;
import com.campus.marketplace.service.AuthService;
import com.campus.marketplace.service.GoogleAuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
public class AuthControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AuthService authService;

    @Mock
    private GoogleAuthService googleAuthService;

    @InjectMocks
    private AuthController authController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String CLIENT_ID = "750855684518-dekld62m5n91sllj00o21mtu3ssbqjn7.apps.googleusercontent.com";

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authController, "googleClientId", CLIENT_ID);
        mockMvc = MockMvcBuilders.standaloneSetup(authController).build();
    }

    @Test
    @DisplayName("POST /api/auth/google returns AuthResponse when token verification succeeds")
    void testGoogleLoginSuccess() throws Exception {
        UserDto userDto = new UserDto();
        userDto.setId(10L);
        userDto.setName("Google Student");
        userDto.setEmail("student@nmit.ac.in");
        userDto.setRole(Role.ROLE_STUDENT);
        userDto.setVerificationStatus(VerificationStatus.COLLEGE_VERIFIED);
        userDto.setAuthProvider("GOOGLE");

        AuthResponse authResponse = new AuthResponse("jwt-valid-token-abc", userDto);

        when(googleAuthService.authenticateGoogleUser(anyString(), anyString())).thenReturn(authResponse);

        GoogleLoginRequest request = new GoogleLoginRequest("valid.google.id.token");

        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-valid-token-abc"))
                .andExpect(jsonPath("$.user.email").value("student@nmit.ac.in"))
                .andExpect(jsonPath("$.user.role").value("ROLE_STUDENT"))
                .andExpect(jsonPath("$.user.authProvider").value("GOOGLE"));
    }

    @Test
    @DisplayName("POST /api/auth/google/register successfully registers and returns 201 Created")
    void testGoogleRegisterEndpoint() throws Exception {
        UserDto userDto = new UserDto();
        userDto.setId(11L);
        userDto.setName("New Google Student");
        userDto.setEmail("newstudent@gmail.com");
        userDto.setRole(Role.ROLE_STUDENT);
        userDto.setVerificationStatus(VerificationStatus.COLLEGE_VERIFIED);
        userDto.setAuthProvider("GOOGLE");

        AuthResponse authResponse = new AuthResponse("jwt-valid-token-reg", userDto);

        when(googleAuthService.authenticateGoogleUser(eq("valid.token"), eq("register"))).thenReturn(authResponse);

        GoogleLoginRequest request = new GoogleLoginRequest("valid.token", "register");

        mockMvc.perform(post("/api/auth/google/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value("jwt-valid-token-reg"))
                .andExpect(jsonPath("$.user.email").value("newstudent@gmail.com"));
    }

    @Test
    @DisplayName("POST /api/auth/google rejects request with missing or blank idToken")
    void testGoogleLoginMissingToken() throws Exception {
        GoogleLoginRequest request = new GoogleLoginRequest("");

        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/auth/config returns configured Google Client ID and domain list")
    void testGetAuthConfig() throws Exception {
        when(authService.getAllowedDomains()).thenReturn(List.of("nmit.ac.in", "campus.edu"));

        mockMvc.perform(get("/api/auth/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.googleAuthEnabled").value(true))
                .andExpect(jsonPath("$.googleClientId").value(CLIENT_ID))
                .andExpect(jsonPath("$.allowedDomains[0]").value("nmit.ac.in"));
    }
}
