package ordersystem.backend.modules.cart.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddToCartRequest {

    // ID phiên làm việc của bàn (bắt buộc)
    @NotNull(message = "Table session ID is required")
    private Long tableSessionId;

    // ID định danh thiết bị/trình duyệt của khách
    @NotNull(message = "Thread ID is required")
    private Long threadId;

    // ID sản phẩm/món ăn muốn thêm vào giỏ
    @NotNull(message = "Product ID is required")
    private Long productId;

    // Số lượng món ăn (tối thiểu là 1)
    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Long quantity;

    // Ghi chú của khách cho món ăn này (ví dụ: "Không cay", "Nhiều đá")
    private String note;
}