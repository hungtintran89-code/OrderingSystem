package ordersystem.backend.modules.catalog.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ToggleAvailabilityRequest {

    @NotNull(message = "Trạng thái isAvailable không được để trống")
    private Boolean isAvailable;
}