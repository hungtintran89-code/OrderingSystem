package ordersystem.backend.modules.auth.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.payload.ApiResponse;
import ordersystem.backend.modules.auth.dto.request.ChangePasswordRequest;
import ordersystem.backend.modules.auth.dto.request.LoginRequest;
import ordersystem.backend.modules.auth.dto.response.AuthResponse;
import ordersystem.backend.modules.auth.dto.response.UserProfileResponse;
import ordersystem.backend.modules.auth.service.impl.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;


@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest loginRequest) {
        AuthResponse authResponse = authService.login(loginRequest);
        return ResponseEntity.ok(ApiResponse.success("Login successfully", authResponse));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile(Principal principal) {
        Long userId = Long.parseLong(principal.getName());
        UserProfileResponse response = authService.getCurrentUserProfile(userId);
        return ResponseEntity.ok(ApiResponse.success("Success", response));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            Principal principal,
            @Valid @RequestBody ChangePasswordRequest request) {

        Long userId = Long.parseLong(principal.getName());
        authService.changePassword(userId, request);

        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }
}

