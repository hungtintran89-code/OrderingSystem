package ordersystem.backend.modules.table.service.run;

import lombok.RequiredArgsConstructor;
import ordersystem.backend.modules.table.dto.request.CreateServiceRequestDto;
import ordersystem.backend.modules.table.dto.response.ServiceRequestResponse;
import ordersystem.backend.modules.table.service.impl.ServiceRequestService;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ServiceRequestServiceImpl implements ServiceRequestService {

    //Khách gửi yêu cầu trợ giúp
    @Override
    public ServiceRequestResponse createRequest(String sessionToken, CreateServiceRequestDto serviceRequestDto){
        return null;
    }

    @Override
    //Nhân viên xem danh sách Pending
    public List<ServiceRequestResponse> getActiveRequest(){
        return null ;
    }

    @Override
    //Nhân viên xác nhận xử lí xong yêu cầu
    public ServiceRequestResponse completedRequest(Long requestId){
        return null;
    }
}
