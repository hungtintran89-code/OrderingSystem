package ordersystem.backend.modules.analytics.enums;

public enum AnalyticsPeriodType {
    TODAY,
    WEEK,
    MONTH,

    //Tùy chỉnh khoảng thời gian thủ công (Yêu cầu phải truyền startDate và endDate)
    CUSTOM
}
