package ordersystem.backend.modules.auth.controller;


import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.payload.ApiResponse;
import ordersystem.backend.modules.auth.dto.request.LoginRequest;
import ordersystem.backend.modules.auth.dto.response.AuthResponse;
import ordersystem.backend.modules.auth.dto.response.UserProfileResponse;
import ordersystem.backend.modules.auth.service.impl.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService ;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest loginRequest ){
        AuthResponse authResponse = authService.login( loginRequest ) ;
        return ResponseEntity.ok( authResponse ) ;
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile (Principal principal ){
        UUID userId = UUID.fromString(principal.getName());
        UserProfileResponse response = authService.getCurrentUserProfile(userId);
        return ResponseEntity.ok(ApiResponse.success("Success", response));
    }
}
