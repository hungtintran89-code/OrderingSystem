package ordersystem.backend.modules.order.dto.request;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Setter @Getter
@NoArgsConstructor @AllArgsConstructor
public class CreateTableRequest {

    @NotNull(message = "Table ID cannot be left blank.")
    private Long table_id;


}
