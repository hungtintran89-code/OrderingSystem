package ordersystem.backend.modules.table.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TableCheckoutRequest {
    private String paymentMethod; // "CASH" | "VIETQR"
    private Double amountReceived;
    private String note;
}
