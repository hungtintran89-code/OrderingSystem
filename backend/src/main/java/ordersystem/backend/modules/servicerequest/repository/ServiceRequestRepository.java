package ordersystem.backend.modules.servicerequest.repository;

import ordersystem.backend.modules.servicerequest.entity.ServiceRequestEntity;
import ordersystem.backend.modules.servicerequest.enums.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServiceRequestRepository extends JpaRepository<ServiceRequestEntity , Long> {

    //Lấy các yêu cầu đang pending
    List<ServiceRequestEntity> findAllByRequestStatus(RequestStatus status);

    //Lấy yêu cầu hiện tại theo id
    ServiceRequestEntity findByRequestId(Long requestId);
}
