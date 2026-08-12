package ordersystem.backend.modules.analytics.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ordersystem.backend.modules.analytics.enums.AnalyticsPeriodType;

import java.util.Date;

/**
 * Summary DTO containing overall revenue, completed orders count, AOV, and payment breakdown.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevenueSummaryResponse {
    private Long totalRevenue;
    private Long completedOrdersCount;
    private Double averageOrderValue; // AOV = totalRevenue / completedOrdersCount
    
    // Đồng bộ tên trường cho Frontend Dashboard KPI
    private Double revenueGrowthPercent;
    private Long totalOrders;
    private Long activeServingOrders;
    private Double occupancyRate;
    private Double avgOrderValue;

    private PaymentMethodRatioResponse paymentMethodRatio;
    private AnalyticsPeriodType period;
    private Date startDate;
    private Date endDate;
}
