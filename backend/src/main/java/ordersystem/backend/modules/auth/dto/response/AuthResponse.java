package ordersystem.backend.modules.auth.dto.response;

import lombok.*;
import ordersystem.backend.modules.auth.enums.UserRole;

@Setter @Getter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AuthResponse {

    private String token;
    private String tokenType = "Bearer";
    private Long userId;
    private String username;
    private String fullName;
    private UserRole role;

}

