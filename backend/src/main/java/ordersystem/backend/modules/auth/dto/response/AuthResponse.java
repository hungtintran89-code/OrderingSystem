package ordersystem.backend.modules.auth.dto.response;

import lombok.*;
import ordersystem.backend.modules.auth.enums.RoleEnum;

import java.util.UUID;

@Setter @Getter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AuthResponse {

    private String token;
    private String tokenType = "Bearer";
    private UUID userId;
    private String username;
    private String fullName;
    private RoleEnum role;
}
