package ordersystem.backend.modules.auth.service.run;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ordersystem.backend.common.exception.ResourceNotFoundException;
import ordersystem.backend.common.payload.PageResponse;
import ordersystem.backend.modules.auth.dto.request.CreateStaffRequest;
import ordersystem.backend.modules.auth.dto.response.StaffResponse;
import ordersystem.backend.modules.auth.entity.User;
import ordersystem.backend.modules.auth.exception.UserAlreadyExistsException;
import ordersystem.backend.modules.auth.repository.UserRepository;
import ordersystem.backend.modules.auth.service.impl.StaffService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service triển khai logic tạo, danh sách và khóa/mở khóa nhân viên.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional( readOnly = true )
public class StaffServiceImpl implements StaffService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public StaffResponse createStaff(CreateStaffRequest request) {
        log.debug("Checking if username exists: {}", request.getUsername());
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new UserAlreadyExistsException("Username already exists!");
        }
        log.debug("Encrypting password and saving user to DB...");
        java.math.BigDecimal salaryVal = request.getSalary() != null ? request.getSalary() : new java.math.BigDecimal("7500000.00");
        User staff = User.builder()
                .fullName(request.getFullName())
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .salary(salaryVal)
                .phone(request.getPhone())
                .active(true)
                .build();
        User savedStaff = userRepository.save(staff);
        return StaffResponse.builder()
                .userId(savedStaff.getUserId())
                .fullName(savedStaff.getFullName())
                .username(savedStaff.getUsername())
                .role(savedStaff.getRole())
                .salary(savedStaff.getSalary())
                .phone(savedStaff.getPhone())
                .active(savedStaff.isActive())
                .createdAt(savedStaff.getCreatedAt())
                .build();
    }

    @Override
    public PageResponse<StaffResponse> getStaffs(int page, int size) {
        int safePage = Math.max(1, page);
        Pageable pageable = PageRequest.of(safePage - 1, size, Sort.by("createdAt").descending());

        Page<User> staffPage = userRepository.findAll(pageable);
        List<StaffResponse> content = staffPage.getContent().stream()
                .map(staff -> StaffResponse.builder()
                        .userId(staff.getUserId())
                        .fullName(staff.getFullName())
                        .username(staff.getUsername())
                        .role(staff.getRole())
                        .salary(staff.getSalary() != null ? staff.getSalary() : new java.math.BigDecimal("7500000.00"))
                        .phone(staff.getPhone())
                        .active(staff.isActive())
                        .createdAt(staff.getCreatedAt())
                        .build())
                .toList();

        return PageResponse.<StaffResponse>builder()
                .content(content)
                .page(safePage)
                .size(size)
                .totalElements(staffPage.getTotalElements())
                .totalPages(staffPage.getTotalPages())
                .build();
    }

    @Override
    @Transactional
    public StaffResponse updateStaff(Long staffId, ordersystem.backend.modules.auth.dto.request.UpdateStaffRequest request) {
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên với ID: " + staffId));

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            staff.setFullName(request.getFullName().trim());
        }
        if (request.getRole() != null) {
            staff.setRole(request.getRole());
        }
        if (request.getSalary() != null) {
            staff.setSalary(request.getSalary());
        }
        if (request.getPhone() != null) {
            staff.setPhone(request.getPhone().trim());
        }
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            staff.setPasswordHash(passwordEncoder.encode(request.getPassword().trim()));
        }

        User updatedStaff = userRepository.save(staff);
        log.info("📢 Đã cập nhật thành công thông tin nhân viên ID {}", staffId);

        return StaffResponse.builder()
                .userId(updatedStaff.getUserId())
                .fullName(updatedStaff.getFullName())
                .username(updatedStaff.getUsername())
                .role(updatedStaff.getRole())
                .salary(updatedStaff.getSalary() != null ? updatedStaff.getSalary() : new java.math.BigDecimal("7500000.00"))
                .phone(updatedStaff.getPhone())
                .active(updatedStaff.isActive())
                .createdAt(updatedStaff.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public void deleteStaff(Long staffId) {
        if (!userRepository.existsById(staffId)) {
            throw new ResourceNotFoundException("Không tìm thấy nhân viên với ID: " + staffId);
        }
        userRepository.deleteById(staffId);
        log.info("📢 Đã xóa hoàn toàn tài khoản nhân viên ID {} khỏi DB", staffId);
    }

    /**
     * Khóa / Mở khóa tài khoản nhân viên hệ thống.
     * 
     * @param staffId ID nhân viên
     * @return StaffResponse thông tin tài khoản sau khi chuyển trạng thái
     */
    @Override
    @Transactional
    public StaffResponse toggleStaffActive(Long staffId) {
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên với ID: " + staffId));

        staff.setActive(!staff.isActive());
        User updatedStaff = userRepository.save(staff);

        log.info("📢 Trạng thái hoạt động của nhân viên ID {} đã chuyển sang: {}", staffId, updatedStaff.isActive());
        return StaffResponse.builder()
                .userId(updatedStaff.getUserId())
                .fullName(updatedStaff.getFullName())
                .username(updatedStaff.getUsername())
                .role(updatedStaff.getRole())
                .salary(updatedStaff.getSalary() != null ? updatedStaff.getSalary() : new java.math.BigDecimal("7500000.00"))
                .phone(updatedStaff.getPhone())
                .active(updatedStaff.isActive())
                .createdAt(updatedStaff.getCreatedAt())
                .build();
    }
}
