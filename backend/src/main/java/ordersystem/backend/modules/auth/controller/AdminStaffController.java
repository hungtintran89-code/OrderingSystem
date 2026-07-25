package ordersystem.backend.modules.auth.controller;


import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.payload.ApiResponse;
import ordersystem.backend.common.payload.PageResponse;
import ordersystem.backend.modules.auth.dto.request.CreateStaffRequest;
import ordersystem.backend.modules.auth.dto.response.StaffResponse;
import ordersystem.backend.modules.auth.service.impl.StaffService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/staffs")
@RequiredArgsConstructor
public class AdminStaffController {

    private final StaffService staffService ;


    @PostMapping
    public ResponseEntity<ApiResponse<StaffResponse>> createStaff (@Valid @RequestBody CreateStaffRequest createStaffRequest) {

        StaffResponse staffResponse = staffService.createStaff(createStaffRequest ) ;
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Staff created successfully", staffResponse));

    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<StaffResponse>>> getStaffs (
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<StaffResponse> response = staffService.getStaffs(page, size);
        return ResponseEntity.ok(ApiResponse.success("Get list staff successfull", response));
    }


}
