package ordersystem.backend.modules.table.repository;

import ordersystem.backend.modules.table.entity.TableZoneEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TableZoneRepository extends JpaRepository<TableZoneEntity, Long> {
    List<TableZoneEntity> findAllByOrderByDisplayOrderAscZoneIdAsc();
    Optional<TableZoneEntity> findByZoneName(String zoneName);
    boolean existsByZoneName(String zoneName);
    boolean existsByZoneNameAndZoneIdNot(String zoneName, Long zoneId);
}
