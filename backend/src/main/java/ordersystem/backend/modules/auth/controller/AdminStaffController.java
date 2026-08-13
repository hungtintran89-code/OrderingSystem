package ordersystem.backend.modules.auth.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ordersystem.backend.common.payload.ApiResponse;
import ordersystem.backend.common.payload.PageResponse;
import ordersystem.backend.modules.auth.dto.request.CreateStaffRequest;
import ordersystem.backend.modules.auth.dto.response.StaffResponse;
import ordersystem.backend.modules.auth.service.impl.StaffService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Controller quản lý tài khoản nhân viên dành riêng cho Quản lý (Manager).
 */
@RestController
@RequestMapping("/api/v1/admin/staffs")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin Staff Management API", description = "Quản lý tạo mới, danh sách và khóa/mở khóa tài khoản nhân viên")
@PreAuthorize("hasRole('MANAGER')")
public class AdminStaffController {

    private final StaffService staffService;

    @PostMapping
    @Operation(summary = "Tạo mới tài khoản nhân viên hệ thống")
    public ResponseEntity<ApiResponse<StaffResponse>> createStaff(@Valid @RequestBody CreateStaffRequest createStaffRequest) {
        log.info("[REST API] Received request to create staff with username: {}", createStaffRequest.getUsername());
        StaffResponse staffResponse = staffService.createStaff(createStaffRequest);
        log.info("[REST API] Staff created successfully with ID: {}", staffResponse.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Staff created successfully", staffResponse));
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách phân trang nhân viên hệ thống")
    public ResponseEntity<ApiResponse<PageResponse<StaffResponse>>> getStaffs(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<StaffResponse> response = staffService.getStaffs(page, size);
        return ResponseEntity.ok(ApiResponse.success("Get list staff successfully", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật thông tin tài khoản nhân viên")
    public ResponseEntity<ApiResponse<StaffResponse>> updateStaff(
            @PathVariable Long id,
            @Valid @RequestBody ordersystem.backend.modules.auth.dto.request.UpdateStaffRequest updateStaffRequest) {
        log.info("[REST API] Received request to update staff ID: {}", id);
        StaffResponse response = staffService.updateStaff(id, updateStaffRequest);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin nhân viên thành công", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa tài khoản nhân viên khỏi cơ sở dữ liệu")
    public ResponseEntity<ApiResponse<Void>> deleteStaff(@PathVariable Long id) {
        log.info("[REST API] Received request to delete staff ID: {}", id);
        staffService.deleteStaff(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa nhân viên khỏi hệ thống", null));
    }

    /**
     * API Khóa / Mở khóa nhanh tài khoản nhân viên.
     * 
     * @param id ID nhân viên cần khóa hoặc kích hoạt lại
     * @return ApiResponse chứa StaffResponse mới nhất
     */
    @PatchMapping("/{id}/toggle-active")
    @Operation(summary = "Khóa hoặc kích hoạt mở khóa tài khoản nhân viên")
    public ResponseEntity<ApiResponse<StaffResponse>> toggleStaffActive(@PathVariable Long id) {
        StaffResponse response = staffService.toggleStaffActive(id);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái tài khoản nhân viên thành công", response));
    }
}
