package ordersystem.backend.modules.auth.dto.response;

import lombok.*;
import ordersystem.backend.modules.auth.enums.UserRole;
import java.util.Date;

@Getter @Setter
@Builder
@AllArgsConstructor @NoArgsConstructor
public class StaffResponse {
    private Long userId;
    private String fullName;
    private String username;
    private UserRole role;
    private boolean active;
    private Date createdAt;
}
