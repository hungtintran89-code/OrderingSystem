package ordersystem.backend.modules.auth.dto.request;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import ordersystem.backend.modules.auth.enums.UserRole;

@Getter @Setter
public class RegisterRequest {

    @NotBlank( message = "Username cannot be left blank.")
    @Size(min = 4, max = 20 , message = "The username must be between 4 and 20 characters long.")
    private String username ;

    @NotBlank( message = "Password cannot be left blank.")
    @Size(min = 6 , message = "The password must be between 4 and 20 characters long.")
    private String password ;

    @NotBlank( message = "Email cannot be left blank.")
    @Size(min = 6 , message = "The email must be between 4 and 20 characters long.")
    private String email ;

    @NotBlank(message = "Full name must not be left blank.")
    private String fullName;

    private String phone;

    @NotBlank(message = "The role cannot be left blank.")
    private UserRole role;

}
