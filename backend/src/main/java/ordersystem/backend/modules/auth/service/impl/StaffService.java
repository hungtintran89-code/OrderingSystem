package ordersystem.backend.modules.auth.service.impl;

import ordersystem.backend.modules.auth.dto.request.CreateStaffRequest;
import ordersystem.backend.modules.auth.dto.response.StaffResponse;
import ordersystem.backend.common.payload.PageResponse;
public interface StaffService {

    public StaffResponse createStaff(CreateStaffRequest request) ;
    public PageResponse<StaffResponse> getStaffs(int page, int size) ;
}
