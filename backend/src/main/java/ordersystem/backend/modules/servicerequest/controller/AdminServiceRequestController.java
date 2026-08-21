package ordersystem.backend.modules.servicerequest.controller;

import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.payload.ApiResponse;
import ordersystem.backend.modules.servicerequest.dto.response.ServiceRequestResponse;
import ordersystem.backend.modules.servicerequest.service.impl.ServiceRequestService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/service-requests")
@RequiredArgsConstructor
public class AdminServiceRequestController {

    private final ServiceRequestService serviceRequestService;

    //Xem danh sách đang chờ xử lí
    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('MANAGER', 'STAFF')")
    public ResponseEntity<ApiResponse<List<ServiceRequestResponse>>> getActiveServiceRequest(){
        List<ServiceRequestResponse> response = serviceRequestService.getActiveRequest();

        return ResponseEntity.ok(ApiResponse.success("success", response));
    }

    //Xác nhận hoàn thành xử lí
    @PatchMapping("/{requestId}/complete")
    @PreAuthorize("hasAnyRole('MANAGER', 'STAFF')")
    public ResponseEntity<ApiResponse<ServiceRequestResponse>> completedServiceRequest(@PathVariable Long requestId){
        ServiceRequestResponse response = serviceRequestService.completedRequest(requestId);

        return ResponseEntity.ok(ApiResponse.success("success", response));
    }

    //Hoàn tác 3s
    @PostMapping("/{requestId}/undo")
    @PreAuthorize("hasAnyRole('MANAGER', 'STAFF')")
    public ResponseEntity<ApiResponse<ServiceRequestResponse>> undoServiceRequest(@PathVariable Long requestId){
        ServiceRequestResponse response = serviceRequestService.undoRequest(requestId);

        return ResponseEntity.ok(ApiResponse.success("success", response));
    }
}


