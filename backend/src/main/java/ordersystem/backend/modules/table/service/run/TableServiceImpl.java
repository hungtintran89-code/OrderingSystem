package ordersystem.backend.modules.table.service.run;

import ordersystem.backend.common.exception.ResourceNotFoundException;
import ordersystem.backend.modules.catalog.dto.response.CategoryMenuResponse;
import ordersystem.backend.modules.catalog.mapper.CatalogMapper;
import ordersystem.backend.modules.catalog.repository.CategoryRepository;
import ordersystem.backend.modules.table.dto.response.QRCodeExportResponse;
import ordersystem.backend.modules.table.enums.QRFormat;
import ordersystem.backend.modules.table.enums.SessionStatus;
import ordersystem.backend.modules.table.enums.TableStatus;
import ordersystem.backend.modules.table.exception.TableException;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import ordersystem.backend.modules.table.dto.request.CreateTableRequest;
import ordersystem.backend.modules.table.dto.request.UpdateTableRequest;
import ordersystem.backend.modules.table.dto.response.FloorMapResponse;
import ordersystem.backend.modules.table.dto.response.QRResolveResponse;
import ordersystem.backend.modules.table.dto.response.TableResponse;
import ordersystem.backend.modules.table.entity.RestaurantTableEntity;
import ordersystem.backend.modules.table.entity.TableSessionEntity;
import ordersystem.backend.modules.table.mapper.RestaurantTableMapper;
import ordersystem.backend.modules.table.mapper.TableSessionMapper;
import ordersystem.backend.modules.table.repository.RestaurantTableRepository;
import ordersystem.backend.modules.table.repository.TableSessionRepository;
import ordersystem.backend.modules.table.service.generator.QRCodeGeneratorService;
import ordersystem.backend.modules.table.service.impl.TableService;
import ordersystem.backend.modules.table.service.impl.TableSessionService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;

import ordersystem.backend.modules.table.dto.request.TableCheckoutRequest;

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
    private final CategoryRepository categoryRepository ;
    private final CatalogMapper catalogMapper ;

    @Value("${app.qr.base-url:http://localhost:8080/api/v1/qr/resolve/}")
    private String qrBaseUrl;


    private String normalizeTableName(String input) {
        if (input == null || input.isBlank()) return "Bàn 01";
        String trimmed = input.trim();
        String lower = trimmed.toLowerCase();
        if (lower.startsWith("bàn ") || lower.startsWith("ban ")) {
            return "Bàn " + trimmed.substring(4).trim();
        }
        return "Bàn " + trimmed;
    }

    @Override
    @Transactional
    @CacheEvict(value = "floor_map", allEntries = true)
    public TableResponse createTable(CreateTableRequest request){
        String normalizedName = normalizeTableName(request.getTableName());

        // Bước 1: Kiểm tra tên bàn đã tồn tại chưa để tránh trùng lặp
        if (restaurantTableRepository.existsByTableName(normalizedName)){
            throw new IllegalArgumentException("Bàn " + normalizedName + " đã tồn tại trong hệ thống. Vui lòng chọn tên khác!");
        }

        // Bước 2: Sinh mã băm ngẫu nhiên duy nhất cho QR Token & sinh ảnh QR Base64 bằng Google ZXing
        String qrToken = "qr_tok_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        String qrUrl = qrBaseUrl + qrToken;
        String qrImageBase64 = qrCodeGeneratorService.generateQrBase64(qrUrl);

        String zoneStr = request.getZone() != null && !request.getZone().isBlank() ? request.getZone().trim() : "Tầng 1";
        Integer capNum = request.getCapacity() != null && request.getCapacity() > 0 ? request.getCapacity() : 4;

        //Bước 3: Tạo và lưu Entity Bàn kèm mã QR Code vào CSDL PostgreSQL
        RestaurantTableEntity tableInfo = RestaurantTableEntity.builder()
                .tableName(normalizedName)
                .qrToken(qrToken)
                .qrUrl(qrUrl)
                .qrImageBase64(qrImageBase64)
                .zone(zoneStr)
                .capacity(capNum)
                .tableStatus(TableStatus.EMPTY)
                .build();
        RestaurantTableEntity savedTable = restaurantTableRepository.save(tableInfo);
        //Convert sang DTO response trả về cho controller
        return restaurantTableMapper.toTableResponse(savedTable);
    }

    @Override
    @Transactional
    @CacheEvict(value = "floor_map", allEntries = true)
    public TableResponse updateTable(Long tableId, UpdateTableRequest request) {
        RestaurantTableEntity tableInfo = restaurantTableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bàn ăn với ID: " + tableId));

        String normalizedName = normalizeTableName(request.getTableName());

        if (restaurantTableRepository.existsByTableNameAndTableIdNot(normalizedName, tableId)) {
            throw new IllegalArgumentException("Tên bàn " + normalizedName + " đã tồn tại ở bàn khác. Vui lòng chọn tên khác!");
        }

        tableInfo.setTableName(normalizedName);
        if (request.getZone() != null && !request.getZone().isBlank()) {
            tableInfo.setZone(request.getZone().trim());
        }
        if (request.getCapacity() != null && request.getCapacity() > 0) {
            tableInfo.setCapacity(request.getCapacity());
        }

        if (Boolean.TRUE.equals(request.getRegenerateQr()) || tableInfo.getQrImageBase64() == null || tableInfo.getQrImageBase64().isBlank()) {
            String qrToken = "qr_tok_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
            String qrUrl = qrBaseUrl + qrToken;
            String qrImageBase64 = qrCodeGeneratorService.generateQrBase64(qrUrl);

            tableInfo.setQrToken(qrToken);
            tableInfo.setQrUrl(qrUrl);
            tableInfo.setQrImageBase64(qrImageBase64);
        }

        RestaurantTableEntity updated = restaurantTableRepository.save(tableInfo);
        return restaurantTableMapper.toTableResponse(updated);
    }

    @Override
    @Transactional
    @CacheEvict(value = "floor_map", allEntries = true)
    public void deleteTable(Long tableId) {
        RestaurantTableEntity tableInfo = restaurantTableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bàn ăn với ID: " + tableId));
        restaurantTableRepository.delete(tableInfo);
    }

    @Override
    @Transactional
    public List<CategoryMenuResponse> resolveQrtoken(String qrToken , Long clientThreadId ){

        // Bước 1: Tra cứu bàn trong DB theo qrToken
        RestaurantTableEntity tableInfo = restaurantTableRepository.findByQrToken(qrToken)
        .orElseThrow( () -> new TableException("QR Code not valid or not exist"));

        // Bước 2: Nếu Client đã có threadId cũ gửi lên thì giữ nguyên, nếu chưa có mới tự sinh
        Long finalThreadId = (clientThreadId != null)
                ? clientThreadId
                : (System.currentTimeMillis() % 1000000L + (long)(Math.random() * 1000));

        return categoryRepository.findAllWithProducts().stream()
                .map( catalogMapper ::toCategoryMenuResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public QRResolveResponse getTableInfoByQrToken(String qrToken) {
        if (qrToken == null || qrToken.isBlank()) {
            throw new TableException("Mã QR token không được để trống");
        }

        String cleanToken = qrToken.trim();
        if (cleanToken.contains("/")) {
            cleanToken = cleanToken.substring(cleanToken.lastIndexOf("/") + 1);
        }
        if (cleanToken.contains("?")) {
            cleanToken = cleanToken.split("\\?")[0];
        }

        final String targetToken = cleanToken;
        RestaurantTableEntity tableInfo = restaurantTableRepository.findByQrToken(targetToken)
                .orElseGet(() -> {
                    try {
                        String numStr = targetToken.replaceAll("[^0-9]", "");
                        if (!numStr.isEmpty()) {
                            Long id = Long.parseLong(numStr);
                            return restaurantTableRepository.findByTableId(id).orElse(null);
                        }
                    } catch (Exception e) {}
                    return null;
                });

        if (tableInfo == null && ("default".equalsIgnoreCase(targetToken) || "first".equalsIgnoreCase(targetToken))) {
            tableInfo = restaurantTableRepository.findAllByIsActiveTrueOrderByTableIdAsc().stream().findFirst().orElse(null);
        }

        if (tableInfo == null) {
            throw new TableException("Mã QR bàn không tồn tại trong hệ thống nhà hàng (Token: " + qrToken + ")");
        }

        TableSessionEntity activeSession = tableSessionRepository
                .findByTableTableIdAndStatus(tableInfo.getTableId(), SessionStatus.ACTIVE)
                .orElse(null);

        return QRResolveResponse.builder()
                .tableId(tableInfo.getTableId())
                .tableName(tableInfo.getTableName())
                .sessionId(activeSession != null ? activeSession.getTableSessionId() : null)
                .sessionStatus(activeSession != null ? activeSession.getStatus().name() : "EMPTY")
                .generatedThreadId(System.currentTimeMillis() % 1000000L)
                .build();
    }


    @Override
    @Transactional( readOnly = true )
    public QRCodeExportResponse exportTableQrCode(Long tableId, QRFormat qrFormat){
        //Tìm kiếm bàn theo id
        RestaurantTableEntity tableInfo = restaurantTableRepository.findById(tableId)
                .orElseThrow( () -> new TableException("Table not found with id: " + tableId));

        //Điều phối sinh ra file (PNG hoặc PDF) qua generator
        return qrCodeGeneratorService.generate(tableInfo.getTableName(), tableInfo.getQrUrl(), qrFormat);
    }

    @Override
    @Transactional
    @CacheEvict(value = "floor_map", allEntries = true)
    public void checkoutAndClearTable(Long tableId, TableCheckoutRequest request) {
        RestaurantTableEntity tableInfo = restaurantTableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bàn ăn với ID: " + tableId));

        Optional<TableSessionEntity> activeSessionOpt = tableSessionRepository.findByTableTableIdAndStatus(tableId, SessionStatus.ACTIVE);
        if (activeSessionOpt.isPresent()) {
            tableSessionService.closeSessionEntity(activeSessionOpt.get());
        } else {
            tableInfo.setTableStatus(TableStatus.EMPTY);
            restaurantTableRepository.save(tableInfo);
        }
    }
}
