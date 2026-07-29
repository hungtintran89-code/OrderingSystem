package ordersystem.backend.modules.order.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MasterTableOrderResponse {

    private Long tableId;
    private String tableName;
    private Long tableSessionId;
    private String sessionStatus;
    private BigDecimal totalPrice;
    private LocalDateTime openedAt;

    @Builder.Default
    private List<OrderItemResponse> allTableItems = new ArrayList<>();
}