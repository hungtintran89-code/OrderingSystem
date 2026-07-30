package ordersystem.backend.modules.table.service.impl;

import ordersystem.backend.modules.table.dto.request.CreateTableRequest;
import ordersystem.backend.modules.table.dto.response.FloorMapResponse;
import ordersystem.backend.modules.table.dto.response.QRCodeExportResponse;
import ordersystem.backend.modules.table.dto.response.QRResolveResponse;
import ordersystem.backend.modules.table.dto.response.TableResponse;
import ordersystem.backend.modules.table.enums.QRFormat;

import java.util.List;

public interface TableService {
    public TableResponse createTable(CreateTableRequest request);
    public QRResolveResponse resolveQrtoken(String qrToken);
//    public byte[] generateTableQrCode(Long tableId);
    public QRCodeExportResponse exportTableQrCode(Long tableId, QRFormat qrFormat);
}
