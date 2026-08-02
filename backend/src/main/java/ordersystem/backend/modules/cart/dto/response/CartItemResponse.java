package ordersystem.backend.modules.cart.dto.response;


import lombok.*;

@Setter @Getter
@AllArgsConstructor @NoArgsConstructor
@Builder
public class CartItemResponse {

    private Long productId;          // ID sản phẩm
    private String productName;      // Tên sản phẩm
    private String productImageUrl;  // Link hình ảnh sản phẩm
    private Long price;              // Đơn giá sản phẩm
    private Long quantity;           // Số lượng chọn
    private Long totalPrice;         // Thành tiền = price * quantity
    private String note;             // Ghi chú đi kèm
    private Long threadId;           // Thiết bị nào đã thêm món này

}
