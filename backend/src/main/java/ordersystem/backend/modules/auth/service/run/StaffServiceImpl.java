package ordersystem.backend.modules.auth.service.run;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class StaffServiceImpl implements StaffService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public StaffResponse createStaff(CreateStaffRequest request) {
        log.debug("Checking if username exists: {}", request.getUsername());
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new UserAlreadyExistsException("Username already exists!");
        }
        log.debug("Encrypting password and saving user to DB...");
        User staff = User.builder()
                .fullName(request.getFullName())
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .active(true)
                .build();
        User savedStaff = userRepository.save(staff);
        return StaffResponse.builder()
                .userId(savedStaff.getUserId())
                .fullName(savedStaff.getFullName())
                .username(savedStaff.getUsername())
                .role(savedStaff.getRole())
                .active(savedStaff.isActive())
                .createdAt(savedStaff.getCreatedAt())
                .build();
    }

    @Override
    public PageResponse<StaffResponse> getStaffs(int page, int size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("createdAt").descending());
        Page<User> staffPage = userRepository.findAll(pageable);
        List<StaffResponse> content = staffPage.getContent().stream()
                .map(user -> StaffResponse.builder()
                        .userId(user.getUserId())
                        .fullName(user.getFullName())
                        .username(user.getUsername())
                        .role(user.getRole())
                        .active(user.isActive())
                        .createdAt(user.getCreatedAt())
                        .build()).toList();
        return PageResponse.<StaffResponse>builder()
                .content(content)
                .page(page)
                .size(size)
                .totalElements(staffPage.getTotalElements())
                .totalPages(staffPage.getTotalPages())
                .build();
    }
}

