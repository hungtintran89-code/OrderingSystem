package ordersystem.backend.modules.kds.dto.response;

import lombok.*;
import ordersystem.backend.modules.kds.enums.KitchenItemStatus;
import ordersystem.backend.modules.kds.enums.KitchenStation;

import java.time.ZonedDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class KitchenTicketResponse {
    private Long kitchenTicketId;
    private Long orderId;
    private Long orderItemId;
    private String tableNumber;
    private String areaName;
    private Long productId;
    private String productName;
    private Long quantity;
    private String note;
    private KitchenItemStatus status;
    private Long assignedCookId;
    private String assignedCookName;
    private String slaColor; // GREEN, YELLOW, RED, GREY
}