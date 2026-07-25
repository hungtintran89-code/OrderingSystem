package ordersystem.backend.modules.auth.dto.response;

import lombok.*;
import ordersystem.backend.modules.auth.enums.RoleEnum;

import java.util.UUID;

@Getter @Setter
@AllArgsConstructor @NoArgsConstructor
@Builder
public class UserProfileResponse {
    private UUID userId;
    private String fullName;
    private String username;
    private RoleEnum role;
}