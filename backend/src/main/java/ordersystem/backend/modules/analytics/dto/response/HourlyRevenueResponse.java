package ordersystem.backend.modules.analytics.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Hourly aggregated data for revenue and order count chart representation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HourlyRevenueResponse {
    private String hour; // Formatted hour e.g. "12:00"
    private Integer hourValue; // Numeric hour 0-23
    private Long orderCount;
    private Long orders; // Alias cho Recharts
    private Long revenue;
}
