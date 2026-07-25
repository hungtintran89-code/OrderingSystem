package ordersystem.backend.modules.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;


@Getter @Setter
public class LoginRequest {

    @NotBlank(message = "Username cannot be left blank.")
    private String username;

    @NotBlank(message = "Password cannot be left blank.")
    private String password;

}
