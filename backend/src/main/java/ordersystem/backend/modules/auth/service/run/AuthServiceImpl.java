package ordersystem.backend.modules.auth.service.run;

import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.security.JwtTokenProvider;
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

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository ;
    private final PasswordEncoder passwordEncoder ;
    private final UserMapper userMapper ;
    private final JwtTokenProvider tokenProvider ;

    @Override
    public AuthResponse login(LoginRequest loginRequest ){
        User user = userRepository.findByUsername(loginRequest.getUsername())
                .orElseThrow(()-> new BadCredentialsException("Incorrect username or password."));

        if ( !passwordEncoder.matches(  loginRequest.getPassword() ,  user.getPassword_hash() )){
            throw new BadCredentialsException("Incorrect username or password.") ;
        }

        if( !user.is_active()  ){
            throw new BadCredentialsException("User account is disabled.") ;
        }

        String accessToken = tokenProvider.generateToken(user.getUser_id(), user.getUsername(), user.getRole().name());
        return AuthResponse.builder()
                .token(accessToken)
                .tokenType("Bearer")
                .userId(user.getUser_id())
                .username(user.getUsername())
                .role(user.getRole())
                .build();
    }

    @Override
    public UserProfileResponse getCurrentUserProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return UserProfileResponse.builder()
                .userId(user.getUser_id())
                .fullName(user.getFullname())
                .username(user.getUsername())
                .role(user.getRole())
                .build();
    }



}
