package ordersystem.backend.modules.auth.service.impl;

import ordersystem.backend.modules.auth.dto.request.ChangePasswordRequest;
import ordersystem.backend.modules.auth.dto.request.LoginRequest;
import ordersystem.backend.modules.auth.dto.response.AuthResponse;
import ordersystem.backend.modules.auth.dto.response.UserProfileResponse;

public interface AuthService {

    AuthResponse login(LoginRequest loginRequest);
    UserProfileResponse getCurrentUserProfile(Long userId);
    void changePassword(Long userId, ChangePasswordRequest request);
}

