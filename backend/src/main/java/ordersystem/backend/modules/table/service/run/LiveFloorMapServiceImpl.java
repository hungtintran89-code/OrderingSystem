package ordersystem.backend.modules.table.service.run;

import lombok.RequiredArgsConstructor;
import ordersystem.backend.modules.table.dto.response.FloorMapResponse;
import ordersystem.backend.modules.table.entity.RestaurantTableEntity;
import ordersystem.backend.modules.table.entity.ServiceRequestEntity;
import ordersystem.backend.modules.table.entity.TableSessionEntity;
import ordersystem.backend.modules.table.enums.SessionStatus;
import ordersystem.backend.modules.table.enums.TableStatus;
import ordersystem.backend.modules.table.repository.RestaurantTableRepository;
import ordersystem.backend.modules.table.repository.TableSessionRepository;
import ordersystem.backend.modules.table.service.impl.LiveFloorMapService;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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
        // Bước 1: Lấy tất cả danh sách các bàn đang hoạt động
        List<RestaurantTableEntity> tablesIsActive = restaurantTableRepository.findAllByIsActiveTrue();

        //Nếu danh sách là null thì trả về danh sách rỗng
        if (tablesIsActive.isEmpty()) {
            return Collections.emptyList();
        }

        // 2. Lấy TẤT CẢ các Session đang ACTIVE trong 1 Query duy nhất (Query 2 - Giải quyết N+1)
        Optional<TableSessionEntity> activeSessionTables = tableSessionRepository.findAllByStatus(SessionStatus.ACTIVE);

        // Gom nhóm Session theo tableId bằng Map để tra cứu O(1)
        Map<Long, TableSessionEntity> tableSessionMap = activeSessionTables.stream()
                .collect(Collectors.toMap(
                        session -> session.getTable().getTableId(), // 👈 Dùng Lambda ở đây
                        session -> session,                         // Hoặc có thể dùng Function.identity()
                        (s1, s2) -> s1 //Merge Function (Xử lý trùng Key), giữ lại session cũ khi có session trùng
                ));

        Date timeNow = new Date();

        //Tạo luồng stream xác định trạng thái bàn
        return activeSessionTables.stream()
                .map( table -> {
                    TableSessionEntity session = tableSessionMap.get(table.getTable().getTableId());

                    //TH1: Không có session active --> BÀN TRỐNG (EMPTY)
                    if (session == null){
                        return FloorMapResponse.builder()
                                .tableId(table.getTable().getTableId())
                                .tableName(table.getTableName())
                                .status(TableStatus.EMPTY)
                                .tempTotalAmount(0.0)
                                .build();
                    }

                    //TH2: Có session đang hoạt động --> Có khách đang ngồi
                    Double tempTotalAmount = 150000.0; //Sẽ tiêm order vào để tính tổng tiền tạm thòi

                    return FloorMapResponse.builder()
                            .tableId(table.getTable().getTableId())
                            .tableName(table.getTableName())
                            .status(TableStatus.OCCUPIED)
                            .tempTotalAmount(tempTotalAmount)
                            .build();

                }).collect(Collectors.toList());
    }
}
