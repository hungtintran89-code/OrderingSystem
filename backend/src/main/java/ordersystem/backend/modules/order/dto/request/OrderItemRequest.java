package ordersystem.backend.modules.order.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class
OrderItemRequest {

    @NotNull(message = "Product ID cannot be left blank.")
    private Long productId;

    @NotNull(message = "The quantity must not be left blank.")
    @Min(value = 1, message = "Minimum quantity is 1")
    private Long quantity;

    private String note;
}
