package ordersystem.backend.modules.cart.dto.request;


import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateCartItemRequest {

    // Số lượng mới muốn cập nhật (nếu bằng 0 thì xoá khỏi giỏ)
    @NotNull(message = "Quantity is required")
    @Min(value = 0, message = "Quantity cannot be negative")
    private Long quantity;

    // Ghi chú mới cho món ăn
    private String note;
}