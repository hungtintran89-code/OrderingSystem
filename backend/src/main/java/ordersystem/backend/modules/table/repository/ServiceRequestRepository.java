package ordersystem.backend.modules.table.repository;

import ordersystem.backend.modules.table.dto.response.ServiceRequestResponse;
import ordersystem.backend.modules.table.entity.ServiceRequestEntity;
import ordersystem.backend.modules.table.enums.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServiceRequestRepository extends JpaRepository<ServiceRequestEntity , Long> {

    //Lấy các yêu cầu đang pending
    List<ServiceRequestEntity> findAllByRequestStatus(RequestStatus status);

    //Lấy yêu cầu hiện tại theo id
    ServiceRequestEntity findByRequestId(Long requestId);
}
