package ordersystem.backend.modules.order.controller;

import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.payload.ApiResponse;
import ordersystem.backend.common.payload.PageResponse;
import ordersystem.backend.modules.order.dto.response.MasterTableOrderResponse;
import ordersystem.backend.modules.order.dto.response.TableInvoiceResponse;
import ordersystem.backend.modules.order.enums.OrderStatus;
import ordersystem.backend.modules.order.service.impl.OrderService;
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
    public ResponseEntity<ApiResponse<String>> updateOrderStatus(
            @PathVariable Long orderId ,
            @RequestParam OrderStatus status ){
        orderService.updateOrderStatus(orderId ,status );
        return ResponseEntity.ok( ApiResponse.success("Order status updated successfully!" , null)) ;
    }

    //// 2. Xem Lịch sử Đơn hàng trong ngày (Chuẩn PDF: GET /api/v1/admin/orders/history)
    @GetMapping("history")
    @PreAuthorize("hasAnyRole('MANAGER', 'STAFF')")
    public ResponseEntity<ApiResponse<?>> getOrderHistory(
            @RequestParam(required = false) OrderStatus status,
            Pageable pageable) {
        PageResponse<MasterTableOrderResponse> history = orderService.getOrderHistory(status , pageable ) ;

        return ResponseEntity.ok( ApiResponse.success("Order history retrieved successfully" , history)) ;
    }
    // cho nhaan viên xem xuất hóa đơn
    @GetMapping("/tables/{tableId}/invoice")
    @PreAuthorize("hasAnyRole('MANAGER', 'STAFF', 'CASHIER')")
    public ResponseEntity<ApiResponse<TableInvoiceResponse>> exportAdminTableInvoice( @PathVariable Long tableId ){
        TableInvoiceResponse invoice = orderService.exportTableInvoice(tableId);
        return ResponseEntity.ok(ApiResponse.success("Invoice generated for table " + tableId, invoice));
    }
}
