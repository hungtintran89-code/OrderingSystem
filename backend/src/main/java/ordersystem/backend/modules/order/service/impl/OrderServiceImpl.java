package ordersystem.backend.modules.order.service.impl;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.payload.PageResponse;
import ordersystem.backend.modules.order.dto.request.OrderItemRequest;
import ordersystem.backend.modules.order.dto.request.SubmitPersonalOrderRequest;
import ordersystem.backend.modules.order.dto.response.MasterTableOrderResponse;
import ordersystem.backend.modules.order.dto.response.OrderItemResponse;
import ordersystem.backend.modules.order.dto.response.PersonalOrderResponse;
import ordersystem.backend.modules.order.entity.OrderEntity;
import ordersystem.backend.modules.order.entity.OrderItemEntity;
import ordersystem.backend.modules.catalog.entity.Product;
import ordersystem.backend.modules.order.enums.OrderStatus;
import ordersystem.backend.modules.order.exception.OrderException;
import ordersystem.backend.modules.order.mapper.OrderMapper;
import ordersystem.backend.modules.order.repository.OrderItemRepository;
import ordersystem.backend.modules.order.repository.OrderRepository;
import ordersystem.backend.modules.catalog.repository.ProductRepository;
import ordersystem.backend.modules.order.service.run.OrderService;
import ordersystem.backend.modules.order.websocket.WebSocketPublisher;
import ordersystem.backend.modules.table.entity.TableSessionEntity;
import ordersystem.backend.modules.table.enums.SessionStatus;
import ordersystem.backend.modules.table.repository.TableSessionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

        TableSessionEntity tableSessionEntity = tableSessionRepository.findByTableSessionId(request.getTableSessionId())
                .orElseThrow(()-> new OrderException("Table session does not exist with ID:" + request.getTableSessionId()));

        if( tableSessionEntity.getStatus() != SessionStatus.ACTIVE ){
            throw new OrderException("The session for this table has been closed!") ;
        }

        OrderEntity orderEntity = orderRepository.findByTableSessionTableSessionId(tableSessionEntity.getTableSessionId())
                .stream().findFirst()
                .orElseGet(()->{
                    return orderRepository.save(OrderEntity.builder()
                                    .orderCode("ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                                    .tableSession(tableSessionEntity)
                                    .status(OrderStatus.PENDING)
                                    .totalAmount(0L)
                                    .build()) ;
                });
        Long additonalTotal = 0L ;
        List<OrderItemEntity> newOrderItemEntity = new ArrayList<>() ;

        for(OrderItemRequest itemRequest : request.getList()){
            Product product = productRepository.findById(itemRequest.getProductId())
                    .orElseThrow(()->new OrderException("Product with ID : "+itemRequest.getProductId() +" not found")) ;

            OrderItemEntity orderItemEntity = OrderItemEntity.builder()
                    .order(orderEntity)
                    .product(product)
                    .quantity(itemRequest.getQuantity())
                    .price(product.getPrice())
                    .note((itemRequest.getNote()))
                    .createdByThread(request.getThreadId())
                    .build();
            orderItemEntity.calculatePrice();
            newOrderItemEntity.add(orderItemEntity);
            additonalTotal += orderItemEntity.getTotalPrice();
        }
        Long currentTotal = (orderEntity.getTotalAmount() != null) ? orderEntity.getTotalAmount() : 0L;
        orderEntity.setTotalAmount(currentTotal + additonalTotal);
        orderEntity.getItems().addAll(newOrderItemEntity);

        OrderEntity savedOrderEntity = orderRepository.save(orderEntity);
        webSocketPublisher.notifyKitchenNewOrder(newOrderItemEntity);
        webSocketPublisher.notifyAdminTableUpdate(tableSessionEntity.getTableSessionId(), savedOrderEntity.getId());

        List<OrderItemResponse> newItemsResponses = newOrderItemEntity.stream()
                .map(orderMapper::toItemResponse)
                .collect(Collectors.toList());

        return orderMapper.toPersonalResponse(tableSessionEntity.getTableSessionId(), request.getThreadId() , newItemsResponses);

    }

    // 2. Lấy danh sách món do chính điện thoại của khách đã đặt
    @Override
    @Transactional
    public PersonalOrderResponse getPersonalOrder(Long tableSessionId, Long threadId){
        List<OrderItemEntity> myItems = orderItemRepository.findByOrderTableSessionTableSessionIdAndCreatedByThread(tableSessionId , threadId);

        List<OrderItemResponse> itemResponses = myItems.stream()
                .map(orderMapper::toItemResponse)
                .collect(Collectors.toList());

        TableSessionEntity tableSessionEntity = tableSessionRepository.findByTableSessionId(tableSessionId)
                .orElseThrow(()-> new OrderException("Table id does not exist")) ;
        return orderMapper.toPersonalResponse(tableSessionEntity.getTableSessionId(), threadId, itemResponses);
    }

    //3: XEM TỔNG QUAN TAB CHUNG CẢ BÀN (DÀNH CHO NHÂN VIÊN POS / BÀN CHUNG)
    @Override
    @Transactional
    public MasterTableOrderResponse getMasterTableOrder(Long tableSessionId) {

        List<OrderEntity> orderEntities = orderRepository.findByTableSessionTableSessionId(tableSessionId) ;
        if ( orderEntities.isEmpty() ){
            throw new OrderException("No items have been ordered for this table yet!");
        }
        OrderEntity mainOrderEntity = orderEntities.get(0) ;

        List<OrderItemEntity> orderItemEntityList = orderItemRepository.findByOrderTableSessionTableSessionId(tableSessionId) ;

        List<OrderItemResponse> orderItemResponseList = orderItemEntityList.stream()
                .map(orderMapper::toItemResponse)
                .collect(Collectors.toList()) ;

        return orderMapper.toMasterResponse(mainOrderEntity, orderItemResponseList  );
    }

    //4: BẾP / NHÂN VIÊN CẬP NHẬT TRẠNG THÁI MÓN
    @Override
    @Transactional
    public void updateOrderStatus ( Long orderId , OrderStatus status ){
        OrderEntity orderEntity = orderRepository.findById(orderId)
                .orElseThrow(()-> new OrderException("Order with ID " + orderId +" not found"));

        orderEntity.setStatus( status );
        orderRepository.save(orderEntity) ;

        webSocketPublisher.notifyClientOrderStatusUpdate(orderEntity.getTableSession().getSessionToken(), status.name() );
    }

    @Override
    public PageResponse<MasterTableOrderResponse> getOrderHistory(OrderStatus status, Pageable pageable) {

        Page<OrderEntity> orderPage ;
        if (status != null) {
            orderPage = orderRepository.findByStatus(status, pageable);
        } else {
            orderPage = orderRepository.findAll(pageable);
        }

        List<MasterTableOrderResponse> responses = orderPage.getContent().stream()
                .map(orderEntity ->{
                    List<OrderItemResponse> itemResponses = orderEntity.getItems().stream()
                            .map(orderMapper::toItemResponse)
                            .collect(Collectors.toList());
                    return orderMapper.toMasterResponse(orderEntity, itemResponses);
                })
                .collect(Collectors.toList());

        return PageResponse.<MasterTableOrderResponse>builder()
                .content(responses)
                .page(orderPage.getNumber() + 1 )
                .size(orderPage.getSize() )
                .totalPages(orderPage.getTotalPages())
                .totalElements(orderPage.getTotalElements())
                .build() ;

    }


}
