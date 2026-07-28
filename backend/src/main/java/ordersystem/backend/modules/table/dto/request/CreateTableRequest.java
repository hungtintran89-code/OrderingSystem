package ordersystem.backend.modules.table.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;


@Getter @Setter
@Builder
public class CreateTableRequest {
    @NotBlank(message = "Table Name cannot be blank")
    private String tableName;
}
