package ordersystem.backend.modules.auth.service;

import ordersystem.backend.modules.auth.dto.request.LoginRequest;
import ordersystem.backend.modules.auth.dto.request.RegisterRequest;
import ordersystem.backend.modules.auth.dto.response.AuthResponse;

public interface AuthService {

    AuthResponse login(LoginRequest loginRequest) ;

}
