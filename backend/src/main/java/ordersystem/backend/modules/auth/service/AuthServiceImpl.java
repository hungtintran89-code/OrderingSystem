package ordersystem.backend.modules.auth.service;

import lombok.RequiredArgsConstructor;
import ordersystem.backend.modules.auth.dto.request.LoginRequest;
import ordersystem.backend.modules.auth.dto.request.RegisterRequest;
import ordersystem.backend.modules.auth.dto.response.AuthResponse;
import ordersystem.backend.modules.auth.entity.User;
import ordersystem.backend.modules.auth.exception.BadCredentialsException;
import ordersystem.backend.modules.auth.mapper.UserMapper;
import ordersystem.backend.modules.auth.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService{

    private final UserRepository userRepository ;
    private final PasswordEncoder passwordEncoder ;
    private final UserMapper userMapper ;

    @Override
    public AuthResponse login(LoginRequest loginRequest ){
        User user = userRepository.findByUsername(loginRequest.getUsername())
                .orElseThrow(()-> new BadCredentialsException("Incorrect username or password."));

        if ( !passwordEncoder.matches(  loginRequest.getPassword() ,  user.getPassword_hash() )){
            throw new BadCredentialsException("Incorrect username or password.") ;
        }

        String token = "JWT_TOKEN_FOR@@" + loginRequest.getUsername() ;
        return userMapper.toAuthResponse( user , token  ) ;
    }

}
