package ordersystem.backend.modules.table.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.payload.ApiResponse;
import ordersystem.backend.modules.table.dto.request.CreateServiceRequestDto;
import ordersystem.backend.modules.table.dto.response.ServiceRequestResponse;
import ordersystem.backend.modules.table.service.impl.ServiceRequestService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/v1/service-requests")
@RequiredArgsConstructor
public class PublicServiceRequestController {

    private final ServiceRequestService serviceRequestService;

    @PostMapping
    public ResponseEntity<ApiResponse<ServiceRequestResponse>> createServiceRequest(
            @RequestHeader("X-Session-Token") String sessionToken,
            @Valid @RequestBody CreateServiceRequestDto serviceRequestDto
            ){
        ServiceRequestResponse response = serviceRequestService.createRequest(sessionToken, serviceRequestDto);

        return ResponseEntity.ok(ApiResponse.success("success", response));
    }
}
