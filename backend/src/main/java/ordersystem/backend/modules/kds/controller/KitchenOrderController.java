package ordersystem.backend.modules.kds.controller;


import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.payload.ApiResponse;
import ordersystem.backend.modules.auth.entity.User;
import ordersystem.backend.modules.kds.dto.response.ChefWorkHistoryResponse;
import ordersystem.backend.modules.kds.dto.response.KitchenTicketResponse;
import ordersystem.backend.modules.kds.service.impl.KitchenTicketService;
import ordersystem.backend.modules.order.enums.OrderStatus;
import ordersystem.backend.modules.order.service.run.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/kitchen")
@RequiredArgsConstructor
public class KitchenOrderController {
    final private KitchenTicketService kitchenTicketService ;

    // API 1: MÀN HÌNH CHUNG - Món chờ (PENDING)
    @GetMapping("/tickets/pending")
    @PreAuthorize("hasAnyRole('KITCHEN', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<KitchenTicketResponse>>> getPendingTickets() {
        List<KitchenTicketResponse> tickets = kitchenTicketService.getPendingTickets();
        return ResponseEntity.ok(ApiResponse.success("Successfully loaded the shared screen list", tickets));
    }

    // API 2: MÀN HÌNH CÁ NHÂN - Món đang nấu (COOKING)
    @GetMapping("/tickets/my-cooking")
    @PreAuthorize("hasAnyRole('KITCHEN', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<KitchenTicketResponse>>> getMyCookingTickets(
            Principal principal) {

        List<KitchenTicketResponse> tickets = kitchenTicketService.getMyCookingTickets(Long.parseLong(principal.getName()));
        return ResponseEntity.ok(ApiResponse.success("Successfully downloaded personal list of dishes currently being cooked.", tickets));
    }

    // API 4: BẤM NHẬN LÀM (CLAIM)
    @PostMapping("/tickets/{ticketId}/claim")
    @PreAuthorize("hasAnyRole('KITCHEN', 'MANAGER')")
    public ResponseEntity<ApiResponse<KitchenTicketResponse>> claimTicket(
            @PathVariable Long ticketId,
            Principal principal) {

        KitchenTicketResponse response = kitchenTicketService.claimTicket( ticketId, principal );
        return ResponseEntity.ok(ApiResponse.success("Nhận làm món thành công!", response));
    }

    // API 5: BẤM ĐÃ XONG (COMPLETE) -> BẮN WEBSOCKET SANG TAB LỊCH SỬ CHUNG REAL-TIME
    @PostMapping("/tickets/{ticketId}/complete")
    @PreAuthorize("hasAnyRole('KITCHEN', 'MANAGER')")
    public ResponseEntity<ApiResponse<KitchenTicketResponse>> completeTicket(
            @PathVariable Long ticketId,
            Principal principal) {

        KitchenTicketResponse response = kitchenTicketService.completeTicket(ticketId , Long.parseLong(principal.getName()));
        return ResponseEntity.ok(ApiResponse.success("Dish successfully completed! It has been updated to the general history.", response));
    }

    // API 6: LỊCH SỬ CÁ NHÂN CỦA ĐẦU BẾP ĐANG ĐĂNG NHẬP
    @GetMapping("/my-history")
    @PreAuthorize("hasAnyRole('KITCHEN', 'MANAGER')")
    public ResponseEntity<ApiResponse<ChefWorkHistoryResponse>> getMyWorkHistory(
            Principal principal) {

        ChefWorkHistoryResponse history = kitchenTicketService.getCookWorkHistory( Long.parseLong(principal.getName()));
        return ResponseEntity.ok(ApiResponse.success("Successfully download personal work history.", history));
    }

    // API 7 : TAB LỊCH SỬ HOÀN THÀNH CHUNG (Tất cả các món đã nấu xong của toàn bộ Bếp)
    // GET /api/v1/kitchen/tickets/completed-history?limit=50
    @GetMapping("/tickets/completed-history")
    @PreAuthorize("hasAnyRole('KITCHEN', 'MANAGER', 'STAFF')")
    public ResponseEntity<ApiResponse<List<KitchenTicketResponse>>> getSharedCompletedHistory(
            @RequestParam(defaultValue = "50") int limit) {

        List<KitchenTicketResponse> history = kitchenTicketService.getSharedCompletedHistory(limit);
        return ResponseEntity.ok(ApiResponse.success("Successfully downloaded the overall completion history.", history));
    }
}
