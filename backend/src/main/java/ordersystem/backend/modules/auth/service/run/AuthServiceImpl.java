package ordersystem.backend.modules.auth.service.run;

import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.exception.ResourceNotFoundException;
import ordersystem.backend.common.security.JwtTokenProvider;
import ordersystem.backend.modules.auth.dto.request.ChangePasswordRequest;
import ordersystem.backend.modules.auth.dto.request.LoginRequest;
import ordersystem.backend.modules.auth.dto.response.AuthResponse;
import ordersystem.backend.modules.auth.dto.response.RefreshTokenResponse;
import ordersystem.backend.modules.auth.dto.response.UserProfileResponse;
import ordersystem.backend.modules.auth.entity.RefreshTokenEntity;
import ordersystem.backend.modules.auth.entity.User;
import ordersystem.backend.modules.auth.exception.BadCredentialsException;
import ordersystem.backend.modules.auth.repository.RefreshTokenRepository;
import ordersystem.backend.modules.auth.repository.UserRepository;
import ordersystem.backend.modules.auth.service.impl.AuthService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Service xử lý các logic nghiệp vụ xác thực người dùng, cấp phát JWT và Token Rotation.
 */
@Service
@RequiredArgsConstructor
@Transactional( readOnly = true )
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final RefreshTokenRepository refreshTokenRepository;

    @Override
    @Transactional
    public AuthResponse login(LoginRequest loginRequest) {
        String cleanUsername = loginRequest.getUsername() != null ? loginRequest.getUsername().trim() : "";
        User user = userRepository.findByUsernameIgnoreCase(cleanUsername)
                .orElseThrow(() -> new BadCredentialsException("Incorrect username or password."));

        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Incorrect username or password.");
        }

        if (!user.isActive()) {
            throw new BadCredentialsException("User account is disabled.");
        }

        String accessToken = tokenProvider.generateToken(user.getUserId(), user.getUsername(), user.getRole());
        
        // Tạo Refresh Token mới cho người dùng
        String refreshTokenValue = UUID.randomUUID().toString();
        RefreshTokenEntity refreshTokenEntity = RefreshTokenEntity.builder()
                .userId(user.getUserId())
                .token(refreshTokenValue)
                .expiryDate(LocalDateTime.now().plusDays(7)) // Refresh Token hết hạn sau 7 ngày
                .build();
        refreshTokenRepository.save(refreshTokenEntity);

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
    }

    /**
     * Cấp lại Access Token mới và thực hiện Refresh Token Rotation bảo mật.
     * 
     * @param refreshToken Chuỗi Refresh Token do Client gửi lên
     * @return RefreshTokenResponse chứa Access Token và Refresh Token mới
     */
    @Override
    @Transactional
    public RefreshTokenResponse refreshToken(String refreshToken) {
        // 1. Kiểm tra Refresh Token có tồn tại và chưa bị thu hồi không
        RefreshTokenEntity tokenEntity = refreshTokenRepository.findByTokenAndRevokedFalse(refreshToken)
                .orElseThrow(() -> new BadCredentialsException("Refresh Token không hợp lệ hoặc đã bị thu hồi"));

        // 2. Kiểm tra Refresh Token đã hết hạn chưa
        if (tokenEntity.getExpiryDate().isBefore(LocalDateTime.now())) {
            tokenEntity.setRevoked(true);
            refreshTokenRepository.save(tokenEntity);
            throw new BadCredentialsException("Refresh Token đã hết hạn, vui lòng đăng nhập lại");
        }

        // 3. Tìm thông tin User sở hữu token
        User user = userRepository.findById(tokenEntity.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + tokenEntity.getUserId()));

        if (!user.isActive()) {
            throw new BadCredentialsException("Tài khoản người dùng đã bị khóa");
        }

        // 4. Thu hồi Refresh Token cũ (Token Rotation Security)
        tokenEntity.setRevoked(true);
        refreshTokenRepository.save(tokenEntity);

        // 5. Sinh Access Token mới & Refresh Token mới
        String newAccessToken = tokenProvider.generateToken(user.getUserId(), user.getUsername(), user.getRole());
        String newRefreshTokenValue = UUID.randomUUID().toString();

        RefreshTokenEntity newRefreshTokenEntity = RefreshTokenEntity.builder()
                .userId(user.getUserId())
                .token(newRefreshTokenValue)
                .expiryDate(LocalDateTime.now().plusDays(7))
                .build();
        refreshTokenRepository.save(newRefreshTokenEntity);

        return RefreshTokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshTokenValue)
                .tokenType("Bearer")
                .build();
    }
}
