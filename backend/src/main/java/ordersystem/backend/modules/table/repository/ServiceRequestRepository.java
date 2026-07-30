package ordersystem.backend.modules.table.repository;

import ordersystem.backend.modules.table.entity.ServiceRequestEntity;
import ordersystem.backend.modules.table.enums.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServiceRequestRepository extends JpaRepository<Long, ServiceRequestEntity> {

    //Lấy các yêu cầu đang pending
    List<ServiceRequestEntity> findAllByStatus(RequestStatus requestStatus);

    //
}
