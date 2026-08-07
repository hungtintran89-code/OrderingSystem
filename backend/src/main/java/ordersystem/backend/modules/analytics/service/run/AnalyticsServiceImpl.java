package ordersystem.backend.modules.analytics.service.run;

import lombok.RequiredArgsConstructor;
import ordersystem.backend.modules.analytics.dto.request.AnalyticsFilterRequest;
import ordersystem.backend.modules.analytics.dto.response.*;
import ordersystem.backend.modules.analytics.enums.AnalyticsPeriodType;
import ordersystem.backend.modules.analytics.enums.MenuMatrixCategory;
import ordersystem.backend.modules.analytics.repository.AnalyticsRepository;
import ordersystem.backend.modules.analytics.service.impl.AnalyticsService;
import ordersystem.backend.modules.payment.enums.PaymentMethod;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service implementation for Analytics module handling calculations and reports.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsServiceImpl implements AnalyticsService {

    private final AnalyticsRepository analyticsRepository;

    @Override
    public RevenueSummaryResponse getRevenueSummary(AnalyticsFilterRequest filter) {
        Date[] dateRange = resolveDateRange(filter);
        Date startDate = dateRange[0];
        Date endDate = dateRange[1];

        // 1. Query revenue & completed orders count
        Object[] summaryData = analyticsRepository.getCompletedOrdersSummary(startDate, endDate);
        Long completedCount = 0L;
        Long totalRevenue = 0L;

        if (summaryData != null && summaryData.length >= 2) {
            completedCount = summaryData[0] != null ? ((Number) summaryData[0]).longValue() : 0L;
            totalRevenue = summaryData[1] != null ? ((Number) summaryData[1]).longValue() : 0L;
        }

        // 2. Calculate Average Order Value (AOV)
        double aov = (completedCount > 0) ? (double) totalRevenue / completedCount : 0.0;

        // 3. Query Payment Method Ratio
        PaymentMethodRatioResponse paymentRatio = getPaymentMethodRatio(startDate, endDate);

        return RevenueSummaryResponse.builder()
                .totalRevenue(totalRevenue)
                .completedOrdersCount(completedCount)
                .averageOrderValue(Math.round(aov * 100.0) / 100.0)
                .paymentMethodRatio(paymentRatio)
                .period(filter.getPeriod())
                .startDate(startDate)
                .endDate(endDate)
                .build();
    }

    @Override
    public List<HourlyRevenueResponse> getHourlyRevenue(AnalyticsFilterRequest filter) {
        Date[] dateRange = resolveDateRange(filter);
        List<Object[]> rawData = analyticsRepository.getHourlyRevenueData(dateRange[0], dateRange[1]);

        // Map hour integer -> row data
        Map<Integer, Object[]> hourMap = new HashMap<>();
        if (rawData != null) {
            for (Object[] row : rawData) {
                if (row.length >= 3 && row[0] != null) {
                    Integer hour = ((Number) row[0]).intValue();
                    hourMap.put(hour, row);
                }
            }
        }

        // Populate 24 hours (0..23) for smooth frontend charts
        List<HourlyRevenueResponse> result = new ArrayList<>();
        for (int h = 0; h < 24; h++) {
            String hourLabel = String.format("%02d:00", h);
            Long count = 0L;
            Long rev = 0L;

            if (hourMap.containsKey(h)) {
                Object[] row = hourMap.get(h);
                count = row[1] != null ? ((Number) row[1]).longValue() : 0L;
                rev = row[2] != null ? ((Number) row[2]).longValue() : 0L;
            }

            result.add(HourlyRevenueResponse.builder()
                    .hour(hourLabel)
                    .hourValue(h)
                    .orderCount(count)
                    .revenue(rev)
                    .build());
        }

        return result;
    }

    @Override
    public List<TopSellingProductResponse> getTopSellingProducts(AnalyticsFilterRequest filter, int limit) {
        Date[] dateRange = resolveDateRange(filter);
        List<Object[]> rawData = analyticsRepository.getTopSellingProductsData(dateRange[0], dateRange[1]);

        if (rawData == null || rawData.isEmpty()) {
            return Collections.emptyList();
        }

        return rawData.stream()
                .limit(limit > 0 ? limit : 5)
                .map(row -> TopSellingProductResponse.builder()
                        .productId(row[0] != null ? ((Number) row[0]).longValue() : null)
                        .productName(row[1] != null ? (String) row[1] : "")
                        .productImageUrl(row[2] != null ? (String) row[2] : null)
                        .categoryName(row[3] != null ? (String) row[3] : "")
                        .totalQuantitySold(row[4] != null ? ((Number) row[4]).longValue() : 0L)
                        .totalRevenueGenerated(row[5] != null ? ((Number) row[5]).longValue() : 0L)
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public List<MenuMatrixResponse> getMenuMatrixAnalysis(AnalyticsFilterRequest filter) {
        Date[] dateRange = resolveDateRange(filter);
        List<Object[]> rawData = analyticsRepository.getMenuMatrixRawData(dateRange[0], dateRange[1]);

        if (rawData == null || rawData.isEmpty()) {
            return Collections.emptyList();
        }

        List<MenuMatrixResponse> items = new ArrayList<>();
        double totalQty = 0;
        double totalRev = 0;

        for (Object[] row : rawData) {
            Long productId = row[0] != null ? ((Number) row[0]).longValue() : null;
            String productName = row[1] != null ? (String) row[1] : "";
            String categoryName = row[2] != null ? (String) row[2] : "";
            Long qty = row[3] != null ? ((Number) row[3]).longValue() : 0L;
            Long rev = row[4] != null ? ((Number) row[4]).longValue() : 0L;

            totalQty += qty;
            totalRev += rev;

            items.add(MenuMatrixResponse.builder()
                    .productId(productId)
                    .productName(productName)
                    .categoryName(categoryName)
                    .totalQuantitySold(qty)
                    .totalRevenueGenerated(rev)
                    .build());
        }

        // Calculate averages for matrix quadrant thresholds
        double avgQuantity = items.isEmpty() ? 0 : totalQty / items.size();
        double avgRevenue = items.isEmpty() ? 0 : totalRev / items.size();

        // Categorize each item into BCG Menu Matrix categories
        for (MenuMatrixResponse item : items) {
            boolean highQty = item.getTotalQuantitySold() >= avgQuantity;
            boolean highRev = item.getTotalRevenueGenerated() >= avgRevenue;

            if (highQty && highRev) {
                item.setMatrixCategory(MenuMatrixCategory.STARS);
                item.setDescription("High sales volume & high revenue. Core hero products.");
            } else if (highQty) {
                item.setMatrixCategory(MenuMatrixCategory.WORKHORSES);
                item.setDescription("High sales volume & lower revenue. Popular items, optimize margin.");
            } else if (highRev) {
                item.setMatrixCategory(MenuMatrixCategory.PUZZLES);
                item.setDescription("Low sales volume & high revenue. High margin, push promotions.");
            } else {
                item.setMatrixCategory(MenuMatrixCategory.DOGS);
                item.setDescription("Low sales volume & low revenue. Underperforming items, evaluate menu removal.");
            }
        }

        return items;
    }

    @Override
    public CancellationReportResponse getCancellationReport(AnalyticsFilterRequest filter) {
        Date[] dateRange = resolveDateRange(filter);
        Date startDate = dateRange[0];
        Date endDate = dateRange[1];

        // 1. Query total created orders count
        Long totalOrders = analyticsRepository.getTotalOrdersCount(startDate, endDate);
        if (totalOrders == null) totalOrders = 0L;

        // 2. Query cancelled orders data
        Object[] cancelData = analyticsRepository.getCancellationData(startDate, endDate);
        Long cancelledCount = 0L;
        Long lostRevenue = 0L;

        if (cancelData != null && cancelData.length >= 2) {
            cancelledCount = cancelData[0] != null ? ((Number) cancelData[0]).longValue() : 0L;
            lostRevenue = cancelData[1] != null ? ((Number) cancelData[1]).longValue() : 0L;
        }

        // 3. Calculate cancellation rate percentage
        double rate = (totalOrders > 0) ? ((double) cancelledCount / totalOrders) * 100.0 : 0.0;

        return CancellationReportResponse.builder()
                .cancelledOrdersCount(cancelledCount)
                .totalOrdersCount(totalOrders)
                .lostRevenue(lostRevenue)
                .cancellationRatePercentage(Math.round(rate * 100.0) / 100.0)
                .build();
    }

    @Override
    public List<TablePerformanceResponse> getTablePerformance(AnalyticsFilterRequest filter) {
        Date[] dateRange = resolveDateRange(filter);
        List<Object[]> rawData = analyticsRepository.getTablePerformanceData(dateRange[0], dateRange[1]);

        if (rawData == null || rawData.isEmpty()) {
            return Collections.emptyList();
        }

        return rawData.stream()
                .map(row -> {
                    Long tableId = row[0] != null ? ((Number) row[0]).longValue() : null;
                    String tableName = row[1] != null ? (String) row[1] : "";
                    Long sessionCount = row[2] != null ? ((Number) row[2]).longValue() : 0L;
                    Long rev = row[3] != null ? ((Number) row[3]).longValue() : 0L;
                    double avgRev = (sessionCount > 0) ? (double) rev / sessionCount : 0.0;

                    return TablePerformanceResponse.builder()
                            .tableId(tableId)
                            .tableName(tableName)
                            .sessionCount(sessionCount)
                            .totalRevenue(rev)
                            .averageRevenuePerSession(Math.round(avgRev * 100.0) / 100.0)
                            .build();
                })
                .collect(Collectors.toList());
    }

    // Helper method to query payment method ratio
    private PaymentMethodRatioResponse getPaymentMethodRatio(Date startDate, Date endDate) {
        List<Object[]> paymentData = analyticsRepository.getPaymentMethodData(startDate, endDate);

        long vietQrCount = 0L;
        long vietQrRev = 0L;
        long cashCount = 0L;
        long cashRev = 0L;

        if (paymentData != null) {
            for (Object[] row : paymentData) {
                if (row[0] != null) {
                    PaymentMethod method = (PaymentMethod) row[0];
                    long count = row[1] != null ? ((Number) row[1]).longValue() : 0L;
                    long rev = row[2] != null ? ((Number) row[2]).longValue() : 0L;

                    if (method == PaymentMethod.VIETQR) {
                        vietQrCount = count;
                        vietQrRev = rev;
                    } else if (method == PaymentMethod.CASH) {
                        cashCount = count;
                        cashRev = rev;
                    }
                }
            }
        }

        long totalTx = vietQrCount + cashCount;
        double qrPct = (totalTx > 0) ? ((double) vietQrCount / totalTx) * 100.0 : 0.0;
        double cashPct = (totalTx > 0) ? ((double) cashCount / totalTx) * 100.0 : 0.0;

        return PaymentMethodRatioResponse.builder()
                .vietQrCount(vietQrCount)
                .vietQrRevenue(vietQrRev)
                .vietQrPercentage(Math.round(qrPct * 100.0) / 100.0)
                .cashCount(cashCount)
                .cashRevenue(cashRev)
                .cashPercentage(Math.round(cashPct * 100.0) / 100.0)
                .build();
    }

    // Helper method to resolve start date and end date from AnalyticsFilterRequest
    private Date[] resolveDateRange(AnalyticsFilterRequest filter) {
        AnalyticsPeriodType period = (filter != null && filter.getPeriod() != null)
                ? filter.getPeriod()
                : AnalyticsPeriodType.TODAY;

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start;
        LocalDateTime end;

        switch (period) {
            case TODAY:
                start = now.with(LocalTime.MIN);
                end = now.with(LocalTime.of(23, 59, 59, 999000000));
                break;

            case WEEK:
                start = now.minusDays(7).with(LocalTime.MIN);
                end = now.with(LocalTime.of(23, 59, 59, 999000000));
                break;

            case MONTH:
                start = now.with(TemporalAdjusters.firstDayOfMonth()).with(LocalTime.MIN);
                end = now.with(LocalTime.of(23, 59, 59, 999000000));
                break;

            case CUSTOM:
                if (filter != null && filter.getStartDate() != null) {
                    start = filter.getStartDate().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
                } else {
                    start = now.minusDays(30).with(LocalTime.MIN);
                }
                if (filter != null && filter.getEndDate() != null) {
                    end = filter.getEndDate().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
                } else {
                    end = now.with(LocalTime.of(23, 59, 59, 999000000));
                }
                break;

            default:
                start = now.with(LocalTime.MIN);
                end = now.with(LocalTime.of(23, 59, 59, 999000000));
                break;
        }

        Date startDate = Date.from(start.atZone(ZoneId.systemDefault()).toInstant());
        Date endDate = Date.from(end.atZone(ZoneId.systemDefault()).toInstant());

        return new Date[]{startDate, endDate};
    }
}
