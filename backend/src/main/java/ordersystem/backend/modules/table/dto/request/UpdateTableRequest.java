package ordersystem.backend.modules.table.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Setter @Getter
@Builder
@AllArgsConstructor @NoArgsConstructor
public class UpdateTableRequest {

    @NotBlank (message = "Table Name cannot be blank")
    private String tableName;

    @NotBlank(message = "Status cannot be blank")
    private Boolean isActive;
}
