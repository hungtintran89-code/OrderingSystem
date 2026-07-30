package ordersystem.backend.modules.kds.controller;


import lombok.RequiredArgsConstructor;
import ordersystem.backend.modules.order.enums.OrderStatus;
import ordersystem.backend.modules.order.service.run.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/kitchen/orders")
@RequiredArgsConstructor
public class KitchenOrderController {

    final private OrderService orderService ;

    // API 1: Bếp bấm cập nhật trạng thái đơn hàng (VD: PENDING -> PREPARING -> SERVED)
    // URL: PATCH /api/v1/kitchen/orders/15/status?status=SERVED
    @PatchMapping("/{orderId}/status")
    public ResponseEntity<String> updateOrderStatus(
            @PathVariable Long orderId ,
            @RequestParam OrderStatus status ){
        orderService.updateOrderStatus(orderId ,status );
        return ResponseEntity.ok("Order status updated successfully!") ;
    }

    // API 2: Bếp hoặc Quản lý bật/tắt trạng thái món CÒN HÀNG (true) hoặc HẾT HÀNG (false)
    // URL: PATCH /api/v1/kitchen/orders/products/5/availability?isAvailable=false
    @PatchMapping("/products/{productId}/availability")
    public ResponseEntity<String> updateProductAvailability (
            @PathVariable Long productId ,
            @RequestParam Boolean isAvailable){
        orderService.updateProductAvailability(productId , isAvailable );
        String statusText = Boolean.TRUE.equals(isAvailable) ? "IN STOCK" : "OUT OF STOCK";
        return ResponseEntity.ok("The dish has been switched to the status "+statusText) ;
    }
}
