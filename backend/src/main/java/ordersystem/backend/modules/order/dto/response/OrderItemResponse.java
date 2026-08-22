package ordersystem.backend.modules.order.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItemResponse {

    private Long orderItemId;
    private Long productId;
    private String productName;
    private Long quantity;
    private Long priceProduct;
    private Long priceTotal;
    private String note;
    private Long threadId;
    private String status;
    private String productImageUrl;
}
