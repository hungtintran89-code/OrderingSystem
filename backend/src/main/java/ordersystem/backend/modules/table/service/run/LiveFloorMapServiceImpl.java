package ordersystem.backend.modules.table.service.run;

import lombok.RequiredArgsConstructor;
import ordersystem.backend.modules.order.entity.OrderEntity;
import ordersystem.backend.modules.order.enums.OrderStatus;
import ordersystem.backend.modules.order.repository.OrderRepository;
import ordersystem.backend.modules.servicerequest.entity.ServiceRequestEntity;
import ordersystem.backend.modules.servicerequest.enums.RequestStatus;
import ordersystem.backend.modules.servicerequest.repository.ServiceRequestRepository;
import ordersystem.backend.modules.table.dto.response.FloorMapResponse;
import ordersystem.backend.modules.table.entity.RestaurantTableEntity;
import ordersystem.backend.modules.table.entity.TableSessionEntity;
import ordersystem.backend.modules.table.enums.SessionStatus;
import ordersystem.backend.modules.table.enums.TableStatus;
import ordersystem.backend.modules.table.repository.RestaurantTableRepository;
import ordersystem.backend.modules.table.repository.TableSessionRepository;
import ordersystem.backend.modules.table.service.impl.LiveFloorMapService;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class LiveFloorMapServiceImpl implements LiveFloorMapService {

    private final RestaurantTableRepository restaurantTableRepository;
    private final TableSessionRepository tableSessionRepository;
    private final OrderRepository orderRepository;
    private final ServiceRequestRepository serviceRequestRepository;

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "floor_map", key = "'all_tables'")
    public List<FloorMapResponse> getLiveFloorMap() {
        // Bước 1: Lấy tất cả danh sách các bàn trong nhà hàng theo thứ tự ID tăng dần cố định
        List<RestaurantTableEntity> tablesInRestaurant = restaurantTableRepository.findAllByIsActiveTrueOrderByTableIdAsc();

        //Nếu danh sách là null thì trả về danh sách rỗng
        if (tablesInRestaurant.isEmpty()) {
            return Collections.emptyList();
        }

        // Tra cứu tất cả các Service Request đang ở trạng thái PENDING
        List<ServiceRequestEntity> pendingRequests = serviceRequestRepository.findAllByRequestStatus(RequestStatus.PENDING);
        Map<Long, TableStatus> pendingStatusMap = new HashMap<>();
        for (ServiceRequestEntity req : pendingRequests) {
            if (req.getTableId() != null) {
                String reqType = req.getRequestType() != null ? req.getRequestType().name() : "";
                TableStatus newStatus = (reqType.contains("BILL") || reqType.contains("PAYMENT"))
                        ? TableStatus.BILL_REQUESTED : TableStatus.CALLING_STAFF;

                // Quy tắc ưu tiên cao nhất: BILL_REQUESTED (Đỏ 🔴) > CALLING_STAFF (Vàng 🟡)
                TableStatus currentStatus = pendingStatusMap.get(req.getTableId());
                if (currentStatus != TableStatus.BILL_REQUESTED) {
                    pendingStatusMap.put(req.getTableId(), newStatus);
                }
            }
        }

        // 2. Lấy TẤT CẢ các SESSION đang ACTIVE trong 1 Query duy nhất (Query 2 - Giải quyết N+1 )
        List<TableSessionEntity> activeSessionTables = tableSessionRepository.findAllByStatus(SessionStatus.ACTIVE);

        // Gom nhóm Session theo tableId bằng Map để tra cứu O(1)
        Map<Long, TableSessionEntity> tableSessionMap = activeSessionTables.stream()
                .collect(Collectors.toMap(
                        session -> session.getTable().getTableId(),
                        session -> session,
                        (s1, s2) -> s1
                ));


        // add : Lấy danh sách sessionId đang active
        List<Long> activeSessionIds = activeSessionTables.stream()
                .map(TableSessionEntity::getTableSessionId)
                .collect(Collectors.toList());


        // add : Truy vấn tổng tiền theo sessionId (tính tất cả các đơn chưa bị CANCELLED)
        Map<Long, Long> sessionTotalAmountMap = new HashMap<>();
        if (!activeSessionIds.isEmpty()) {
            List<OrderEntity> orders = orderRepository.findByTableSessionTableSessionIdInAndStatusNot(
                    activeSessionIds, OrderStatus.CANCELLED);
            for (OrderEntity order : orders) {
                Long sessionId = order.getTableSession().getTableSessionId();
                Long amt = 0L;
                if (order.getItems() != null && !order.getItems().isEmpty()) {
                    amt = order.getItems().stream()
                            .mapToLong(item -> item.getTotalPrice() != null ? item.getTotalPrice() : 0L)
                            .sum();
                } else if (order.getTotalAmount() != null) {
                    amt = order.getTotalAmount();
                }
                sessionTotalAmountMap.put(sessionId,
                        sessionTotalAmountMap.getOrDefault(sessionId, 0L) + amt);
            }
        }

        // 3. Map danh sách Bàn ra FloorMapResponse DTO trả về cho Controller
        return tablesInRestaurant.stream().map(table -> {
            TableSessionEntity session = tableSessionMap.get(table.getTableId());
            boolean isOccupied = (session != null);
            Double tempAmount = isOccupied ? sessionTotalAmountMap.getOrDefault(session.getTableSessionId(), 0L).doubleValue() : 0.0;
            
            // Ưu tiên cao nhất: Nếu bàn có Service Request PENDING chưa confirm -> BẮT BUỘC giữ màu Vàng / Đỏ liên tục
            TableStatus effectiveStatus = pendingStatusMap.get(table.getTableId());
            if (effectiveStatus == null) {
                effectiveStatus = table.getTableStatus();
            }
            if (effectiveStatus == TableStatus.CALLING_STAFF || effectiveStatus == TableStatus.BILL_REQUESTED) {
                // Giữ nguyên trạng thái ưu tiên hiển thị cảnh báo
            } else {
                effectiveStatus = isOccupied ? TableStatus.OCCUPIED : TableStatus.EMPTY;
            }

            return FloorMapResponse.builder()
                    .tableId(table.getTableId())
                    .tableName(table.getTableName())
                    .status(effectiveStatus)
                    .tempTotalAmount(tempAmount)
                    .qrUrl(table.getQrUrl())
                    .qrImageBase64(table.getQrImageBase64())
                    .qrToken(table.getQrToken())
                    .zone(table.getZone() != null ? table.getZone() : "Tầng 1")
                    .capacity(table.getCapacity() != null ? table.getCapacity() : 4)
                    .build();
        }).collect(Collectors.toList());
    }
}
