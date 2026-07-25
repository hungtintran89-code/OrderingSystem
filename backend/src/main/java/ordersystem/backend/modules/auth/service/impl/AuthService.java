package ordersystem.backend.modules.auth.service.impl;

import ordersystem.backend.modules.auth.dto.request.LoginRequest;
import ordersystem.backend.modules.auth.dto.response.AuthResponse;
import ordersystem.backend.modules.auth.dto.response.UserProfileResponse;

import java.util.UUID;

public interface AuthService {

    AuthResponse login(LoginRequest loginRequest) ;
    UserProfileResponse getCurrentUserProfile(UUID userId);

}
