package ordersystem.backend.modules.order.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Date;
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
    private Long totalPrice;
    private Date openedAt;

    @Builder.Default
    private List<OrderItemResponse> allTableItems = new ArrayList<>();
}