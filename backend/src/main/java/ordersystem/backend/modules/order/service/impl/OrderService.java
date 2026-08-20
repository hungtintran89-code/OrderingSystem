package ordersystem.backend.modules.order.service.impl;

import ordersystem.backend.common.payload.PageResponse;
import ordersystem.backend.modules.order.dto.request.SubmitPersonalOrderRequest;
import ordersystem.backend.modules.order.dto.response.MasterTableOrderResponse;
import ordersystem.backend.modules.order.dto.response.PersonalOrderResponse;
import ordersystem.backend.modules.order.dto.response.TableInvoiceResponse;
import ordersystem.backend.modules.order.enums.OrderStatus;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Pageable;

public interface OrderService {

    // 1. Xử lý khi Khách hàng bấm Gửi đơn đặt món
    @CacheEvict(value = "floor_map", allEntries = true)
    PersonalOrderResponse submitOrderWithLock(SubmitPersonalOrderRequest request);

    // 2. Lấy danh sách món do chính điện thoại của khách đã đặt
    PersonalOrderResponse getPersonalOrder(Long tableSessionId, Long threadId);

    // 3. Lấy tổng hợp danh sách món của cả bàn (TAB CHUNG)
    MasterTableOrderResponse getMasterTableOrder(Long tableId );

    // 4. Bếp/Nhân viên cập nhật trạng thái đơn hàng (PENDING -> PREPARING -> SERVED)
    void updateOrderStatus(Long orderId, OrderStatus status);

    // 5. Lấy tổng lịch sử order theo trạng thái & ngày
    PageResponse<MasterTableOrderResponse> getOrderHistory(OrderStatus status, String date, String startDateStr, String endDateStr, Pageable pageable);


}
