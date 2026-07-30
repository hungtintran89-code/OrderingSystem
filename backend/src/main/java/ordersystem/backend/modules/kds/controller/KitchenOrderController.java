package ordersystem.backend.modules.kds.controller;


import lombok.RequiredArgsConstructor;
import ordersystem.backend.modules.order.enums.OrderStatus;
import ordersystem.backend.modules.order.service.run.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/kitchen/orders")
@RequiredArgsConstructor
public class KitchenOrderController {

}
