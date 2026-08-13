package ordersystem.backend.modules.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/**
 * DTO Yêu cầu cấp lại Access Token từ Refresh Token.
 */
@Getter
@Setter
public class RefreshTokenRequest {

    /**
     * Chuỗi Refresh Token hợp lệ còn thời hạn.
     */
    @NotBlank(message = "Refresh Token không được để trống")
    private String refreshToken;
}
