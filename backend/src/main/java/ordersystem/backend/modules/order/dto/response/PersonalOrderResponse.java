package ordersystem.backend.modules.order.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PersonalOrderResponse {

    private Long tableSessionId;
    private Long threadId;
    private BigDecimal myTotal;

    @Builder.Default
    private List<OrderItemResponse> myItems = new ArrayList<>();

    public void recalculateMyTotal() {
        if (myItems != null && !myItems.isEmpty()) {
            this.myTotal = myItems.stream()
                    .map(item -> item.getPriceTotal() != null ? item.getPriceTotal() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        } else {
            this.myTotal = BigDecimal.ZERO;
        }
    }
}
