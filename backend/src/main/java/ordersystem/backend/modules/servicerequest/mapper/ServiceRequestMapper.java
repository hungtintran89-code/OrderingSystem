package ordersystem.backend.modules.servicerequest.mapper;

import ordersystem.backend.modules.servicerequest.dto.response.ServiceRequestResponse;
import ordersystem.backend.modules.servicerequest.entity.ServiceRequestEntity;
import org.springframework.stereotype.Component;

@Component
public class ServiceRequestMapper {

    public ServiceRequestResponse toServiceRequestResponse(ServiceRequestEntity serviceRequestEntity){
        if (serviceRequestEntity == null){
            return null;
        }

        return ServiceRequestResponse.builder()
                .requestId(serviceRequestEntity.getRequestId())
                .tableId(serviceRequestEntity.getTableId())
                .tableName(serviceRequestEntity.getTableName())
                .requestType(serviceRequestEntity.getRequestType())
                .requestStatus(serviceRequestEntity.getRequestStatus())
                .createdAt(serviceRequestEntity.getCreatedAt())
                .completedAt(serviceRequestEntity.getCompletedAt())
                .build();
    }

}
