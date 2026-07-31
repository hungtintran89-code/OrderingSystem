package ordersystem.backend.modules.table.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import ordersystem.backend.modules.table.enums.RequestType;


@Builder
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class CreateServiceRequestDto {

    @NotNull(message = "The required type cannot be left blank.")
    private RequestType requestType;

}
