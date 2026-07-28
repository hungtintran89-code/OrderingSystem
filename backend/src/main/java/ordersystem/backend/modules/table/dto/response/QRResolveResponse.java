package ordersystem.backend.modules.table.dto.response;

import lombok.*;

//DTO trả về cho khách hàng khi quét QR success
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class QRResolveResponse {
    private Long tableId;
    private String tableName;
    private String sessionId;
    private String sessionStatus;
}
