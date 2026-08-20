package ordersystem.backend.modules.payment.dto.request;

import lombok.*;
import ordersystem.backend.modules.order.dto.request.OrderItemRequest;
import java.util.List;

@Getter @Setter
@Builder
@NoArgsConstructor @AllArgsConstructor
public class CreatePaymentLinkRequest {
    private Long tableSessionId;
    private Long tableId;
    private String tableNumber;
    private Long totalAmount;
    private Long amount;
    private List<OrderItemRequest> items;
}
