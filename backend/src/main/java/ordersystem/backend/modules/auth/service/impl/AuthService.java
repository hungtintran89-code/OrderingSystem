package ordersystem.backend.modules.auth.service.impl;

import ordersystem.backend.modules.auth.dto.request.ChangePasswordRequest;
import ordersystem.backend.modules.auth.dto.request.LoginRequest;
import ordersystem.backend.modules.auth.dto.response.AuthResponse;
import ordersystem.backend.modules.auth.dto.response.RefreshTokenResponse;
import ordersystem.backend.modules.auth.dto.response.UserProfileResponse;

/**
 * Interface Service định nghĩa các phương thức xác thực và quản lý tài khoản người dùng.
 */
public interface AuthService {

    AuthResponse login(LoginRequest loginRequest);
    UserProfileResponse getCurrentUserProfile(Long userId);
    void changePassword(Long userId, ChangePasswordRequest request);

    /**
     * Phương thức cấp lại Access Token mới từ Refresh Token (Security Token Rotation).
     * @param refreshToken Chuỗi Refresh Token hợp lệ
     * @return RefreshTokenResponse chứa Access Token & Refresh Token mới
     */
    RefreshTokenResponse refreshToken(String refreshToken);
}
