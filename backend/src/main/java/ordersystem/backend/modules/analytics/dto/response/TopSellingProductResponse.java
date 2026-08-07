package ordersystem.backend.modules.analytics.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Top selling items breakdown including total quantity sold and revenue generated.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopSellingProductResponse {
    private Long productId;
    private String productName;
    private String productImageUrl;
    private String categoryName;
    private Long totalQuantitySold;
    private Long totalRevenueGenerated;
}
