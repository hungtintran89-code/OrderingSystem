package ordersystem.backend.modules.servicerequest.service.impl;

import ordersystem.backend.modules.servicerequest.dto.request.CreateServiceRequestDto;
import ordersystem.backend.modules.servicerequest.dto.response.ServiceRequestResponse;

import java.util.List;

public interface ServiceRequestService {

    //Khách gửi yêu cầu trợ giúp
    ServiceRequestResponse createRequest(String sessionToken, CreateServiceRequestDto serviceRequestDto);

    //Nhân viên xem danh sách Pending
    List<ServiceRequestResponse> getActiveRequest();

    //Nhân viên xác nhận xử lí xong yêu cầu
    ServiceRequestResponse completedRequest(Long requestId);
}
