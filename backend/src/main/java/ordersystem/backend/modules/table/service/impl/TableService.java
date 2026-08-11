package ordersystem.backend.modules.table.service.impl;

import ordersystem.backend.modules.catalog.dto.response.CategoryMenuResponse;
import ordersystem.backend.modules.table.dto.request.CreateTableRequest;
import ordersystem.backend.modules.table.dto.response.FloorMapResponse;
import ordersystem.backend.modules.table.dto.response.QRCodeExportResponse;
import ordersystem.backend.modules.table.dto.response.QRResolveResponse;
import ordersystem.backend.modules.table.dto.response.TableResponse;
import ordersystem.backend.modules.table.enums.QRFormat;

import ordersystem.backend.modules.table.dto.request.TableCheckoutRequest;
import ordersystem.backend.modules.table.dto.request.UpdateTableRequest;

import java.util.List;

public interface TableService {
    TableResponse createTable(CreateTableRequest request);
    TableResponse updateTable(Long tableId, UpdateTableRequest request);
    void deleteTable(Long tableId);
    List<CategoryMenuResponse> resolveQrtoken(String qrToken , Long threadId );
    QRResolveResponse getTableInfoByQrToken(String qrToken);
    QRCodeExportResponse exportTableQrCode(Long tableId, QRFormat qrFormat);
    void checkoutAndClearTable(Long tableId, TableCheckoutRequest request);
}
