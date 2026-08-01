package ordersystem.backend.modules.kds.dto.response;


import lombok.*;
import ordersystem.backend.modules.kds.dto.TableQuantityDetail;

import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class KitchenItemAggregatedResponse {
    private Long productId;
    private String productName;
    private Integer totalQuantity;
    private Integer pendingQuantity;
    private Integer cookingQuantity;
    private List<TableQuantityDetail> tableDetails;
}