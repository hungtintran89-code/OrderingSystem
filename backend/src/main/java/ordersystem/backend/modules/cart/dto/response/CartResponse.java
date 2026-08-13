package ordersystem.backend.modules.cart.dto.response;

import lombok.*;

import java.util.List;


@Setter @Getter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CartResponse {


    private Long tableSessionId;             // Mã phiên của bàn
    private Long threadId;                   // Mã thiết bị của khách
    private List<CartItemResponse> items;    // Danh sách món trong giỏ
    private Long totalItems;                 // Tổng số lượng món
    private Long totalAmount;                // Tổng số tiền tạm tính của giỏ

}
