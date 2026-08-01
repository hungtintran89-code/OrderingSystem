package ordersystem.backend.modules.order.service.impl;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.payload.PageResponse;
import ordersystem.backend.modules.order.dto.request.OrderItemRequest;
import ordersystem.backend.modules.order.dto.request.SubmitPersonalOrderRequest;
import ordersystem.backend.modules.order.dto.response.MasterTableOrderResponse;
import ordersystem.backend.modules.order.dto.response.OrderItemResponse;
import ordersystem.backend.modules.order.dto.response.PersonalOrderResponse;
import ordersystem.backend.modules.order.dto.response.TableInvoiceResponse;
import ordersystem.backend.modules.order.entity.OrderEntity;
import ordersystem.backend.modules.order.entity.OrderItemEntity;
import ordersystem.backend.modules.catalog.entity.ProductEntity;
import ordersystem.backend.modules.order.enums.OrderStatus;
import ordersystem.backend.modules.order.event.OrderSubmittedEvent;
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
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
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
    private final ApplicationEventPublisher eventPublisher;

    // 1. Xử lý khi Khách hàng bấm Gửi đơn đặt món
    @Override
    @Transactional
    public PersonalOrderResponse submitPersonalOrder(SubmitPersonalOrderRequest request){

        // 1. Lấy Session bàn đang ACTIVE
        TableSessionEntity tableSessionEntity = tableSessionRepository.findByTableSessionId(request.getTableSessionId())
                .orElseThrow(() -> new OrderException("Table session does not exist"));
        if( tableSessionEntity.getStatus() != SessionStatus.ACTIVE){
            throw new OrderException("The session for this table has been closed!");
        }

        // 2. Tìm Master Order tổng của bàn (Nếu chưa có thì tự động tạo mới)
        OrderEntity masterOrderEntity  = orderRepository.findByTableSessionTableSessionId(tableSessionEntity.getTableSessionId())
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

        // 3. Tạo danh sách các món khách đợt này vừa đặt (Đính kèm threadId)
        for(OrderItemRequest itemRequest : request.getList()){
            ProductEntity productEntity = productRepository.findById(itemRequest.getProductId())
                    .orElseThrow(()->new OrderException("Product with ID : "+itemRequest.getProductId() +" not found")) ;

            OrderItemEntity orderItemEntity = OrderItemEntity.builder()
                    .order(masterOrderEntity)
                    .product(productEntity)
                    .quantity(itemRequest.getQuantity())
                    .price(productEntity.getProductPrice())
                    .note((itemRequest.getNote()))
                    .createdByThread(request.getThreadId())
                    .build();
            orderItemEntity.calculatePrice();
            newOrderItemEntity.add(orderItemEntity);
            additonalTotal += orderItemEntity.getTotalPrice();
        }
        // 4. Cộng dồn số tiền vào Master Order chung của cả bàn
        Long currentTotal = (masterOrderEntity.getTotalAmount() != null) ? masterOrderEntity.getTotalAmount() : 0L;
        masterOrderEntity.setTotalAmount(currentTotal + additonalTotal);
        masterOrderEntity.getItems().addAll(newOrderItemEntity);
        OrderEntity savedOrderEntity = orderRepository.save(masterOrderEntity);

        // 5. Bắn thông báo Real-time cho Bếp (Chỉ bắn các món MỚI ĐẶT)
        webSocketPublisher.notifyKitchenNewOrder(newOrderItemEntity);
        webSocketPublisher.notifyAdminTableUpdate(tableSessionEntity.getTableSessionId(), savedOrderEntity.getId());

        // 6. Trả về cho thiết bị khách danh sách các món điện thoại này vừa đặt thành công
        List<OrderItemResponse> newItemsResponses = newOrderItemEntity.stream()
                .map(orderMapper::toItemResponse)
                .collect(Collectors.toList());

        List<OrderSubmittedEvent.OrderItemInfo> itemInfos = newOrderItemEntity.stream()
                .map(item -> new OrderSubmittedEvent.OrderItemInfo(
                        item.getOrderItemId(),
                        item.getProduct().getProductId(),
                        item.getProduct().getProductName(),
                        item.getQuantity().intValue(),
                        item.getNote()
                ))
                .toList();
        OrderSubmittedEvent event = new OrderSubmittedEvent(
                savedOrderEntity.getId(),
                tableSessionEntity.getTable().getTableName(),
                "Tầng 1", // Hoặc thông tin khu vực bàn
                itemInfos
        );
// Bắn sự kiện phát vé cho KDS
        eventPublisher.publishEvent(event);
        return orderMapper.toPersonalResponse(tableSessionEntity.getTableSessionId(), request.getThreadId() , newItemsResponses);

    }


    // 2. Khách mở điện thoại cá nhân lên xem -> CHỈ HIỂN THỊ MÓN DO THREAD ĐÓ ĐẶT
    @Override
    @Transactional
    public PersonalOrderResponse getPersonalOrder(Long tableSessionId, Long threadId){

        List<OrderItemEntity> orderItemResponseList = orderItemRepository.findByOrderTableSessionTableSessionIdAndCreatedByThread(tableSessionId , threadId);

        List<OrderItemResponse> responseList = orderItemResponseList.stream()
                .map(orderMapper::toItemResponse)
                .collect(Collectors.toList()) ;

        TableSessionEntity tableSessionEntity = tableSessionRepository.findByTableSessionId(tableSessionId)
                .orElseThrow(()->new OrderException("Table Session ID does not exist: " + tableSessionId));

        return orderMapper.toPersonalResponse(tableSessionEntity.getTableSessionId(), threadId, responseList);
    }

    // 3. XEM TỔNG BÀN (Lấy Master Order chứa tất cả các món của mọi Thread gom lại)
    @Override
    @Transactional
    public MasterTableOrderResponse getMasterTableOrder(Long tableId ) {

        // Bước 1: Tìm Session đang ACTIVE của bàn đó
        TableSessionEntity tableSession = tableSessionRepository.findByTableTableIdAndStatus(tableId , SessionStatus.ACTIVE)
                .orElseThrow(()-> new OrderException("No active session found for table ID: " + tableId)) ;

        // Bước 2: Tìm danh sách Order dựa trên tableSessionId vừa tìm được
        List<OrderEntity> orderEntities = orderRepository.findByTableSessionTableSessionId( tableSession.getTableSessionId()) ;
        if ( orderEntities.isEmpty() ){
            throw new OrderException("No items have been ordered for this table yet!");
        }
        if (orderEntities.isEmpty()) {
            return MasterTableOrderResponse.builder()
                    .tableSessionId(tableSession.getTableSessionId())
                    .tableName(tableSession.getTableName())
                    .totalPrice(0L)
                    .allTableItems(Collections.emptyList())
                    .build();
        }
        OrderEntity mainOrderEntity = orderEntities.get(0) ;

        // Bước 3: Lấy danh sách món ăn thuộc session này
        List<OrderItemEntity> orderItemEntityList = orderItemRepository.findByOrderTableSessionTableSessionId( tableSession.getTableSessionId()) ;

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

    // 5. Xem lịch sử Đơn hàng
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

    public TableInvoiceResponse exportTableInvoice(Long tableId) {
        TableSessionEntity tableSession = tableSessionRepository.findByTableTableIdAndStatus(tableId , SessionStatus.ACTIVE)
                .orElseThrow(()-> new OrderException("No ACTIVE session found for table ID: " + tableId)) ;

        List<OrderItemEntity> orderItemResponseList = orderItemRepository.findByOrderTableSessionTableSessionId(tableSession.getTableSessionId()) ;

        if( orderItemResponseList.isEmpty()){
            throw new OrderException("Cannot export invoice: No items ordered for this table yet.") ;
        }

        // 3. Map sang OrderItemResponse
        List<OrderItemResponse> responseList = orderItemResponseList.stream()
                .map(orderMapper::toItemResponse)
                .collect(Collectors.toList()) ;

        // Tạo mã số dạng Long dựa trên miligiây hiện tại (VD: 1785456789012L)
        Long invoiceCode = System.currentTimeMillis();

        return orderMapper.toTableInvoiceResponse( invoiceCode , tableSession , responseList , 0L , 0L  ) ;


    }
}
