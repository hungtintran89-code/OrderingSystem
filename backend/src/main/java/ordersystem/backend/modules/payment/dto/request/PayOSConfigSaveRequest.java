package ordersystem.backend.modules.payment.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;


@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayOSConfigSaveRequest {
    @NotNull(message = "Client Id cannot be left blank")
    private String clientId;

    @NotNull(message = "Api key cannot be left blank")
    private String apiKey;

    @NotNull(message = "Checksum key cannot be left blank")
    private String checksumKey;
}
