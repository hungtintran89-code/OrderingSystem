package ordersystem.backend.modules.table.dto.response;

import lombok.*;
import ordersystem.backend.modules.table.enums.TableStatus;

//Đóng gói thông tin thanh toán bàn gửi về dashboard staff
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class FloorMapResponse {
    private Long tableId;
    private String tableName;
    private TableStatus status;
    private Double tempTotalAmount; //Tien tong tam tinh
    private String qrUrl;
    private String qrImageBase64;
    private String qrToken;
    private String zone;
    private Integer capacity;
}
