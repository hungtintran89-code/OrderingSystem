package ordersystem.backend.modules.cart.domain;


import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cart {
    private Long tableSessionId;
    private Long threadId;

    @Builder.Default
    private List<CartItem> items = new CopyOnWriteArrayList<>();


    // Hàm tính tổng tiền cả giỏ hàng
    public Long getTotalAmount() {
        return items.stream()
                .mapToLong(CartItem::getTotalPrice)
                .sum();
    }
    // Hàm tính tổng số lượng món trong giỏ
    public Long getTotalItems() {
        return items.stream()
                .mapToLong(CartItem::getQuantity)
                .sum();
    }
}