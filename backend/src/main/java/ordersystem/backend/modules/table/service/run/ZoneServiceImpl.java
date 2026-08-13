package ordersystem.backend.modules.table.service.run;

import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.exception.ResourceNotFoundException;
import ordersystem.backend.modules.table.dto.request.CreateZoneRequest;
import ordersystem.backend.modules.table.dto.request.UpdateZoneRequest;
import ordersystem.backend.modules.table.dto.response.ZoneResponse;
import ordersystem.backend.modules.table.entity.RestaurantTableEntity;
import ordersystem.backend.modules.table.entity.TableZoneEntity;
import ordersystem.backend.modules.table.repository.RestaurantTableRepository;
import ordersystem.backend.modules.table.repository.TableZoneRepository;
import ordersystem.backend.modules.table.service.impl.ZoneService;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ZoneServiceImpl implements ZoneService {

    private final TableZoneRepository tableZoneRepository;
    private final RestaurantTableRepository restaurantTableRepository;

    @Override
    @Transactional
    public List<ZoneResponse> getAllZones() {
        List<TableZoneEntity> zones = tableZoneRepository.findAllByOrderByDisplayOrderAscZoneIdAsc();
        if (zones.isEmpty()) {
            // Seed defaults if empty
            List<String> defaultNames = Arrays.asList("Tầng trệt", "Tầng 1", "Tầng 2", "VIP");
            int order = 1;
            for (String name : defaultNames) {
                if (!tableZoneRepository.existsByZoneName(name)) {
                    tableZoneRepository.save(TableZoneEntity.builder()
                            .zoneName(name)
                            .displayOrder(order++)
                            .build());
                }
            }
            zones = tableZoneRepository.findAllByOrderByDisplayOrderAscZoneIdAsc();
        }

        return zones.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    @CacheEvict(value = "floor_map", allEntries = true)
    public ZoneResponse createZone(CreateZoneRequest request) {
        String name = request.getZoneName().trim();
        if (tableZoneRepository.existsByZoneName(name)) {
            throw new IllegalArgumentException("Tên khu vực \"" + name + "\" đã tồn tại. Vui lòng chọn tên khác!");
        }

        int maxOrder = tableZoneRepository.findAll().stream()
                .mapToInt(z -> z.getDisplayOrder() != null ? z.getDisplayOrder() : 0)
                .max()
                .orElse(0);

        TableZoneEntity entity = TableZoneEntity.builder()
                .zoneName(name)
                .displayOrder(maxOrder + 1)
                .build();

        TableZoneEntity saved = tableZoneRepository.save(entity);
        return toResponse(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = "floor_map", allEntries = true)
    public ZoneResponse updateZone(Long zoneId, UpdateZoneRequest request) {
        TableZoneEntity zone = tableZoneRepository.findById(zoneId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khu vực với ID: " + zoneId));

        String oldName = zone.getZoneName();
        String newName = request.getZoneName().trim();

        if (tableZoneRepository.existsByZoneNameAndZoneIdNot(newName, zoneId)) {
            throw new IllegalArgumentException("Tên khu vực \"" + newName + "\" đã tồn tại ở khu vực khác. Vui lòng chọn tên khác!");
        }

        zone.setZoneName(newName);
        TableZoneEntity updated = tableZoneRepository.save(zone);

        // Update all tables in restaurant using old zone name to new zone name
        List<RestaurantTableEntity> tables = restaurantTableRepository.findAllByIsActiveTrueOrderByTableIdAsc();
        for (RestaurantTableEntity table : tables) {
            if (oldName.equalsIgnoreCase(table.getZone())) {
                table.setZone(newName);
                restaurantTableRepository.save(table);
            }
        }

        return toResponse(updated);
    }

    @Override
    @Transactional
    @CacheEvict(value = "floor_map", allEntries = true)
    public void deleteZone(Long zoneId) {
        TableZoneEntity zone = tableZoneRepository.findById(zoneId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khu vực với ID: " + zoneId));

        String zoneName = zone.getZoneName();
        tableZoneRepository.delete(zone);

        // Move any tables under deleted zone back to default "Tầng trệt"
        List<RestaurantTableEntity> tables = restaurantTableRepository.findAllByIsActiveTrueOrderByTableIdAsc();
        for (RestaurantTableEntity table : tables) {
            if (zoneName.equalsIgnoreCase(table.getZone())) {
                table.setZone("Tầng trệt");
                restaurantTableRepository.save(table);
            }
        }
    }

    private ZoneResponse toResponse(TableZoneEntity entity) {
        return ZoneResponse.builder()
                .zoneId(entity.getZoneId())
                .zoneName(entity.getZoneName())
                .displayOrder(entity.getDisplayOrder())
                .build();
    }
}
