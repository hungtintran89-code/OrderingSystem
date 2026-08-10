package ordersystem.backend.modules.table.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

/**
 * DTO Yêu cầu Chuyển toàn bộ món từ Bàn Nguồn sang Bàn Đích.
 */
@Getter
@Setter
public class TableTransferRequest {

    /**
     * ID của Bàn Nguồn (Bàn đang có khách cần chuyển đi).
     */
    @NotNull(message = "ID bàn nguồn không được để trống")
    private Long sourceTableId;

    /**
     * ID của Bàn Đích (Bàn mới khách chuyển đến).
     */
    @NotNull(message = "ID bàn đích không được để trống")
    private Long targetTableId;
}
