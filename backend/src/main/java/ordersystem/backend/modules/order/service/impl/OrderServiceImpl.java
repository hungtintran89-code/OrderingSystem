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
import ordersystem.backend.modules.catalog.entity.Product;
import ordersystem.backend.modules.order.enums.OrderStatus;
import ordersystem.backend.modules.order.exception.OrderException;
import ordersystem.backend.modules.order.mapper.OrderMapper;
import ordersystem.backend.modules.order.repository.OrderItemRepository;
import ordersystem.backend.modules.order.repository.OrderRepository;
import ordersystem.backend.modules.catalog.repository.ProductRepository;
import ordersystem.backend.modules.order.service.run.OrderService;
import ordersystem.backend.modules.order.websocket.WebSocketPublisher;
import ordersystem.backend.modules.table.entity.TableSession;
import ordersystem.backend.modules.table.enums.SessionStatus;
import ordersystem.backend.modules.table.repository.TableSessionRepository;
import org.springframework.stereotype.Service;

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
                .orElseThrow(()-> new OrderException("Table session does not exist with ID:" + request.getTableSessionId()));

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
                    .orElseThrow(()->new OrderException("Product with ID : "+itemRequest.getProductId() +" not found")) ;

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .quantity(itemRequest.getQuantity())
                    .price(product.getPrice())
                    .note((itemRequest.getNote()))
                    .createdByThread( request.getThreadId() )
                    .build();
            orderItem.calculatePrice();
            additonalTotal += orderItem.getTotalPrice() ;
            Long currentTotal = (order.getTotalAmount() != null) ? order.getTotalAmount() : 0L;
            order.setTotalAmount( order.getTotalAmount() + additonalTotal );
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
    @Transactional
    public PersonalOrderResponse getPersonalOrder(Long tableSessionId, Long threadId){
        List<OrderItem> myItems = orderItemRepository.findByOrderTableSessionTableSessionIdAndCreatedByThread(tableSessionId , threadId);

        List<OrderItemResponse> itemResponses = myItems.stream()
                .map(orderMapper::toItemResponse)
                .collect(Collectors.toList());

        TableSession tableSession = tableSessionRepository.findByTableSessionId(tableSessionId)
                .orElseThrow(()-> new OrderException("Table id does not exist")) ;
        return orderMapper.toPersonalResponse(tableSession.getTableSessionId(), threadId, itemResponses);
    }

    //3: XEM TỔNG QUAN TAB CHUNG CẢ BÀN (DÀNH CHO NHÂN VIÊN POS / BÀN CHUNG)
    @Override
    @Transactional
    public MasterTableOrderResponse getMasterTableOrder(Long tableSessionId) {

        List<Order> orders = orderRepository.findByTableSessionTableSessionId(tableSessionId) ;
        if ( orders.isEmpty() ){
            throw new OrderException("No items have been ordered for this table yet!");
        }
        Order mainOrder = orders.get(0) ;

        List<OrderItem> orderItemList = orderItemRepository.findByOrderTableSessionTableSessionId(tableSessionId) ;

        List<OrderItemResponse> orderItemResponseList = orderItemList.stream()
                .map(orderMapper::toItemResponse)
                .collect(Collectors.toList()) ;

        return orderMapper.toMasterResponse( mainOrder , orderItemResponseList  );
    }

    //4: BẾP / NHÂN VIÊN CẬP NHẬT TRẠNG THÁI MÓN
    @Override
    @Transactional
    public void updateOrderStatus ( Long orderId , OrderStatus status ){
        Order order = orderRepository.findById(orderId)
                .orElseThrow(()-> new OrderException("Order with ID " + orderId +" not found"));

        order.setStatus( status );
        orderRepository.save(order) ;

        webSocketPublisher.notifyClientOrderStatusUpdate(order.getTableSession().getSessionToken(), status.name() );
    }

    //5 BẾP / QUẢN LÝ CẬP NHẬT TRẠNG THÁI MÓN CÒN HÀNG HOẶC HẾT HÀNG
    @Override
    @Transactional
    public void updateProductAvailability ( Long productId , Boolean isAvailable ){
        Product product = productRepository.findById(productId)
                .orElseThrow(()-> new OrderException("Dish with ID " + productId +" not found:")) ;

        product.setIsAvailable(isAvailable);
        productRepository.save(product) ;

        webSocketPublisher.notifyClientOrderStatusUpdate("MENU_UPDATE", "PRODUCT_" + productId + "_" + isAvailable);

    }
}
