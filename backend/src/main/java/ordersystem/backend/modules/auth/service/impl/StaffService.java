package ordersystem.backend.modules.auth.service.impl;

import ordersystem.backend.modules.auth.dto.request.CreateStaffRequest;
import ordersystem.backend.modules.auth.dto.request.UpdateStaffRequest;
import ordersystem.backend.modules.auth.dto.response.StaffResponse;
import ordersystem.backend.common.payload.PageResponse;

/**
 * Interface Service định nghĩa các thao tác quản lý nhân viên hệ thống (Manager Only).
 */
public interface StaffService {

    StaffResponse createStaff(CreateStaffRequest request);
    PageResponse<StaffResponse> getStaffs(int page, int size);

    /**
     * Cập nhật thông tin nhân viên (Họ tên, Vai trò, Lương, Số điện thoại, Mật khẩu).
     */
    StaffResponse updateStaff(Long staffId, UpdateStaffRequest request);

    /**
     * Xóa hoàn toàn tài khoản nhân viên khỏi cơ sở dữ liệu.
     */
    void deleteStaff(Long staffId);

    /**
     * Phương thức Khóa / Mở khóa tài khoản nhân viên nhanh chóng.
     * @param staffId ID nhân viên cần khóa/mở khóa
     * @return StaffResponse chứa thông tin tài khoản sau khi đổi trạng thái
     */
    StaffResponse toggleStaffActive(Long staffId);
}
