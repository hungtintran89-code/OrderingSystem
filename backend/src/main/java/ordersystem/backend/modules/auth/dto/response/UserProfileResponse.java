package ordersystem.backend.modules.auth.dto.response;

import lombok.*;
import ordersystem.backend.modules.auth.enums.RoleEnum;

@Getter @Setter
@AllArgsConstructor @NoArgsConstructor
@Builder
public class UserProfileResponse {
    private Long userId;
    private String fullName;
    private String username;
    private RoleEnum role;
}