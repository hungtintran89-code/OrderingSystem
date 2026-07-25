package ordersystem.backend.modules.auth.dto.response;

import lombok.*;
import ordersystem.backend.modules.auth.enums.RoleEnum;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Getter @Setter
@Builder
@AllArgsConstructor @NoArgsConstructor
public class StaffResponse {
    private UUID user_id;
    private String fullName;
    private String username;
    private RoleEnum role;
    private boolean is_active;
    private Date created_at;
}