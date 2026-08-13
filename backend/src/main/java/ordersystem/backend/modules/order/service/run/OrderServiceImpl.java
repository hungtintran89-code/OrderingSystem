package ordersystem.backend.modules.order.service.run;

import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.payload.PageResponse;
import ordersystem.backend.common.websocket.WebSocketPublisher;
import ordersystem.backend.modules.cart.service.impl.CartService;
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
import ordersystem.backend.modules.order.service.impl.OrderService;
import ordersystem.backend.modules.table.dto.response.FloorMapResponse;
import ordersystem.backend.modules.table.entity.RestaurantTableEntity;
import ordersystem.backend.modules.table.entity.TableSessionEntity;
import ordersystem.backend.modules.table.enums.SessionStatus;
import ordersystem.backend.modules.table.enums.TableStatus;
import ordersystem.backend.modules.kds.dto.response.KitchenTicketResponse;
import ordersystem.backend.modules.kds.entity.KitchenTicketEntity;
import ordersystem.backend.modules.kds.enums.KitchenItemStatus;
import ordersystem.backend.modules.kds.mapper.KitchenTicketMapper;
import ordersystem.backend.modules.kds.repository.KitchenTicketRepository;
import ordersystem.backend.modules.table.repository.RestaurantTableRepository;
import ordersystem.backend.modules.table.repository.TableSessionRepository;
import org.redisson.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.TimeUnit;
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
    final private ApplicationEventPublisher eventPublisher;
    final private CartService cartService ;
    final private RedissonClient redissonClient ;
    final private RestaurantTableRepository restaurantTableRepository ;
    final private KitchenTicketRepository kitchenTicketRepository ;
    final private KitchenTicketMapper kitchenTicketMapper ;



    @Lazy
    @Autowired
    private OrderServiceImpl self; // Inject Proxy của chính class này


    // 1. Xử lý khi Khách hàng bấm Gửi đơn đặt món
    @Override
    @CacheEvict(value = "floor_map", allEntries = true)
    public PersonalOrderResponse submitOrderWithLock(SubmitPersonalOrderRequest request) {
        //1. CHỐNG SPAM (RATE LIMITING):
        String rateLimitKey = "ratelimit:order:thread:" + request.getThreadId();
        RRateLimiter rateLimiter = redissonClient.getRateLimiter(rateLimitKey) ;

        // Cấu hình: Tối đa 1 Request trong vòng 3 giây cho mỗi thiết bị (threadId)
        // Chỉ khởi tạo cấu hình rate limit nếu key này chưa từng tồn tại trên Redis
        if (!rateLimiter.isExists()) {
            rateLimiter.trySetRate(RateType.OVERALL, 1, 2, RateIntervalUnit.SECONDS);
            rateLimiter.expire(java.time.Duration.ofMinutes(30)); // Cài TTL tránh rác Redis
        }

        // Nếu gọi quá 1 lần/3s -> Báo lỗi ngay lập tức mà CHƯA CẦN đụng vào Lock hay DB
        if( !rateLimiter.tryAcquire() ){
            throw new OrderException("You are performing actions too quickly! Please wait 3 seconds to continue.") ;
        }

        String lockKey = "lock:order:session:" + request.getTableId();
        RLock lock = redissonClient.getLock(lockKey);
        try {
            // 1. LẤY KHÓA TRƯỚC KHI VÀO TRANSACTION
            boolean isAcquired = lock.tryLock(3, 5, TimeUnit.SECONDS);
            if (!isAcquired) {
                throw new OrderException("An order is currently being sent for this table; please wait a moment.!");
            }
            // 2. GỌI HÀM SERVICE CÓ @Transactional
            return self.submitPersonalOrder(request);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new OrderException("System error during data locking\n!");
        } finally {
            // 3. CHỈ NHẢ KHÓA SAU KHI TRANSACTION ĐÃ COMMIT HOÀN TOÀN TỐT ĐẸP!
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }

    @Transactional
    protected PersonalOrderResponse submitPersonalOrder(SubmitPersonalOrderRequest request){

        // 1. Lấy Session bàn đang ACTIVE
        RestaurantTableEntity table = restaurantTableRepository.findByTableId(request.getTableId())
                .orElseThrow(() -> new OrderException("Không tìm thấy thông tin bàn ăn với ID: " + request.getTableId()));

        // 2. Tìm phiên không có thì tạo mới và ĐỔI TRẠNG THÁI BÀN sang OCCUPIED
        TableSessionEntity tableSessionEntity = tableSessionRepository.findByTableTableIdAndStatus(table.getTableId(), SessionStatus.ACTIVE)
                .orElseGet(() -> {
                    table.setTableStatus(TableStatus.OCCUPIED);
                    restaurantTableRepository.save(table);
                    TableSessionEntity newSession = TableSessionEntity.builder()
                            .table(table)
                            .tableName(table.getTableName())
                            .sessionToken("sess_" + UUID.randomUUID().toString().replaceAll("-", ""))
                            .status(SessionStatus.ACTIVE)
                            .startedAt(new Date())
                            .build();
                    return tableSessionRepository.save(newSession);
                });

        if (table.getTableStatus() != TableStatus.OCCUPIED) {
            table.setTableStatus(TableStatus.OCCUPIED);
            restaurantTableRepository.save(table);
        }

        // 3. Tạo Đợt Đơn (Order Batch) riêng biệt cho lượt gửi này của khách
        OrderEntity batchOrder = OrderEntity.builder()
                .orderCode("ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .tableSession(tableSessionEntity)
                .status(OrderStatus.PENDING)
                .totalAmount(0L)
                .items(new ArrayList<>())
                .build();

        List<Long> produtIds = request.getList().stream()
                .map(OrderItemRequest::getProductId)
                .toList();

        List<ProductEntity> productEntities = productRepository.findAllById(produtIds);
        Map<Long, ProductEntity> productMap = productEntities.stream()
                .collect(Collectors.toMap(ProductEntity::getProductId, p -> p));

        for (OrderItemRequest itemRequest : request.getList()) {
            ProductEntity productEntity = productMap.get(itemRequest.getProductId());
            if (productEntity == null) {
                productEntity = productRepository.findById(itemRequest.getProductId())
                        .orElseGet(() -> productRepository.findAll().stream().findFirst().orElse(null));
            }
            if (productEntity == null) {
                throw new OrderException("Product with ID : " + itemRequest.getProductId() + " not found");
            }

            OrderItemEntity targetItem = OrderItemEntity.builder()
                    .order(batchOrder)
                    .product(productEntity)
                    .quantity(itemRequest.getQuantity())
                    .price(productEntity.getProductPrice())
                    .note(itemRequest.getNote())
                    .createdByThread(request.getThreadId())
                    .build();
            targetItem.calculatePrice();
            batchOrder.getItems().add(targetItem);
        }

        Long batchTotal = batchOrder.getItems().stream()
                .mapToLong(item -> item.getTotalPrice() != null ? item.getTotalPrice() : 0L)
                .sum();
        batchOrder.setTotalAmount(batchTotal);
        OrderEntity savedOrderEntity = orderRepository.saveAndFlush(batchOrder);

        // Tính lại tổng tiền của tất cả các đợt trong session để gửi realtime tới Sơ đồ bàn Staff POS
        List<OrderEntity> sessionActiveOrders = orderRepository.findAllByTableSessionTableSessionIdAndStatusNot(
                tableSessionEntity.getTableSessionId(), OrderStatus.CANCELLED);
        Long sessionTotalAmount = sessionActiveOrders.stream()
                .mapToLong(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0L)
                .sum();

        FloorMapResponse updatedTableMap = FloorMapResponse.builder()
                .tableId(tableSessionEntity.getTable().getTableId())
                .tableName(tableSessionEntity.getTableName())
                .status(TableStatus.OCCUPIED)
                .tempTotalAmount(sessionTotalAmount.doubleValue())
                .zone(tableSessionEntity.getTable().getZone())
                .capacity(tableSessionEntity.getTable().getCapacity())
                .build();
        webSocketPublisher.notifyFloorMapUpdate(updatedTableMap);

        // 5. Xóa giỏ hàng của thiết bị (threadId) vừa gửi đơn
        cartService.clearCart(tableSessionEntity.getTableSessionId(), request.getThreadId());

        // 6. Tạo vé bếp (KitchenTicketEntity) nguyên tử cho từng món trong đợt gửi này
        String tableName = (tableSessionEntity.getTable() != null && tableSessionEntity.getTable().getTableName() != null)
                ? tableSessionEntity.getTable().getTableName() : "Bàn 01";
        String areaName = (tableSessionEntity.getTable() != null && tableSessionEntity.getTable().getZone() != null)
                ? tableSessionEntity.getTable().getZone() : "Khu A";

        for (OrderItemEntity item : savedOrderEntity.getItems()) {
            KitchenTicketEntity ticket = KitchenTicketEntity.builder()
                    .orderId(savedOrderEntity.getId())
                    .orderItemId(item.getOrderItemId())
                    .tableNumber(tableName)
                    .areaName(areaName)
                    .productId(item.getProduct().getProductId())
                    .productName(item.getProduct().getProductName())
                    .quantity(item.getQuantity())
                    .note(item.getNote())
                    .status(KitchenItemStatus.PENDING)
                    .build();
            try {
                KitchenTicketEntity savedTicket = kitchenTicketRepository.save(ticket);
                KitchenTicketResponse ticketResponse = kitchenTicketMapper.toResponse(savedTicket);
                webSocketPublisher.notifyKitchenOrders(ticketResponse);
            } catch (Exception e) {
                org.slf4j.LoggerFactory.getLogger(OrderServiceImpl.class)
                        .error("[OrderService] Lỗi tạo vé bếp cho orderId={}: {}", savedOrderEntity.getId(), e.getMessage());
            }
        }

        return getPersonalOrder(tableSessionEntity.getTableSessionId(), request.getThreadId());
    }

    // 2. Khách mở điện thoại cá nhân lên xem -> CHỈ HIỂN THỊ MÓN DO THREAD ĐÓ ĐẶT
    @Override
    @Transactional(readOnly = true)
    public PersonalOrderResponse getPersonalOrder(Long tableSessionId, Long threadId) {

        // Smart Resolution: Thử tìm theo tableSessionId, nếu không có thử tìm session ACTIVE theo tableId
        TableSessionEntity tableSessionEntity = (tableSessionId != null)
                ? tableSessionRepository.findByTableSessionId(tableSessionId)
                        .orElseGet(() -> tableSessionRepository.findByTableTableIdAndStatus(tableSessionId, SessionStatus.ACTIVE).orElse(null))
                : null;

        if (tableSessionEntity == null) {
            return PersonalOrderResponse.builder()
                    .tableSessionId(tableSessionId != null ? tableSessionId : 0L)
                    .threadId(threadId != null ? threadId : 0L)
                    .myTotal(0L)
                    .myItems(Collections.emptyList())
                    .build();
        }

        Long actualSessionId = tableSessionEntity.getTableSessionId();
        List<OrderItemEntity> orderItemResponseList = orderItemRepository.findByOrderTableSessionTableSessionIdAndCreatedByThread(actualSessionId, threadId);

        List<OrderItemResponse> responseList = orderItemResponseList.stream()
                .map(item -> {
                    OrderItemResponse res = orderMapper.toItemResponse(item);
                    Optional<KitchenTicketEntity> ticketOpt = kitchenTicketRepository.findByOrderItemId(item.getOrderItemId());
                    if (ticketOpt.isPresent()) {
                        res.setStatus(ticketOpt.get().getStatus().name());
                    } else {
                        res.setStatus("PENDING");
                    }
                    return res;
                })
                .collect(Collectors.toList());

        return orderMapper.toPersonalResponse(tableSessionEntity.getTableSessionId(), threadId, responseList);
    }

    // 3. XEM TỔNG BÀN (Lấy tất cả các món từ mọi Order chưa bị CANCELLED của phiên bàn)
    @Override
    @Transactional(readOnly = true)
    public MasterTableOrderResponse getMasterTableOrder(Long tableId) {

        // Bước 1: Tìm Session đang ACTIVE của bàn đó
        TableSessionEntity tableSession = tableSessionRepository.findByTableTableIdAndStatus(tableId, SessionStatus.ACTIVE)
                .orElseThrow(() -> new OrderException("No active session found for table ID: " + tableId));

        // Bước 2: Tìm tất cả Order chưa bị CANCELLED thuộc session này
        List<OrderEntity> activeOrders = orderRepository.findAllByTableSessionTableSessionIdAndStatusNot(tableSession.getTableSessionId(), OrderStatus.CANCELLED);
        if (activeOrders.isEmpty()) {
            return MasterTableOrderResponse.builder()
                    .tableId(tableSession.getTable().getTableId())
                    .tableName(tableSession.getTable().getTableName())
                    .tableSessionId(tableSession.getTableSessionId())
                    .sessionStatus(tableSession.getStatus().name())
                    .totalPrice(0L)
                    .allTableItems(Collections.emptyList())
                    .build();
        }

        OrderEntity primaryOrder = activeOrders.get(0);
        List<OrderItemEntity> allItems = activeOrders.stream()
                .flatMap(o -> o.getItems().stream())
                .collect(Collectors.toList());

        List<OrderItemResponse> orderItemResponseList = allItems.stream()
                .map(orderMapper::toItemResponse)
                .collect(Collectors.toList());

        return orderMapper.toMasterResponse(primaryOrder, orderItemResponseList);
    }

    //4: BẾP / NHÂN VIÊN CẬP NHẬT TRẠNG THÁI MÓN
    @Override
    @Transactional
    public void updateOrderStatus ( Long orderId , OrderStatus status ){
        OrderEntity orderEntity = orderRepository.findById(orderId)
                .orElseThrow(()-> new OrderException("Order with ID " + orderId +" not found"));

        orderEntity.setStatus( status );
        orderRepository.save(orderEntity) ;

        Map<String, Object> payload = Map.of(
                "orderId", orderId,
                "orderCode", orderEntity.getOrderCode(),
                "status", status.name(),
                "updatedAt", System.currentTimeMillis()
        );
        webSocketPublisher.notifyClientOrderStatus(orderEntity.getTableSession().getSessionToken(), payload);
    }

    // 5. Xem lịch sử Đơn hàng
    @Override
    @Transactional(readOnly = true)
    public PageResponse<MasterTableOrderResponse> getOrderHistory(OrderStatus status, String date, Pageable pageable) {
        Date startDate = null;
        Date endDate = null;

        if (date != null && !date.trim().isEmpty() && !"ALL".equalsIgnoreCase(date.trim())) {
            try {
                java.time.LocalDate localDate = java.time.LocalDate.parse(date.trim());
                java.time.LocalDateTime startLdt = localDate.atStartOfDay();
                java.time.LocalDateTime endLdt = localDate.atTime(java.time.LocalTime.MAX);
                startDate = Date.from(startLdt.atZone(java.time.ZoneId.systemDefault()).toInstant());
                endDate = Date.from(endLdt.atZone(java.time.ZoneId.systemDefault()).toInstant());
            } catch (Exception ignored) {}
        }

        Page<OrderEntity> orderPage;
        if (startDate != null && endDate != null) {
            if (status != null) {
                orderPage = orderRepository.findWithDetailsByStatusAndCreatedAtBetween(status, startDate, endDate, pageable);
            } else {
                orderPage = orderRepository.findWithDetailsByCreatedAtBetween(startDate, endDate, pageable);
            }
        } else {
            if (status != null) {
                orderPage = orderRepository.findWithDetailsByStatus(status, pageable);
            } else {
                orderPage = orderRepository.findAllWithDetails(pageable);
            }
        }

        List<MasterTableOrderResponse> responses = orderPage.getContent().stream()
                .map(orderEntity -> {
                    List<OrderItemResponse> itemResponses = orderEntity.getItems().stream()
                            .map(orderMapper::toItemResponse)
                            .collect(Collectors.toList());
                    return orderMapper.toMasterResponse(orderEntity, itemResponses);
                })
                .collect(Collectors.toList());

        return PageResponse.<MasterTableOrderResponse>builder()
                .content(responses)
                .page(orderPage.getNumber() + 1)
                .size(orderPage.getSize())
                .totalPages(orderPage.getTotalPages())
                .totalElements(orderPage.getTotalElements())
                .build();
    }
}