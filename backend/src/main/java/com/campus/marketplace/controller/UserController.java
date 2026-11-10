package com.campus.marketplace.controller;

import com.campus.marketplace.dto.UserDto;
import com.campus.marketplace.entity.User;
import com.campus.marketplace.repository.UserRepository;
import com.campus.marketplace.service.AuthService;
import com.campus.marketplace.exception.BadRequestException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@Tag(name = "Users", description = "User profile management")
public class UserController {

    private final AuthService authService;
    private final UserRepository userRepository;

    public UserController(AuthService authService, UserRepository userRepository) {
        this.authService = authService;
        this.userRepository = userRepository;
    }

    @GetMapping("/profile")
    @Operation(summary = "Get authenticated user profile details")
    public ResponseEntity<UserDto> getProfile() {
        User currentUser = authService.getAuthenticatedUser();
        return ResponseEntity.ok(authService.mapToUserDto(currentUser));
    }

    @PutMapping("/profile")
    @Operation(summary = "Update authenticated user profile (phone, campus name)")
    public ResponseEntity<UserDto> updateProfile(@RequestBody Map<String, String> payload) {
        User currentUser = authService.getAuthenticatedUser();

        if (payload.containsKey("phone") && payload.get("phone") != null && !payload.get("phone").isBlank()) {
            String cleanPhone = payload.get("phone").replaceAll("[^0-9]", "");
            if (cleanPhone.length() != 10) {
                throw new BadRequestException("Phone number must be exactly 10 digits (e.g. 9876543210)");
            }
            currentUser.setPhone(cleanPhone);
        }
        if (payload.containsKey("campusName") && payload.get("campusName") != null) {
            currentUser.setCampusName(payload.get("campusName").trim());
        }

        User updated = userRepository.save(currentUser);
        return ResponseEntity.ok(authService.mapToUserDto(updated));
    }
}
