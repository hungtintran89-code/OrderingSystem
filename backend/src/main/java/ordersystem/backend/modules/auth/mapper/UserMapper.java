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
                .username( registerRequest.getUsername())
                .password_hash( registerRequest.getPassword())
                .fullname( registerRequest.getFullName())
                .role( registerRequest.getRole() )
                .phone( registerRequest.getPhone() )
                .build();
    }

    public AuthResponse toAuthResponse ( User user , String token ){
        if ( user == null ) return null ;

        return AuthResponse.builder()
                .token( token )
                .tokenType( "Bearer")
                .fullName( user.getFullname())
                .userId( user.getUser_id())
                .username( user.getUsername() )
                .role( user.getRole())
                .build() ;
    }

}
