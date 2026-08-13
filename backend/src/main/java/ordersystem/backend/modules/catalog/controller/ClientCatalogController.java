package ordersystem.backend.modules.catalog.controller;


import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.payload.ApiResponse;
import ordersystem.backend.modules.catalog.dto.response.CategoryMenuResponse;
import ordersystem.backend.modules.catalog.service.impl.CatalogService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/client/menu")
@RequiredArgsConstructor
public class ClientCatalogController {

    final private CatalogService catalogService ;

    // API: Lấy Thực đơn đầy đủ cho Khách quét QR
    // URL: GET /api/v1/client/menu
    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryMenuResponse>>> getClientMenu (){
        List<CategoryMenuResponse> categoryMenuResponseList = catalogService.getAllCategories() ;
        return ResponseEntity.ok( ApiResponse.success("Menu retrieved successfully" , categoryMenuResponseList)) ;
    }


}
