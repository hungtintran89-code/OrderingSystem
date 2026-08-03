package ordersystem.backend.modules.order.event;


import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class OrderSubmittedEvent {
    private final Long orderId;      // 📌 CÔNG DỤNG: ID đơn hàng vừa tạo
    private final String tableNumber;// 📌 CÔNG DỤNG: Số bàn
    private final String areaName;   // 📌 CÔNG DỤNG: Khu vực bàn
    private final List<OrderItemInfo> items; // 📌 CÔNG DỤNG: Danh sách các món ăn trong đợt đặt này
    @Getter
    @AllArgsConstructor
    public static class OrderItemInfo {
        private final Long orderItemId;
        private final Long productId;
        private final String productName;
        private final Integer quantity;
        private final String note;
    }
}