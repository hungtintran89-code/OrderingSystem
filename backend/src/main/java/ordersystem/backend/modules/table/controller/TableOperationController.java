package ordersystem.backend.modules.table.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.payload.ApiResponse;
import ordersystem.backend.modules.table.dto.request.TableMergeRequest;
import ordersystem.backend.modules.table.dto.request.TableTransferRequest;
import ordersystem.backend.modules.table.service.impl.TableSessionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Controller xử lý các thao tác vận hành sơ đồ bàn ăn nâng cao cho Staff POS (Chuyển bàn, Gộp bàn).
 */
@RestController
@RequestMapping("/api/v1/tables")
@Tag(name = "Staff Table Operations API", description = "Vận hành chuyển bàn và gộp bàn dành cho Nhân viên Phục vụ & Quản lý")
@RequiredArgsConstructor
public class TableOperationController {

    private final TableSessionService tableSessionService;

    /**
     * API Chuyển toàn bộ các món ăn và hóa đơn từ Bàn A sang Bàn B.
     * 
     * @param request TableTransferRequest chứa ID bàn nguồn và ID bàn đích
     * @return ApiResponse trạng thái thành công
     */
    @PostMapping("/transfer")
    @PreAuthorize("hasAnyRole('MANAGER', 'STAFF')")
    @Operation(summary = "Chuyển đơn hàng và hóa đơn từ Bàn nguồn sang Bàn đích")
    public ResponseEntity<ApiResponse<Void>> transferTable(@Valid @RequestBody TableTransferRequest request) {
        tableSessionService.transferTable(request.getSourceTableId(), request.getTargetTableId());
        return ResponseEntity.ok(ApiResponse.success("Chuyển bàn thành công!", null));
    }

    /**
     * API Gộp nhiều bàn nguồn đang có khách thành 1 bàn đích duy nhất.
     * 
     * @param request TableMergeRequest chứa danh sách ID bàn nguồn và ID bàn đích
     * @return ApiResponse trạng thái thành công
     */
    @PostMapping("/merge")
    @PreAuthorize("hasAnyRole('MANAGER', 'STAFF')")
    @Operation(summary = "Gộp nhiều bàn đang hoạt động làm một phiên chung")
    public ResponseEntity<ApiResponse<Void>> mergeTables(@Valid @RequestBody TableMergeRequest request) {
        tableSessionService.mergeTables(request.getSourceTableIds(), request.getTargetTableId());
        return ResponseEntity.ok(ApiResponse.success("Gộp bàn thành công!", null));
    }
}
