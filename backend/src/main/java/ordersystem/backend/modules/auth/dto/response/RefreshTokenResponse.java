package ordersystem.backend.modules.auth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO Phản hồi chứa Access Token và Refresh Token mới sau khi Token Rotation thành công.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefreshTokenResponse {

    /**
     * Access Token JWT mới cấp cho Client.
     */
    private String accessToken;

    /**
     * Refresh Token mới cấp lại (Token Rotation).
     */
    private String refreshToken;

    /**
     * Loại Token (Mặc định: "Bearer").
     */
    private String tokenType;
}
