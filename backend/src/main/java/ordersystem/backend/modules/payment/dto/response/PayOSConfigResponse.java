package ordersystem.backend.modules.payment.dto.response;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayOSConfigResponse {
    private String clientId;
    private String apiKey;
    private String checksumKey;
}
