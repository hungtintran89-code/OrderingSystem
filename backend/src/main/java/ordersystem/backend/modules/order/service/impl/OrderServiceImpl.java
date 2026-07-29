package ordersystem.backend.modules.order.service.impl;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import ordersystem.backend.modules.order.dto.request.OrderItemRequest;
import ordersystem.backend.modules.order.dto.request.SubmitPersonalOrderRequest;
import ordersystem.backend.modules.order.dto.response.MasterTableOrderResponse;
import ordersystem.backend.modules.order.dto.response.OrderItemResponse;
import ordersystem.backend.modules.order.dto.response.PersonalOrderResponse;
import ordersystem.backend.modules.order.entity.Order;
import ordersystem.backend.modules.order.entity.OrderItem;
import ordersystem.backend.modules.order.entity.Product;
import ordersystem.backend.modules.order.enums.OrderStatus;
import ordersystem.backend.modules.order.exception.OrderException;
import ordersystem.backend.modules.order.mapper.OrderMapper;
import ordersystem.backend.modules.order.repository.OrderItemRepository;
import ordersystem.backend.modules.order.repository.OrderRepository;
import ordersystem.backend.modules.order.repository.ProductRepository;
import ordersystem.backend.modules.order.repository.TableSessionRepository;
import ordersystem.backend.modules.order.service.run.OrderService;
import ordersystem.backend.modules.order.websocket.WebSocketPublisher;
import ordersystem.backend.modules.table.entity.TableSession;
import ordersystem.backend.modules.table.enums.SessionStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    final private TableSessionRepository tableSessionRepository ;
    final private OrderRepository orderRepository ;
    final private ProductRepository productRepository ;
    final private WebSocketPublisher webSocketPublisher ;
    final private OrderMapper orderMapper ;
    final private OrderItemRepository orderItemRepository ;


    // 1. Xử lý khi Khách hàng bấm Gửi đơn đặt món
    @Override
    @Transactional
    public PersonalOrderResponse submitPersonalOrder(SubmitPersonalOrderRequest request){

        TableSession tableSession = tableSessionRepository.findByTableSessionId(request.getTableSessionId())
                .orElseThrow(()-> new OrderException("Version does not exist with ID:" + request.getTableSessionId()));


        if( tableSession.getStatus() != SessionStatus.ACTIVE ){
            throw new OrderException("The session for this table has been closed!") ;
        }

        Order order = orderRepository.findByTableSessionTableSessionId(tableSession.getTableSessionId())
                .stream().findFirst()
                .orElseGet(()->{
                    return orderRepository.save(Order.builder()
                                    .orderCode("ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                                    .tableSession(tableSession)
                                    .status(OrderStatus.PENDING)
                                    .totalAmount(0L)
                                    .build()) ;
                });
        Long additonalTotal = 0L ;
        List<OrderItem> newOrderItem = new ArrayList<>() ;

        for(OrderItemRequest itemRequest : request.getList()){
            Product product = productRepository.findById(itemRequest.getProductId())
                    .orElseThrow(()->new OrderException("Product with ID : "+itemRequest.getProductId() +" not found"))

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .quantity(itemRequest.getQuantity())
                    .price(product.getPrice())
                    .note((itemRequest.getNote()))
                    .createdByThread( request.getThreadId() )
                    .build();
            orderItem.calculatePrice();
            additonalTotal += order.getTotalAmount() ;
            newOrderItem.add(orderItem) ;
        }
        order.setTotalAmount( additonalTotal);
        order.getItems().addAll(newOrderItem);

        Order savedOrder = orderRepository.save(order);
        webSocketPublisher.notifyKitchenNewOrder( newOrderItem );
        webSocketPublisher.notifyAdminTableUpdate(tableSession.getTableSessionId(), savedOrder.getId());

        List<OrderItemResponse> newItemsResponses = newOrderItem.stream()
                .map(orderMapper::toItemResponse)
                .collect(Collectors.toList());

        return orderMapper.toPersonalResponse(tableSession.getTableSessionId(), request.getThreadId() , newItemsResponses);

    }



    // 2. Lấy danh sách món do chính điện thoại của khách đã đặt
    @Override
    public PersonalOrderResponse getPersonalOrder(Long tableSessionId, Long threadId){
        List<OrderItem> myItems = orderItemRepository.findByOrderTableSessionTableSessionId(tableSessionId , threadId);
        return null ;
    }



}
