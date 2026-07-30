package ordersystem.backend.modules.order.controller;

import lombok.RequiredArgsConstructor;
import ordersystem.backend.modules.order.enums.OrderStatus;
import ordersystem.backend.modules.order.service.run.OrderService;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/v1/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

    final private OrderService orderService ;

    // API 1: Bếp bấm cập nhật trạng thái đơn hàng (VD: PENDING -> PREPARING -> SERVED)
    // URL: PATCH /api/v1/kitchen/orders/15/status?status=SERVED
    @PatchMapping("/{orderId}/status")
    @PreAuthorize("hasAnyRole('MANAGER', 'STAFF', 'KITCHEN')")
    public ResponseEntity<String> updateOrderStatus(
            @PathVariable Long orderId ,
            @RequestParam OrderStatus status ){
        orderService.updateOrderStatus(orderId ,status );
        return ResponseEntity.ok("Order status updated successfully!") ;
    }

    //// 2. Xem Lịch sử Đơn hàng trong ngày (Chuẩn PDF: GET /api/v1/admin/orders/history)
    @GetMapping("history")
    @PreAuthorize("hasAnyRole('MANAGER', 'STAFF')")
    public ResponseEntity<?> getOrderHistory(
            @RequestParam(required = false) OrderStatus status,
            Pageable pageable) {
        // Gọi service lấy danh sách phân trang lịch sử đơn hàng
        return ResponseEntity.ok(orderService.getOrderHistory(status, pageable));
    }
}
