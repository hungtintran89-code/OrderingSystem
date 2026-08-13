package ordersystem.backend.modules.payment.dto.response;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentStatusResponse {
    private String status;
    private Long payosOrderCode;
    private Long tableSessionId;
    private Long tableId;
    private String tableName;
}
