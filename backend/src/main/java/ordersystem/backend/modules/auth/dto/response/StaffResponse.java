package ordersystem.backend.modules.auth.dto.response;

import lombok.*;
import ordersystem.backend.modules.auth.enums.RoleEnum;
import java.util.Date;

@Getter @Setter
@Builder
@AllArgsConstructor @NoArgsConstructor
public class StaffResponse {
    private Long userId;
    private String fullName;
    private String username;
    private RoleEnum role;
    private boolean active;
    private Date createdAt;
}