package ordersystem.backend.modules.order.service.run;

import ordersystem.backend.modules.order.dto.request.SubmitPersonalOrderRequest;
import ordersystem.backend.modules.order.dto.response.MasterTableOrderResponse;
import ordersystem.backend.modules.order.dto.response.PersonalOrderResponse;
import ordersystem.backend.modules.order.enums.OrderStatus;

public interface OrderService {

    // 1. Xử lý khi Khách hàng bấm Gửi đơn đặt món
    PersonalOrderResponse submitPersonalOrder(SubmitPersonalOrderRequest request);

    // 2. Lấy danh sách món do chính điện thoại của khách đã đặt
    PersonalOrderResponse getPersonalOrder(Long tableSessionId, String threadId);

    // 3. Lấy tổng hợp danh sách món của cả bàn (TAB CHUNG)
    MasterTableOrderResponse getMasterTableOrder(Long tableSessionId);

    // 4. Bếp/Nhân viên cập nhật trạng thái đơn hàng (PENDING -> PREPARING -> SERVED)
    void updateOrderStatus(Long orderId, OrderStatus status);

}
