package ordersystem.backend.modules.table.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

/**
 * DTO Yêu cầu Gộp nhiều bàn nguồn thành 1 bàn đích chính.
 */
@Getter
@Setter
public class TableMergeRequest {

    /**
     * Danh sách các ID Bàn Nguồn cần gộp vào.
     */
    @NotEmpty(message = "Danh sách bàn nguồn không được rỗng")
    private List<Long> sourceTableIds;

    /**
     * ID của Bàn Đích chính sẽ nhận toàn bộ hóa đơn gộp.
     */
    @NotNull(message = "ID bàn đích chính không được để trống")
    private Long targetTableId;
}
