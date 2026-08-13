package ordersystem.backend.modules.analytics.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ordersystem.backend.modules.analytics.enums.AnalyticsPeriodType;
import org.springframework.format.annotation.DateTimeFormat;

import java.util.Date;

/**
 * Filter request DTO for querying analytics endpoints.
 * Supports preset period types (TODAY, WEEK, MONTH) or custom date ranges.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsFilterRequest {

    @Builder.Default
    private AnalyticsPeriodType period = AnalyticsPeriodType.TODAY;

    private String startDate;

    private String endDate;
}
