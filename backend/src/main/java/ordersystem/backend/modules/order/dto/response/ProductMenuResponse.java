package ordersystem.backend.modules.order.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductMenuResponse {

    private Long productId;
    private String productName;
    private Long price;
    private String imageUrl;
    private Boolean isOrdered = false;
    private String description;
    private Boolean isAvailable;
}
