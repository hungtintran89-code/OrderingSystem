package ordersystem.backend.modules.servicerequest.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import ordersystem.backend.modules.servicerequest.enums.RequestType;


@Builder
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class CreateServiceRequestDto {

    @NotNull(message = "The required type cannot be left blank.")
    private RequestType requestType;

}
