package ordersystem.backend.modules.analytics.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Breakdown of payment methods (VietQR vs Cash) in total transactions.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentMethodRatioResponse {
    private Long vietQrCount;
    private Long vietQrRevenue;
    private Double vietQrPercentage;

    private Long cashCount;
    private Long cashRevenue;
    private Double cashPercentage;
}
