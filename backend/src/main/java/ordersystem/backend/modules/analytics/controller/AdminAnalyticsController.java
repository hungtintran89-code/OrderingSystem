package ordersystem.backend.modules.analytics.controller;

import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.payload.ApiResponse;
import ordersystem.backend.modules.analytics.dto.request.AnalyticsFilterRequest;
import ordersystem.backend.modules.analytics.dto.response.*;
import ordersystem.backend.modules.analytics.service.impl.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller exposing REST APIs for Analytics and Manager Dashboard reporting.
 */
@RestController
@RequestMapping("/api/v1/admin/analytics")
@RequiredArgsConstructor
public class AdminAnalyticsController {

    private final AnalyticsService analyticsService;

    /**
     * GET /api/v1/admin/analytics/revenue-summary
     * Retrieve total revenue, completed orders count, average order value (AOV), and payment method ratio.
     */
    @GetMapping("/revenue-summary")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<RevenueSummaryResponse>> getRevenueSummary(
            @ModelAttribute AnalyticsFilterRequest filter) {
        RevenueSummaryResponse summary = analyticsService.getRevenueSummary(filter);
        return ResponseEntity.ok(ApiResponse.success("Revenue summary retrieved successfully", summary));
    }

    /**
     * GET /api/v1/admin/analytics/hourly-revenue
     * Retrieve hourly distribution of revenue and order volume for chart plotting.
     */
    @GetMapping("/hourly-revenue")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<List<HourlyRevenueResponse>>> getHourlyRevenue(
            @ModelAttribute AnalyticsFilterRequest filter) {
        List<HourlyRevenueResponse> hourlyData = analyticsService.getHourlyRevenue(filter);
        return ResponseEntity.ok(ApiResponse.success("Hourly revenue data retrieved successfully", hourlyData));
    }

    /**
     * GET /api/v1/admin/analytics/top-selling
     * Retrieve top selling items ordered by volume and revenue generated.
     */
    @GetMapping("/top-selling")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<List<TopSellingProductResponse>>> getTopSellingProducts(
            @RequestParam(defaultValue = "5") int limit,
            @ModelAttribute AnalyticsFilterRequest filter) {
        List<TopSellingProductResponse> topSelling = analyticsService.getTopSellingProducts(filter, limit);
        return ResponseEntity.ok(ApiResponse.success("Top selling products retrieved successfully", topSelling));
    }

    /**
     * GET /api/v1/admin/analytics/menu-matrix
     * Perform menu engineering matrix classification (STARS, WORKHORSES, PUZZLES, DOGS).
     */
    @GetMapping("/menu-matrix")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<List<MenuMatrixResponse>>> getMenuMatrix(
            @ModelAttribute AnalyticsFilterRequest filter) {
        List<MenuMatrixResponse> matrix = analyticsService.getMenuMatrixAnalysis(filter);
        return ResponseEntity.ok(ApiResponse.success("Menu matrix analysis retrieved successfully", matrix));
    }

    /**
     * GET /api/v1/admin/analytics/cancellations
     * Retrieve order cancellation report and total lost revenue.
     */
    @GetMapping("/cancellations")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<CancellationReportResponse>> getCancellationReport(
            @ModelAttribute AnalyticsFilterRequest filter) {
        CancellationReportResponse report = analyticsService.getCancellationReport(filter);
        return ResponseEntity.ok(ApiResponse.success("Cancellation report retrieved successfully", report));
    }

    /**
     * GET /api/v1/admin/analytics/table-performance
     * Retrieve sales performance breakdown per table.
     */
    @GetMapping("/table-performance")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<List<TablePerformanceResponse>>> getTablePerformance(
            @ModelAttribute AnalyticsFilterRequest filter) {
        List<TablePerformanceResponse> tableData = analyticsService.getTablePerformance(filter);
        return ResponseEntity.ok(ApiResponse.success("Table performance report retrieved successfully", tableData));
    }
}
