package ordersystem.backend.modules.payment.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor @AllArgsConstructor
public class CashConfirmRequest {
    @NotNull(message = "Table Session Id cannot be left blank")
    private Long tableSessionId;

    @NotNull(message =  "Receive Amount cannot be left blank")
    private Long receivedAmount;
}
