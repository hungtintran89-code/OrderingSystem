package ordersystem.backend.modules.servicerequest.service.run;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ordersystem.backend.common.exception.ResourceNotFoundException;
import ordersystem.backend.common.websocket.WebSocketPublisher;
import ordersystem.backend.modules.servicerequest.dto.request.CreateServiceRequestDto;
import ordersystem.backend.modules.servicerequest.dto.response.ServiceRequestResponse;
import ordersystem.backend.modules.servicerequest.entity.ServiceRequestEntity;
import ordersystem.backend.modules.table.entity.RestaurantTableEntity;
import ordersystem.backend.modules.table.entity.TableSessionEntity;
import ordersystem.backend.modules.table.enums.SessionStatus;
import ordersystem.backend.modules.table.enums.TableStatus;
import ordersystem.backend.modules.table.event.TableStateChangeEvent;
import ordersystem.backend.modules.servicerequest.enums.RequestStatus;
import ordersystem.backend.modules.servicerequest.mapper.ServiceRequestMapper;
import ordersystem.backend.modules.servicerequest.repository.ServiceRequestRepository;
import ordersystem.backend.modules.table.repository.RestaurantTableRepository;
import ordersystem.backend.modules.table.repository.TableSessionRepository;
import ordersystem.backend.modules.servicerequest.service.impl.ServiceRequestService;
import ordersystem.backend.modules.table.service.impl.TableSessionService;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class ServiceRequestServiceImpl implements ServiceRequestService {

    private final TableSessionRepository tableSessionRepository;
    private final RestaurantTableRepository restaurantTableRepository;
    private final ServiceRequestRepository serviceRequestRepository;
    private final ServiceRequestMapper serviceRequestMapper;
    private final TableSessionService tableSessionService;
    private final WebSocketPublisher webSocketPublisher;
    private final ApplicationEventPublisher eventPublisher;

    //Khách gửi yêu cầu trợ giúp
    @Override
    @Transactional
    public ServiceRequestResponse createRequest(String sessionToken, CreateServiceRequestDto serviceRequestDto){
        log.info("Received service request: token={}, type={}", sessionToken, serviceRequestDto.getRequestType());

        // 1. Phân giải SessionToken / QRToken linh hoạt
        TableSessionEntity session = resolveTableSession(sessionToken);
        RestaurantTableEntity table = session != null ? session.getTable() : resolveTableByToken(sessionToken);

        if (table == null) {
            throw new ResourceNotFoundException("Không tìm thấy bàn phù hợp với token: " + sessionToken);
        }

        String actualSessionToken = session != null ? session.getSessionToken() : sessionToken;

        // 2. Lưu Yêu cầu trợ giúp mới vào DB
        ServiceRequestEntity serviceRequestEntity = ServiceRequestEntity.builder()
                .tableId(table.getTableId())
                .tableName(table.getTableName())
                .sessionId(actualSessionToken)
                .requestType(serviceRequestDto.getRequestType())
                .requestStatus(RequestStatus.PENDING)
                .build();
        ServiceRequestEntity saved = serviceRequestRepository.save(serviceRequestEntity);

        // 3. Cập nhật trạng thái bàn vật lý & phát sự kiện WebSocket Realtime
        String reqTypeName = serviceRequestDto.getRequestType() != null ? serviceRequestDto.getRequestType().name() : "";
        TableStatus targetStatus = TableStatus.CALLING_STAFF;
        if (reqTypeName.contains("BILL") || reqTypeName.contains("PAYMENT")) {
            targetStatus = TableStatus.BILL_REQUESTED;
        }

        table.setTableStatus(targetStatus);
        restaurantTableRepository.save(table);

        log.info("Updated table {} ({}) status to {}", table.getTableId(), table.getTableName(), targetStatus);

        // Phát sự kiện Realtime gửi WebSocket tới /topic/tables/floor-map
        eventPublisher.publishEvent(new TableStateChangeEvent(
                this,
                table.getTableId(),
                table.getTableName(),
                targetStatus
        ));

        ServiceRequestResponse response = serviceRequestMapper.toServiceRequestResponse(saved);
        webSocketPublisher.notifyServiceRequest(response);
        return response;
    }

    private TableSessionEntity resolveTableSession(String sessionToken) {
        if (sessionToken == null || sessionToken.isBlank()) return null;

        // Ưu tiên 1: Tìm theo sessionToken trực tiếp
        var sessionOpt = tableSessionRepository.findBySessionToken(sessionToken);
        if (sessionOpt.isPresent()) return sessionOpt.get();

        // Ưu tiên 2: Xử lý prefix "TOKEN_123"
        String cleanedToken = sessionToken.replaceAll("(?i)^TOKEN_", "").trim();
        try {
            Long sessionId = Long.parseLong(cleanedToken);
            var byIdOpt = tableSessionRepository.findById(sessionId);
            if (byIdOpt.isPresent()) return byIdOpt.get();

            // Tìm theo tableId có session ACTIVE
            var byTableOpt = tableSessionRepository.findByTableTableIdAndStatus(sessionId, SessionStatus.ACTIVE);
            if (byTableOpt.isPresent()) return byTableOpt.get();
        } catch (NumberFormatException ignored) {}

        return null;
    }

    private RestaurantTableEntity resolveTableByToken(String token) {
        if (token == null || token.isBlank()) return null;
        String cleaned = token.replaceAll("(?i)^TOKEN_", "").trim();
        var byQrOpt = restaurantTableRepository.findByQrToken(cleaned);
        if (byQrOpt.isPresent()) return byQrOpt.get();

        try {
            Long tableId = Long.parseLong(cleaned);
            return restaurantTableRepository.findById(tableId).orElse(null);
        } catch (NumberFormatException ignored) {}

        return null;
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

        // Nếu xác nhận hoàn thành yêu cầu thanh toán bill -> đóng phiên và chuyển bàn sang EMPTY
        if (currentRequest.getRequestType() != null && currentRequest.getRequestType().name().contains("BILL")){
            tableSessionService.closeSession(currentRequest.getSessionId());
        } else {
            // Hoàn tất phục vụ -> Revert bàn về OCCUPIED
            if (currentRequest.getTableId() != null) {
                restaurantTableRepository.findById(currentRequest.getTableId()).ifPresent(table -> {
                    table.setTableStatus(TableStatus.OCCUPIED);
                    restaurantTableRepository.save(table);
                    eventPublisher.publishEvent(new TableStateChangeEvent(
                            this,
                            table.getTableId(),
                            table.getTableName(),
                            TableStatus.OCCUPIED
                    ));
                });
            }
        }

        webSocketPublisher.notifyServiceRequest(serviceRequestMapper.toServiceRequestResponse(currentRequest));
        return serviceRequestMapper.toServiceRequestResponse(currentRequest);
    }

    @Override
    @Transactional
    public ServiceRequestResponse undoRequest(Long requestId) {
        ServiceRequestEntity currentRequest = serviceRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Service request not found with id: " + requestId));

        currentRequest.setRequestStatus(RequestStatus.PENDING);
        currentRequest.setCompletedAt(null);
        serviceRequestRepository.save(currentRequest);

        if (currentRequest.getTableId() != null) {
            restaurantTableRepository.findById(currentRequest.getTableId()).ifPresent(table -> {
                String reqTypeName = currentRequest.getRequestType() != null ? currentRequest.getRequestType().name() : "";
                TableStatus targetStatus = (reqTypeName.contains("BILL") || reqTypeName.contains("PAYMENT"))
                        ? TableStatus.BILL_REQUESTED : TableStatus.CALLING_STAFF;

                table.setTableStatus(targetStatus);
                restaurantTableRepository.save(table);
                eventPublisher.publishEvent(new TableStateChangeEvent(
                        this,
                        table.getTableId(),
                        table.getTableName(),
                        targetStatus
                ));
            });
        }

        ServiceRequestResponse response = serviceRequestMapper.toServiceRequestResponse(currentRequest);
        webSocketPublisher.notifyServiceRequest(response);
        return response;
    }
}
