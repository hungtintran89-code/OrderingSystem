package ordersystem.backend.modules.table.service.run;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import ordersystem.backend.modules.table.dto.request.CreateTableRequest;
import ordersystem.backend.modules.table.dto.response.QRResolveResponse;
import ordersystem.backend.modules.table.dto.response.TableResponse;
import ordersystem.backend.modules.table.entity.RestaurantTable;
import ordersystem.backend.modules.table.entity.TableSession;
import ordersystem.backend.modules.table.mapper.RestaurantTableMapper;
import ordersystem.backend.modules.table.mapper.TableSessionMapper;
import ordersystem.backend.modules.table.repository.TableRepository;
import ordersystem.backend.modules.table.repository.TableSessionRepository;
import ordersystem.backend.modules.table.service.genetor.QRCodeGeneratorService;
import ordersystem.backend.modules.table.service.impl.TableService;
import ordersystem.backend.modules.table.service.impl.TableSessionService;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TableServiceImpl implements TableService {
    private final TableRepository tableRepository;
    private final TableSessionRepository tableSessionRepository;
    private final TableSessionService tableSessionService;
    private final QRCodeGeneratorService qrCodeGeneratorService;
    private final RestaurantTableMapper restaurantTableMapper;
    private final TableSessionMapper tableSessionMapper;

    @Override
    @Transactional
    public TableResponse createTable(CreateTableRequest request){
        // Bước 1: Kiểm tra tên bàn đã tồn tại chưa để tránh trùng lặp
        if (tableRepository.existsByTableName(request.getTableName())){
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
        RestaurantTable savedTable = tableRepository.save(tableInfo);

        //Convert sang DTO response trả về cho controller
        return restaurantTableMapper.toTableResponse(savedTable);
    }

    @Override
    @Transactional
    public QRResolveResponse resolveQrtoken(String qrToken){
        // Bước 1: Tra cứu bàn trong DB theo qrToken
        RestaurantTable tableInfo = tableRepository.findByQrToken(qrToken)
        .orElseThrow( () -> new RuntimeException("QR Code not valid or not exist"));

        //Bước 2: Lấy Session đang ACTIVE hoặc khởi tạo Session mới nếu bàn trống
        TableSession tableSession = tableSessionService.getOrCreatActiveSession(tableInfo.getTableId());

        //Đóng gói dữ liệu trả về cho controller
        return tableSessionMapper.toQRResolveResponse(tableSession, tableInfo);
    }


}
