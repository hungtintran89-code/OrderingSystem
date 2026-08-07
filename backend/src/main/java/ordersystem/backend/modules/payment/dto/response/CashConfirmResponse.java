package ordersystem.backend.modules.payment.dto.response;

import lombok.*;
import ordersystem.backend.modules.payment.enums.PaymentMethod;
import ordersystem.backend.modules.payment.enums.PaymentStatus;

import java.util.Date;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CashConfirmResponse {
    private Long invoiceId;
    private Long tableSessionId;
    private Long totalAmount;
    private Long receivedAmount;
    private Long changeAmount;
    private PaymentMethod paymentMethod;
    private PaymentStatus status;
    private Date paidAt;
}
