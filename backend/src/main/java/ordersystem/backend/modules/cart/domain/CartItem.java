package ordersystem.backend.modules.cart.domain;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItem {
    private Long productId;
    private String productName;
    private String productImageUrl;
    private Long price;
    private Long quantity;
    private String note;
    private Long threadId;
    // Hàm tính tổng tiền cho từng item trong giỏ
    public Long getTotalPrice() {
        return (price != null ? price : 0L) * (quantity != null ? quantity : 0L);
    }
}