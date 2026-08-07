package ordersystem.backend.modules.analytics.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Breakdown of sales and customer sessions by table.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TablePerformanceResponse {
    private Long tableId;
    private String tableName;
    private Long sessionCount;
    private Long totalRevenue;
    private Double averageRevenuePerSession;
}
