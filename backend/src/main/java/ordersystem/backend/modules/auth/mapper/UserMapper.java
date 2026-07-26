package ordersystem.backend.modules.auth.mapper;


import ordersystem.backend.modules.auth.dto.request.RegisterRequest;
import ordersystem.backend.modules.auth.dto.response.AuthResponse;
import ordersystem.backend.modules.auth.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {


    public User toEntity (RegisterRequest registerRequest ){

        if( registerRequest == null  ) return null ;

        return User.builder()
                .username(registerRequest.getUsername())
                .passwordHash(registerRequest.getPassword())
                .fullName(registerRequest.getFullName())
                .role(registerRequest.getRole())
                .phone(registerRequest.getPhone())
                .build();
    }

    public AuthResponse toAuthResponse(User user, String token) {
        if (user == null) return null;

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .fullName(user.getFullName())
                .userId(user.getUserId())
                .username(user.getUsername())
                .role(user.getRole())
                .build();
    }

}
