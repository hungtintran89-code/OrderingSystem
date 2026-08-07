package ordersystem.backend.modules.payment.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter
@Builder
@NoArgsConstructor @AllArgsConstructor
public class CreatePaymentLinkRequest {
    //Tạo vietqr cho toàn bộ phiên ăn
    @NotNull(message = "Table Session Id cannot be left blank")
    private Long tableSessionId;
}
