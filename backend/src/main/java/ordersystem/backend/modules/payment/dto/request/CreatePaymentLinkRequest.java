package ordersystem.backend.modules.payment.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter
@Builder
@NoArgsConstructor @AllArgsConstructor
public class CreatePaymentLinkRequest {
    private Long tableSessionId;
    private Long tableId;
    private String tableNumber;
    private Long totalAmount;
    private Long amount;
}
