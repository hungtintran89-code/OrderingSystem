package ordersystem.backend.modules.table.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateZoneRequest {
    @NotBlank(message = "Tên khu vực không được để trống")
    private String zoneName;
}
