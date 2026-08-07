package ordersystem.backend.modules.analytics.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ordersystem.backend.modules.analytics.enums.MenuMatrixCategory;

/**
 * Menu matrix engineering response identifying item performance tier (STARS, WORKHORSES, PUZZLES, DOGS).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenuMatrixResponse {
    private Long productId;
    private String productName;
    private String categoryName;
    private Long totalQuantitySold;
    private Long totalRevenueGenerated;
    private MenuMatrixCategory matrixCategory;
    private String description;
}
