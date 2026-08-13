package ordersystem.backend.modules.table.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;


@Getter @Setter
@Builder
@NoArgsConstructor @AllArgsConstructor
public class CreateTableRequest {
    @NotBlank(message = "Table Name cannot be blank")
    private String tableName;

    private String zone;

    private Integer capacity;
}
