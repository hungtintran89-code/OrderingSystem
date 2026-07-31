package ordersystem.backend.modules.table.service.run;

import lombok.RequiredArgsConstructor;
import ordersystem.backend.modules.table.dto.response.FloorMapResponse;
import ordersystem.backend.modules.table.entity.RestaurantTableEntity;
import ordersystem.backend.modules.table.entity.TableSessionEntity;
import ordersystem.backend.modules.table.enums.SessionStatus;
import ordersystem.backend.modules.table.enums.TableStatus;
import ordersystem.backend.modules.table.repository.RestaurantTableRepository;
import ordersystem.backend.modules.table.repository.TableSessionRepository;
import ordersystem.backend.modules.table.service.impl.LiveFloorMapService;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class LiveFloorMapServiceImpl implements LiveFloorMapService {

    private final RestaurantTableRepository restaurantTableRepository;
    private final TableSessionRepository tableSessionRepository;

    @Override
    @Transactional(readOnly = true)
    public List<FloorMapResponse> getLiveFloorMap() {
        // Bước 1: Lấy tất cả danh sách các bàn trong nhà hàng
        List<RestaurantTableEntity> tablesInRestaurant = restaurantTableRepository.findAllByIsActiveTrue();

        //Nếu danh sách là null thì trả về danh sách rỗng
        if (tablesInRestaurant.isEmpty()) {
            return Collections.emptyList();
        }

        // 2. Lấy TẤT CẢ các SESSION đang ACTIVE trong 1 Query duy nhất (Query 2 - Giải quyết N+1)
        List<TableSessionEntity> activeSessionTables = tableSessionRepository.findAllByStatus(SessionStatus.ACTIVE);

        // Gom nhóm Session theo tableId bằng Map để tra cứu O(1)
        Map<Long, TableSessionEntity> tableSessionMap = activeSessionTables.stream()
                .collect(Collectors.toMap(
                        session -> session.getTable().getTableId(), // 👈 Dùng Lambda ở đây
                        session -> session,                         // Hoặc có thể dùng Function.identity()
                        (s1, s2) -> s1 //Merge Function (Xử lý trùng Key), giữ lại session cũ khi có session trùng
                ));


        // 3. Map danh sách Bàn ra FloorMapResponse DTO trả về cho Controller
        return tablesInRestaurant.stream().map(table -> {
            TableSessionEntity session = tableSessionMap.get(table.getTableId());
            // Nếu bàn có Session ACTIVE -> OCCUPIED (Màu đỏ), Không có -> EMPTY (Màu xanh)
            TableStatus currentStatus = (session != null) ? TableStatus.OCCUPIED : TableStatus.EMPTY;
            return FloorMapResponse.builder()
                    .tableId(table.getTableId())
                    .tableName(table.getTableName())
                    .status(currentStatus)
                    .tempTotalAmount(0.0) // Tổng tiền tạm tính
                    .build();
        }).collect(Collectors.toList());
    }
}
