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
    private String qrDataUrl; // Contains QR code image URL or EMVCo QR code
    private String checkoutUrl; // Link to PayOS checkout page
    private String bankName;
    private String accountName;
    private String accountNumber;
}
