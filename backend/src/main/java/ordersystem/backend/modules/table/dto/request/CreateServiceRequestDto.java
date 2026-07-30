package ordersystem.backend.modules.table.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import ordersystem.backend.modules.table.enums.RequestType;


@Builder
@Getter @Setter
public class CreateServiceRequestDto {

    @NotNull(message = "The required type cannot be left blank.")
    private RequestType requestType;

}
