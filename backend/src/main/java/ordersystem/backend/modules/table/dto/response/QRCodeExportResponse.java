package ordersystem.backend.modules.table.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.http.MediaType;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QRCodeExportResponse {
    private byte[] data;
    private String fileName;
    private MediaType mediaType;
}