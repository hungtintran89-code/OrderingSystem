package ordersystem.backend.modules.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ordersystem.backend.modules.auth.enums.UserRole;

import java.math.BigDecimal;

@Setter @Getter
@Builder
@AllArgsConstructor @NoArgsConstructor
public class UpdateStaffRequest {
    @NotBlank(message = "Full name cannot be blank")
    private String fullName;

    @NotNull(message = "Role cannot be null")
    private UserRole role;

    private BigDecimal salary;

    private String phone;

    private String password;
}
