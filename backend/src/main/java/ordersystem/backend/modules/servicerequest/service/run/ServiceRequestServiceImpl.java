package ordersystem.backend.modules.servicerequest.service.run;

import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.exception.ResourceNotFoundException;
import ordersystem.backend.modules.servicerequest.dto.request.CreateServiceRequestDto;
import ordersystem.backend.modules.servicerequest.dto.response.ServiceRequestResponse;
import ordersystem.backend.modules.servicerequest.entity.ServiceRequestEntity;
import ordersystem.backend.modules.table.entity.TableSessionEntity;
import ordersystem.backend.modules.servicerequest.enums.RequestStatus;
import ordersystem.backend.modules.servicerequest.mapper.ServiceRequestMapper;
import ordersystem.backend.modules.servicerequest.repository.ServiceRequestRepository;
import ordersystem.backend.modules.table.repository.TableSessionRepository;
import ordersystem.backend.modules.servicerequest.service.impl.ServiceRequestService;
import ordersystem.backend.modules.table.service.impl.TableSessionService;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ServiceRequestServiceImpl implements ServiceRequestService {

    private final TableSessionRepository tableSessionRepository;
    private final ServiceRequestRepository serviceRequestRepository;
    private final ServiceRequestMapper serviceRequestMapper;
    private final TableSessionService tableSessionService;

    //Khách gửi yêu cầu trợ giúp
    @Override
    @Transactional
    public ServiceRequestResponse createRequest(String sessionToken, CreateServiceRequestDto serviceRequestDto){
        // 1. Xác thực SessionToken của khách hàng
        TableSessionEntity session = tableSessionRepository.findBySessionToken(sessionToken)
                .orElseThrow( () -> new ResourceNotFoundException("Invalid session"));
        // 2. Lưu Yêu cầu trợ giúp mới vào DB
        ServiceRequestEntity serviceRequestEntity = ServiceRequestEntity.builder()
                .tableId(session.getTable().getTableId())
                .tableName(session.getTable().getTableName())
                .sessionId(session.getSessionToken())
                .requestType(serviceRequestDto.getRequestType())
                .requestStatus(RequestStatus.PENDING)
                .build();
        ServiceRequestEntity saved = serviceRequestRepository.save(serviceRequestEntity);
        return serviceRequestMapper.toServiceRequestResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    //Nhân viên xem danh sách Pending
    public List<ServiceRequestResponse> getActiveRequest(){
        List<ServiceRequestEntity> activeRequests = serviceRequestRepository.findAllByRequestStatus(RequestStatus.PENDING);

        //Chuyển từ list entity -> list dto response
        return activeRequests.stream()
                .map(serviceRequestMapper::toServiceRequestResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    //Nhân viên xác nhận xử lí xong yêu cầu
    public ServiceRequestResponse completedRequest(Long requestId){
        //Lấy request đang gửi đến chuyển thành completed
        ServiceRequestEntity currentRequest = serviceRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Service request not found with id: " + requestId));

        //Chuyển yêu cầu thành completed
        currentRequest.setRequestStatus(RequestStatus.COMPLETED);
        currentRequest.setCompletedAt(new Date());

        //Nếu xác nhận hoàn thành yêu cầu thanh toán bill -> đóng phiên và chuyển bàn sang EMPTY
        if ("REQUEST_BILL".equalsIgnoreCase(currentRequest.getRequestType().name())){
            tableSessionService.closeSession(currentRequest.getSessionId());
        }

        return serviceRequestMapper.toServiceRequestResponse(currentRequest);
    }
}
