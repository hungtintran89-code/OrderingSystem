package ordersystem.backend.modules.analytics.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Report on cancelled orders and potential revenue loss.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CancellationReportResponse {
    private Long cancelledOrdersCount;
    private Long totalOrdersCount;
    private Long lostRevenue;
    private Double cancellationRatePercentage;
}
