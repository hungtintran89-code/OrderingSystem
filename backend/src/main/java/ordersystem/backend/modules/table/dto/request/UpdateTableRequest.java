package ordersystem.backend.modules.table.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Setter @Getter
@Builder
public class UpdateTableRequest {

    @NotBlank (message = "Table Name cannot be blank")
    private String tableName;

    @NotBlank(message = "Status cannot be blank")
    private Boolean isActive;
}
