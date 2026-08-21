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
import org.springframework.cache.annotation.CacheEvict;
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
    @CacheEvict(value = "floor_map", allEntries = true)
    public ServiceRequestResponse createRequest(String sessionToken, CreateServiceRequestDto serviceRequestDto){
        log.info("Received service request: token={}, type={}", sessionToken, serviceRequestDto.getRequestType());

        // 1. Phân giải SessionToken / QRToken linh hoạt
        TableSessionEntity session = resolveTableSession(sessionToken);
        RestaurantTableEntity table = session != null ? session.getTable() : resolveTableByToken(sessionToken);

        if (table == null) {
            throw new ResourceNotFoundException("Không tìm thấy bàn phù hợp với token: " + sessionToken);
        }

        String actualSessionToken = session != null ? session.getSessionToken() : sessionToken;

        // 2. Khử trùng lặp: Nếu bàn này đã có Yêu cầu PENDING đang chờ -> Cập nhật loại yêu cầu & thời gian thay vì tạo ô lặp lại
        List<ServiceRequestEntity> existingPendingList = serviceRequestRepository.findAllByRequestStatus(RequestStatus.PENDING);
        ServiceRequestEntity serviceRequestEntity = existingPendingList.stream()
                .filter(r -> r.getTableId() != null && r.getTableId().equals(table.getTableId()))
                .findFirst()
                .orElse(null);

        if (serviceRequestEntity != null) {
            serviceRequestEntity.setRequestType(serviceRequestDto.getRequestType());
            serviceRequestEntity.setCreatedAt(new Date());
            serviceRequestEntity = serviceRequestRepository.save(serviceRequestEntity);
            log.info("Updated existing PENDING request for table {}: type={}", table.getTableId(), serviceRequestDto.getRequestType());
        } else {
            serviceRequestEntity = ServiceRequestEntity.builder()
                    .tableId(table.getTableId())
                    .tableName(table.getTableName())
                    .sessionId(actualSessionToken)
                    .requestType(serviceRequestDto.getRequestType())
                    .requestStatus(RequestStatus.PENDING)
                    .build();
            serviceRequestEntity = serviceRequestRepository.save(serviceRequestEntity);
            log.info("Created new PENDING request for table {}: type={}", table.getTableId(), serviceRequestDto.getRequestType());
        }

        ServiceRequestEntity saved = serviceRequestEntity;

        // 3. Cập nhật trạng thái bàn vật lý & phát sự kiện WebSocket Realtime
        String reqTypeName = serviceRequestDto.getRequestType() != null ? serviceRequestDto.getRequestType().name() : "";
        TableStatus targetStatus = (reqTypeName.contains("BILL") || reqTypeName.contains("PAYMENT"))
                ? TableStatus.BILL_REQUESTED : TableStatus.CALLING_STAFF;

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
    @CacheEvict(value = "floor_map", allEntries = true)
    //Nhân viên xác nhận xử lí xong yêu cầu
    public ServiceRequestResponse completedRequest(Long requestId){
        //Lấy request đang gửi đến chuyển thành completed
        ServiceRequestEntity currentRequest = serviceRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Service request not found with id: " + requestId));

        //Chuyển yêu cầu thành completed
        currentRequest.setRequestStatus(RequestStatus.COMPLETED);
        currentRequest.setCompletedAt(new Date());
        serviceRequestRepository.save(currentRequest);

        if (currentRequest.getTableId() != null) {
            Long tableId = currentRequest.getTableId();

            // Kiểm tra xem bàn còn các yêu cầu PENDING khác hay không
            List<ServiceRequestEntity> remainingPending = serviceRequestRepository
                    .findAllByRequestStatus(RequestStatus.PENDING)
                    .stream()
                    .filter(r -> r.getTableId() != null && r.getTableId().equals(tableId) && !r.getRequestId().equals(requestId))
                    .collect(Collectors.toList());

            TableStatus finalStatus;
            if (!remainingPending.isEmpty()) {
                boolean hasBill = remainingPending.stream().anyMatch(r ->
                        r.getRequestType() != null && (r.getRequestType().name().contains("BILL") || r.getRequestType().name().contains("PAYMENT")));
                finalStatus = hasBill ? TableStatus.BILL_REQUESTED : TableStatus.CALLING_STAFF;
            } else {
                // Nếu là hoàn tất Yêu cầu tính tiền -> Đóng phiên làm việc an toàn (Try-catch chống nổ ngoại lệ)
                if (currentRequest.getRequestType() != null && currentRequest.getRequestType().name().contains("BILL")){
                    try {
                        if (currentRequest.getSessionId() != null && !currentRequest.getSessionId().isBlank()) {
                            tableSessionService.closeSession(currentRequest.getSessionId());
                        }
                    } catch (Exception e) {
                        log.warn("Safe-handled exception closing session for request {}: {}", requestId, e.getMessage());
                    }
                }

                // Kiểm tra xem bàn có Session đang ACTIVE hay không để trả về đúng màu (Đang ăn / Trống)
                boolean hasActiveSession = tableSessionRepository
                        .findByTableTableIdAndStatus(tableId, SessionStatus.ACTIVE)
                        .isPresent();
                finalStatus = hasActiveSession ? TableStatus.OCCUPIED : TableStatus.EMPTY;
            }

            restaurantTableRepository.findById(tableId).ifPresent(table -> {
                table.setTableStatus(finalStatus);
                restaurantTableRepository.save(table);
                log.info("Reverted table {} ({}) status to {}", table.getTableId(), table.getTableName(), finalStatus);
                eventPublisher.publishEvent(new TableStateChangeEvent(
                        this,
                        table.getTableId(),
                        table.getTableName(),
                        finalStatus
                ));
            });
        }

        webSocketPublisher.notifyServiceRequest(serviceRequestMapper.toServiceRequestResponse(currentRequest));
        return serviceRequestMapper.toServiceRequestResponse(currentRequest);
    }

    @Override
    @Transactional
    @CacheEvict(value = "floor_map", allEntries = true)
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
