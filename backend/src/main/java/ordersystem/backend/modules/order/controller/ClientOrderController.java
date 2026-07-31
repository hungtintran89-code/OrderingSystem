package ordersystem.backend.modules.order.controller;


import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.payload.ApiResponse;
import ordersystem.backend.modules.order.dto.request.SubmitPersonalOrderRequest;
import ordersystem.backend.modules.order.dto.response.MasterTableOrderResponse;
import ordersystem.backend.modules.order.dto.response.PersonalOrderResponse;
import ordersystem.backend.modules.order.dto.response.TableInvoiceResponse;
import ordersystem.backend.modules.order.service.run.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class ClientOrderController {

    final private OrderService orderService ;


    // API 1: Khách hàng tại bàn bấm "Gửi Đơn" gọi món
    // URL: POST /api/v1/orders/submit
    @PostMapping
    public ResponseEntity<ApiResponse<PersonalOrderResponse>> submitOrder (@Valid @RequestBody SubmitPersonalOrderRequest request){
        PersonalOrderResponse response = orderService.submitPersonalOrder(request) ;
        return ResponseEntity.ok( ApiResponse.success("Order submitted successfully" , response)) ;
    }

    // API 2: Khách mở lại app xem danh sách món do ĐIỆN THOẠI CÁ NHÂN mình đã đặt
    // URL: GET /api/v1/orders/personal?tableSessionId=1001&threadId=IPHONE_14
    @GetMapping("/personal")
    public ResponseEntity<ApiResponse<PersonalOrderResponse>> getPersonalOrder (
            @RequestParam Long tableSessionId  ,
            @RequestParam Long threadId){
        PersonalOrderResponse response = orderService.getPersonalOrder(tableSessionId, threadId) ;
        return ResponseEntity.ok( ApiResponse.success("Personal order retrieved successfully" , response)) ;
    }

    // API 3: Xem tổng quan danh sách tất cả các món đã gọi của CẢ BÀN (TAB CHUNG)
    // URL: GET /api/v1/orders/table-summary?tableSessionId=1001
    @GetMapping("/table/{tableId}")
    public ResponseEntity<ApiResponse<MasterTableOrderResponse>> getMasterTableOrder ( @PathVariable Long tableId ){
        MasterTableOrderResponse response = orderService.getMasterTableOrder(tableId) ;
        return ResponseEntity.ok( ApiResponse.success("Master table order retrieved successfully" , response)) ;
    }

    // API 4: Xem tạm tính hóa đơn cho bàn
    @GetMapping("/table/{tableId}/invoice")
    public ResponseEntity<ApiResponse<TableInvoiceResponse>> getTableInvoice (@PathVariable Long tableId){
        TableInvoiceResponse tableInvoiceResponse = orderService.exportTableInvoice(tableId) ;
        return ResponseEntity.ok( ApiResponse.success("Table invoice generated successfully" , tableInvoiceResponse)) ;
    }



}
