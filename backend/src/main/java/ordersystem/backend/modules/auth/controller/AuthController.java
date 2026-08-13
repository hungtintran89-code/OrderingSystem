package ordersystem.backend.modules.auth.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.payload.ApiResponse;
import ordersystem.backend.modules.auth.dto.request.ChangePasswordRequest;
import ordersystem.backend.modules.auth.dto.request.LoginRequest;
import ordersystem.backend.modules.auth.dto.request.RefreshTokenRequest;
import ordersystem.backend.modules.auth.dto.response.AuthResponse;
import ordersystem.backend.modules.auth.dto.response.RefreshTokenResponse;
import ordersystem.backend.modules.auth.dto.response.UserProfileResponse;
import ordersystem.backend.modules.auth.service.impl.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;

/**
 * Controller chịu trách nhiệm các API xác thực người dùng, Đăng nhập, Refresh Token và Đổi mật khẩu.
 */
@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "User API", description = "Quản lý người dùng và xác thực hệ thống")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập hệ thống và lấy chuỗi JWT Access Token")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest loginRequest) {
        AuthResponse authResponse = authService.login(loginRequest);
        return ResponseEntity.ok(ApiResponse.success("Login successfully", authResponse));
    }

    /**
     * API Cấp lại Access Token mới bằng Refresh Token khi hết hạn (Token Rotation Security).
     * 
     * @param request RefreshTokenRequest chứa chuỗi Refresh Token
     * @return ApiResponse bọc RefreshTokenResponse
     */
    @PostMapping("/refresh")
    @Operation(summary = "Cấp lại Access Token mới từ Refresh Token khi phiên làm việc hết hạn")
    public ResponseEntity<ApiResponse<RefreshTokenResponse>> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request) {
        RefreshTokenResponse response = authService.refreshToken(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.success("Access Token refreshed successfully", response));
    }

    @GetMapping("/me")
    @Operation(summary = "Xem thông tin cá nhân/profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile(Principal principal) {
        Long userId = Long.parseLong(principal.getName());
        UserProfileResponse response = authService.getCurrentUserProfile(userId);
        return ResponseEntity.ok(ApiResponse.success("Success", response));
    }

    @PostMapping("/change-password")
    @Operation(summary = "Đổi mật khẩu tài khoản người dùng")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            Principal principal,
            @Valid @RequestBody ChangePasswordRequest request) {

        Long userId = Long.parseLong(principal.getName());
        authService.changePassword(userId, request);

        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }
}
