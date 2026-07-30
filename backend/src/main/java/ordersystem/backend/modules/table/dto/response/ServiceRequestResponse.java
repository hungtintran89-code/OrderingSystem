package ordersystem.backend.modules.table.dto.response;

import lombok.*;
import ordersystem.backend.modules.table.enums.RequestStatus;
import ordersystem.backend.modules.table.enums.RequestType;

import java.time.LocalDateTime;
import java.util.Date;

@Setter @Getter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ServiceRequestResponse {
    private Long requestId;
    private Long tableId;
    private String tableName;
    private RequestType requestType;
    private RequestStatus requestStatus;
    private Date createdAt;
    private Date completedAt;
}
