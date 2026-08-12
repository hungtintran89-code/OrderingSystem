package ordersystem.backend.modules.kds.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.payload.ApiResponse;
import ordersystem.backend.modules.kds.dto.response.ChefWorkHistoryResponse;
import ordersystem.backend.modules.kds.dto.response.KitchenItemAggregatedResponse;
import ordersystem.backend.modules.kds.dto.response.KitchenTicketResponse;
import ordersystem.backend.modules.kds.service.impl.KitchenTicketService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * Controller xử lý các API hiển thị và thao tác KDS (Kitchen Display System) cho Bếp.
 */
@RestController
@RequestMapping("/api/v1/kitchen")
@RequiredArgsConstructor
@Tag(name = "Kitchen KDS API", description = "Quản lý phiếu đơn chế biến, nhún làm món, bump đơn và lịch sử bếp")
public class KitchenOrderController {

    private final KitchenTicketService kitchenTicketService;

    // API 1: MÀN HÌNH CHUNG - Món chờ (PENDING)
    @GetMapping("/tickets/pending")
    @PreAuthorize("hasAnyRole('KITCHEN', 'MANAGER')")
    @Operation(summary = "Lấy danh sách các đơn chờ chế biến (PENDING)")
    public ResponseEntity<ApiResponse<List<KitchenTicketResponse>>> getPendingTickets() {
        List<KitchenTicketResponse> tickets = kitchenTicketService.getPendingTickets();
        return ResponseEntity.ok(ApiResponse.success("Successfully loaded the shared screen list", tickets));
    }

    // API 2: MÀN HÌNH CÁ NHÂN - Món đang nấu (COOKING)
    @GetMapping("/tickets/my-cooking")
    @PreAuthorize("hasAnyRole('KITCHEN', 'MANAGER')")
    @Operation(summary = "Lấy danh sách món cá nhân đầu bếp đang nấu (COOKING)")
    public ResponseEntity<ApiResponse<List<KitchenTicketResponse>>> getMyCookingTickets(Principal principal) {
        List<KitchenTicketResponse> tickets = kitchenTicketService.getMyCookingTickets(principal);
        return ResponseEntity.ok(ApiResponse.success("Successfully downloaded personal list of dishes currently being cooked.", tickets));
    }

    // API 4: BẤM NHẬN LÀM (CLAIM)
    @PostMapping("/tickets/{ticketId}/claim")
    @PreAuthorize("hasAnyRole('KITCHEN', 'MANAGER')")
    @Operation(summary = "Đầu bếp bấm nhận làm món (CLAIM)")
    public ResponseEntity<ApiResponse<KitchenTicketResponse>> claimTicket(
            @PathVariable Long ticketId,
            Principal principal) {
        KitchenTicketResponse response = kitchenTicketService.claimTicket(ticketId, principal);
        return ResponseEntity.ok(ApiResponse.success("Nhận làm món thành công!", response));
    }

    // API 5: BẤM ĐÃ XONG (COMPLETE) -> BẮN WEBSOCKET SANG TAB LỊCH SỬ CHUNG REAL-TIME
    @PostMapping("/tickets/{ticketId}/complete")
    @PreAuthorize("hasAnyRole('KITCHEN', 'MANAGER')")
    @Operation(summary = "Đầu bếp bấm hoàn thành món (BUMP / COMPLETE)")
    public ResponseEntity<ApiResponse<KitchenTicketResponse>> completeTicket(
            @PathVariable Long ticketId,
            Principal principal) {
        KitchenTicketResponse response = kitchenTicketService.completeTicket(ticketId, principal);
        return ResponseEntity.ok(ApiResponse.success("Dish successfully completed! It has been updated to the general history.", response));
    }

    // API 6: LỊCH SỬ CÁ NHÂN CỦA ĐẦU BẾP ĐANG ĐĂNG NHẬP
    @GetMapping("/my-history")
    @PreAuthorize("hasAnyRole('KITCHEN', 'MANAGER')")
    @Operation(summary = "Lấy lịch sử món đã nấu xong của cá nhân đầu bếp")
    public ResponseEntity<ApiResponse<ChefWorkHistoryResponse>> getMyWorkHistory(Principal principal) {
        ChefWorkHistoryResponse history = kitchenTicketService.getCookWorkHistory(principal);
        return ResponseEntity.ok(ApiResponse.success("Successfully download personal work history.", history));
    }

    // API 7 : TAB LỊCH SỬ HOÀN THÀNH CHUNG (Tất cả các món đã nấu xong của toàn bộ Bếp)
    @GetMapping("/tickets/completed-history")
    @PreAuthorize("hasAnyRole('KITCHEN', 'MANAGER', 'STAFF')")
    @Operation(summary = "Lấy danh sách lịch sử hoàn thành chung toàn bộ bếp")
    public ResponseEntity<ApiResponse<List<KitchenTicketResponse>>> getSharedCompletedHistory(
            @RequestParam(defaultValue = "50") int limit) {
        List<KitchenTicketResponse> history = kitchenTicketService.getSharedCompletedHistory(limit);
        return ResponseEntity.ok(ApiResponse.success("Successfully downloaded the overall completion history.", history));
    }

    /**
     * API Khôi phục đơn hàng từ Lịch sử về lại màn hình Bếp đang làm (RECALL).
     * 
     * @param ticketId ID ticket KDS
     * @return ApiResponse chứa KitchenTicketResponse
     */
    @PostMapping("/tickets/{ticketId}/recall")
    @PreAuthorize("hasAnyRole('KITCHEN', 'MANAGER')")
    @Operation(summary = "Khôi phục đơn từ Lịch sử về màn hình Chế biến bếp (RECALL)")
    public ResponseEntity<ApiResponse<KitchenTicketResponse>> recallTicket(@PathVariable Long ticketId) {
        KitchenTicketResponse response = kitchenTicketService.recallTicket(ticketId);
        return ResponseEntity.ok(ApiResponse.success("Khôi phục đơn về bếp thành công!", response));
    }

    /**
     * API Lấy bảng gom số lượng món tổng hợp chế biến mẻ lớn (Batch Cooking Matrix).
     * 
     * @return ApiResponse chứa danh sách KitchenItemAggregatedResponse
     */
    @GetMapping("/aggregated-dishes")
    @PreAuthorize("hasAnyRole('KITCHEN', 'MANAGER')")
    @Operation(summary = "Lấy bảng tổng hợp gom số lượng món cần chế biến (Batch Cooking Matrix)")
    public ResponseEntity<ApiResponse<List<KitchenItemAggregatedResponse>>> getAggregatedDishes() {
        List<KitchenItemAggregatedResponse> aggregated = kitchenTicketService.getAggregatedDishes();
        return ResponseEntity.ok(ApiResponse.success("Lấy bảng gom món thành công!", aggregated));
    }
}
