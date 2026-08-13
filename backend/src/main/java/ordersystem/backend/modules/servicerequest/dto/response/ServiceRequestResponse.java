package ordersystem.backend.modules.servicerequest.dto.response;

import lombok.*;
import ordersystem.backend.modules.servicerequest.enums.RequestStatus;
import ordersystem.backend.modules.servicerequest.enums.RequestType;

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
