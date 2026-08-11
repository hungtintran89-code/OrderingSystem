package ordersystem.backend.modules.table.dto.response;

import lombok.*;

//Trả về dữ liệu bàn cho trang quản trị admin
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TableResponse {
    private Long tableId;
    private String tableName;
    private String qrToken;
    private String qrUrl;
    private String qrImageBase64;
    private String zone;
    private Integer capacity;
    private Boolean isActive;
}
