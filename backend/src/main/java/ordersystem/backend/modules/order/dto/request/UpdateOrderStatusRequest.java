package ordersystem.backend.modules.order.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ordersystem.backend.modules.order.enums.OrderStatus;



@Setter @Getter
@NoArgsConstructor @AllArgsConstructor
public class UpdateOrderStatusRequest {

    @NotNull(message = "The menu item ID cannot be left blank.")
    private Long product_id ;

    @NotNull(message = "The new status cannot be left blank.")
    private OrderStatus status;



}
