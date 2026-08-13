package ordersystem.backend.modules.analytics.service.impl;

import ordersystem.backend.modules.analytics.dto.request.AnalyticsFilterRequest;
import ordersystem.backend.modules.analytics.dto.response.*;

import java.util.List;

/**
 * Service interface for Analytics & Business Intelligence operations.
 */
public interface AnalyticsService {

    /**
     * Get overall revenue, completed order count, AOV and payment breakdown.
     */
    RevenueSummaryResponse getRevenueSummary(AnalyticsFilterRequest filter);

    /**
     * Get hourly distribution of revenue and order volume.
     */
    List<HourlyRevenueResponse> getHourlyRevenue(AnalyticsFilterRequest filter);

    /**
     * Get top-selling products by quantity and revenue generated.
     */
    List<TopSellingProductResponse> getTopSellingProducts(AnalyticsFilterRequest filter, int limit);

    /**
     * Perform menu engineering matrix classification (STARS, WORKHORSES, PUZZLES, DOGS).
     */
    List<MenuMatrixResponse> getMenuMatrixAnalysis(AnalyticsFilterRequest filter);

    /**
     * Get report on order cancellations and revenue loss.
     */
    CancellationReportResponse getCancellationReport(AnalyticsFilterRequest filter);

    /**
     * Get performance breakdown by table.
     */
    List<TablePerformanceResponse> getTablePerformance(AnalyticsFilterRequest filter);
}
