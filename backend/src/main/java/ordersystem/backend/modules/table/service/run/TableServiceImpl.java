package ordersystem.backend.modules.table.service.run;

import ordersystem.backend.modules.table.dto.response.QRCodeExportResponse;
import ordersystem.backend.modules.table.enums.QRFormat;
import ordersystem.backend.modules.table.enums.SessionStatus;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import ordersystem.backend.modules.table.dto.request.CreateTableRequest;
import ordersystem.backend.modules.table.dto.response.FloorMapResponse;
import ordersystem.backend.modules.table.dto.response.QRResolveResponse;
import ordersystem.backend.modules.table.dto.response.TableResponse;
import ordersystem.backend.modules.table.entity.RestaurantTable;
import ordersystem.backend.modules.table.entity.TableSession;
import ordersystem.backend.modules.table.mapper.RestaurantTableMapper;
import ordersystem.backend.modules.table.mapper.TableSessionMapper;
import ordersystem.backend.modules.table.repository.RestaurantTableRepository;
import ordersystem.backend.modules.table.repository.TableSessionRepository;
import ordersystem.backend.modules.table.service.genetor.QRCodeGeneratorService;
import ordersystem.backend.modules.table.service.impl.TableService;
import ordersystem.backend.modules.table.service.impl.TableSessionService;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TableServiceImpl implements TableService {
    private final RestaurantTableRepository restaurantTableRepository;
    private final TableSessionRepository tableSessionRepository;
    private final TableSessionService tableSessionService;
    private final QRCodeGeneratorService qrCodeGeneratorService;
    private final RestaurantTableMapper restaurantTableMapper;
    private final TableSessionMapper tableSessionMapper;

    @Override
    @Transactional
    public TableResponse createTable(CreateTableRequest request){
        // Bước 1: Kiểm tra tên bàn đã tồn tại chưa để tránh trùng lặp
        if (restaurantTableRepository.existsByTableName(request.getTableName())){
            throw new IllegalArgumentException("Table name " + request.getTableName() + "already exists in the system");
        }

        // Bước 2: Sinh mã băm ngẫu nhiên duy nhất cho QR Token
        String qrToken = "qr_tok_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        String qrUrl = "https://{urlRestaurant.com}/qr/resolve/" + qrToken;

        //Bước 3: Tạo và lưu Entity Bàn mới vào Database
        RestaurantTable tableInfo = RestaurantTable.builder()
                .tableName(request.getTableName())
                .qrToken(qrToken)
                .qrUrl(qrUrl)
                .build();
        RestaurantTable savedTable = restaurantTableRepository.save(tableInfo);

        //Convert sang DTO response trả về cho controller
        return restaurantTableMapper.toTableResponse(savedTable);
    }

    @Override
    @Transactional
    public QRResolveResponse resolveQrtoken(String qrToken){
        // Bước 1: Tra cứu bàn trong DB theo qrToken
        RestaurantTable tableInfo = restaurantTableRepository.findByQrToken(qrToken)
        .orElseThrow( () -> new RuntimeException("QR Code not valid or not exist"));

        //Bước 2: Lấy Session đang ACTIVE hoặc khởi tạo Session mới nếu bàn trống
        TableSession tableSession = tableSessionService.getOrCreatActiveSession(tableInfo.getTableId());

        //Đóng gói dữ liệu trả về cho controller
        return tableSessionMapper.toQRResolveResponse(tableSession, tableInfo);
    }


    @Override
    @Transactional(readOnly = true)
    public List<FloorMapResponse> getLiveFloorMap(){
        // Bước 1: Lấy tất cả danh sách các bàn đang hoạt động
        List<RestaurantTable> tablesIsActive = restaurantTableRepository.findAllByIsActiveTrue();

        //Nếu danh sách là null thì trả về danh sách rỗng
        if (tablesIsActive.isEmpty()){
            return Collections.emptyList();
        }

        // 2. Lấy TẤT CẢ các Session đang ACTIVE trong 1 Query duy nhất (Query 2 - Giải quyết N+1)
        Optional<TableSession> activeSessionTables = tableSessionRepository.findAllByStatus(SessionStatus.ACTIVE);

        // Gom nhóm Session theo tableId bằng Map để tra cứu O(1)
        Map<Long, TableSession> tableSessionMap = activeSessionTables.stream()
                .collect(Collectors.toMap(
                        session -> session.getTable().getTableId(), // 👈 Dùng Lambda ở đây
                        session -> session,                         // Hoặc có thể dùng Function.identity()
                        (s1, s2) -> s1
                ));
        return Collections.emptyList();
    }

    @Override
    public QRCodeExportResponse exportTableQrCode(Long tableId, QRFormat qrFormat){
        return null;
    }


}
