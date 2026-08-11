package ordersystem.backend.modules.table.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTableRequest {
    @NotBlank(message = "Tên bàn không được để trống")
    private String tableName;

    private String zone;

    @Min(value = 1, message = "Số chỗ ngồi phải từ 1 trở lên")
    private Integer capacity;

    private Boolean regenerateQr;
}
