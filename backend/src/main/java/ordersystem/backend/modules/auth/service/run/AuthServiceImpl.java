package ordersystem.backend.modules.auth.service.run;

import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.exception.ResourceNotFoundException;
import ordersystem.backend.common.security.JwtTokenProvider;
import ordersystem.backend.modules.auth.dto.request.ChangePasswordRequest;
import ordersystem.backend.modules.auth.dto.request.LoginRequest;
import ordersystem.backend.modules.auth.dto.response.AuthResponse;
import ordersystem.backend.modules.auth.dto.response.UserProfileResponse;
import ordersystem.backend.modules.auth.entity.User;
import ordersystem.backend.modules.auth.exception.BadCredentialsException;
import ordersystem.backend.modules.auth.mapper.UserMapper;
import ordersystem.backend.modules.auth.repository.UserRepository;
import ordersystem.backend.modules.auth.service.impl.AuthService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional( readOnly = true )
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    @Override
    public AuthResponse login(LoginRequest loginRequest) {
        User user = userRepository.findByUsername(loginRequest.getUsername())
                .orElseThrow(() -> new BadCredentialsException("Incorrect username or password."));

        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Incorrect username or password.");
        }

        if (!user.isActive()) {
            throw new BadCredentialsException("User account is disabled.");
        }

        String accessToken = tokenProvider.generateToken(user.getUserId(), user.getUsername(), user.getRole());
        return AuthResponse.builder()
                .token(accessToken)
                .tokenType("Bearer")
                .userId(user.getUserId())
                .username(user.getUsername())
                .role(user.getRole())
                .build();
    }

    @Override
    public UserProfileResponse getCurrentUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId)) ;
        return UserProfileResponse.builder()
                .userId(user.getUserId())
                .fullName(user.getFullName())
                .username(user.getUsername())
                .role(user.getRole())
                .build();
    }


    @Override
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        // 1. Tìm user đang đăng nhập trong DB
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // 2. Kiểm tra mật khẩu hiện tại có đúng không
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Current password is incorrect");
        }

        // 3. Kiểm tra mật khẩu mới và xác nhận mật khẩu có khớp nhau không
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadCredentialsException("Confirm password does not match new password");
        }

        // 4. Mã hóa mật khẩu mới và lưu vào DB
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}

