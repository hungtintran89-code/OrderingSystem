package ordersystem.backend.modules.payment.dto.response;

import lombok.*;

@Getter @Setter
@Builder
@NoArgsConstructor @AllArgsConstructor
public class PaymentLinkResponse {
    private Long tableSessionId;
    private Long payosOrderCode;
    private Long totalAmount;
    private String transferContent;
    private String qrDataUrl; //Chua ma qr thanh toan
}
