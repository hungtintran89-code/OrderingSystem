package ordersystem.backend.modules.cart.service.run;

import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.websocket.WebSocketPublisher;
import ordersystem.backend.modules.cart.domain.Cart;
import ordersystem.backend.modules.cart.domain.CartItem;
import ordersystem.backend.modules.cart.dto.request.AddToCartRequest;
import ordersystem.backend.modules.cart.dto.request.UpdateCartItemRequest;
import ordersystem.backend.modules.cart.dto.response.CartResponse;
import ordersystem.backend.modules.cart.exception.CartException;
import ordersystem.backend.modules.cart.mapper.CartMapper;
import ordersystem.backend.modules.cart.service.impl.CartService;
import ordersystem.backend.modules.catalog.dto.response.ProductResponse;
import ordersystem.backend.modules.catalog.entity.ProductEntity;
import ordersystem.backend.modules.catalog.exception.CatalogException;
import ordersystem.backend.modules.catalog.mapper.ProductMapper;
import ordersystem.backend.modules.catalog.repository.ProductRepository;
import ordersystem.backend.modules.catalog.service.impl.CatalogService;
import ordersystem.backend.modules.table.entity.TableSessionEntity;
import ordersystem.backend.modules.table.enums.SessionStatus;
import ordersystem.backend.modules.table.repository.TableSessionRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartMapper cartMapper ;
    private final TableSessionRepository tableSessionRepository;
    private final RedisTemplate<String , Object > redisTemplate ;
    private final CatalogService catalogService ;


    // Sử dụng ConcurrentHashMap để lưu trữ giỏ hàng In-Memory an toàn trong môi trường Đa Luồng (Multi-threading).
    // Key của Map dạng: "tableSessionId:threadId" (VD: "10:1001")x

    private String buildCartKey(Long tableSessionId, Long threadId) {
        return "cart:" +tableSessionId + ":" + threadId;
    }

    private void validateTableSession( Long tableSessionId ){
        String sessionKey = "table_session_key:"+tableSessionId ;

        // 1. Kiểm tra trạng thái bàn từ Redis RAM trước
        String status = ( String ) redisTemplate.opsForValue().get(sessionKey) ;

        if( status == null ){
            // 2. Nếu Redis chưa có -> Mới gọi DB để lấy và lưu lại Redis
            TableSessionEntity tableSessionEntity = tableSessionRepository.findByTableSessionId(tableSessionId)
                    .orElseThrow(() -> new CartException("Table session does not exist")) ;

            status = tableSessionEntity.getStatus().name() ;
            // Cài thời gian sống 5 tiếng
            redisTemplate.opsForValue().set(sessionKey , status , 5, TimeUnit.HOURS );
        }
        // 3. Kiểm tra trạng thái
        if( !status.equalsIgnoreCase("ACTIVE")){
            throw new CartException("The session for this table has been closed!") ;
        }
    }

    @Override
    public CartResponse addToCart(AddToCartRequest request) {
        // Kiểm tra bàn còn mở không
        validateTableSession(request.getTableSessionId());

        // Kiểm tra món ăn có tồn tại trong Database không
        ProductResponse product = catalogService.getProductById(request.getProductId());


        // Kiểm tra món ăn có đang phục vụ (available) không
        if( Boolean.FALSE.equals(product.getIsAvailable())){
            throw new CartException("Product " + product.getProductName() + " is currently out of stock!") ;
        }

        String cartKey = buildCartKey(request.getTableSessionId(), request.getThreadId() ) ;

        // 4. Lấy giỏ hàng từ Redis
        Cart cart = (Cart) redisTemplate.opsForValue().get(cartKey);
        if (cart == null) {
            cart = Cart.builder()
                    .tableSessionId(request.getTableSessionId())
                    .threadId(request.getThreadId())
                    .items(new ArrayList<>())
                    .build();
        }
        // 5. Kiểm tra và cộng dồn số lượng
        Optional<CartItem> existingItemOpt = cart.getItems().stream()
                .filter(item -> item.getProductId().equals(product.getProductId()))
                .findFirst();

        if( existingItemOpt.isPresent()){
            // Nếu đã có -> Cộng dồn số lượng và cập nhật ghi chú mới (nếu có)
            CartItem existingItem  = existingItemOpt.get() ;
            existingItem.setQuantity( existingItem.getQuantity() + request.getQuantity() );
            if( request.getNote() != null && !request.getNote().isBlank() ){
                existingItem.setNote(request.getNote());
            }
        }else{
            // Nếu chưa có -> Tạo item mới thêm vào danh sách
            CartItem newCart = CartItem.builder()
                    .productId(product.getProductId())
                    .productName(product.getProductName())
                    .productImageUrl(product.getProductImageUrl())
                    .price(product.getProductPrice())
                    .quantity(request.getQuantity())
                    .note(request.getNote())
                    .threadId(request.getThreadId())
                    .build();

            cart.getItems().add(newCart) ;
        }

        // 6. Ghi lại giỏ hàng vào Redis
        redisTemplate.opsForValue().set(cartKey, cart, 12, TimeUnit.HOURS);

        return cartMapper.mapToCartResponse(cart);
    }

    // 2. Cập nhật số lượng / ghi chú của 1 món
    @Override
    public CartResponse updateCartItem(Long tableSessionId, Long threadId, Long productId, UpdateCartItemRequest request) {
        validateTableSession(tableSessionId);

        String cartKey = buildCartKey( tableSessionId , threadId ) ;

        // 1. ĐỌC GIỎ HÀNG TỪ REDIS
        Cart cart = (Cart) redisTemplate.opsForValue().get(cartKey);

        if( cart == null ){
            throw new CartException("Cart is empty!") ;
        }

        // 2. XỬ LÝ CẬP NHẬT TRONG MẢNG JAVA
        if( request.getQuantity() <= 0 ){
            cart.getItems().removeIf( item -> item.getProductId().equals(productId) ) ;
        }else {
            // Ngược lại cập nhật số lượng và ghi chú
            CartItem cartItem = cart.getItems().stream()
                    .filter(item -> item.getProductId().equals(productId))
                    .findFirst()
                    .orElseThrow(() -> new CartException("Item not found in cart!"));
            cartItem.setQuantity(request.getQuantity());
            cartItem.setNote(request.getNote());
        }

        // 3. GHI CẬP NHẬT NÀY NGƯỢC LẠI REDIS (GIA HẠN 12 TIẾNG)
        redisTemplate.opsForValue().set(cartKey, cart, 12, TimeUnit.HOURS);

        return cartMapper.mapToCartResponse(cart) ;
    }


    // 3. Xoá 1 món ra khỏi giỏ
    @Override
    public CartResponse removeFromCart(Long tableSessionId, Long threadId, Long productId) {
        validateTableSession(tableSessionId);

        String cartKey = buildCartKey(tableSessionId, threadId);
        Cart cart = (Cart) redisTemplate.opsForValue().get(cartKey);

        if (cart != null) {
            // 2. XÓA MÓN TRONG DANH SÁCH
            cart.getItems().removeIf(item -> item.getProductId().equals(productId));

            // 3. GHI CẬP NHẬT LẠI VÀO REDIS
            redisTemplate.opsForValue().set(cartKey, cart, 12, TimeUnit.HOURS);
        }else{
            // Nếu giỏ chưa có thì trả về giỏ rỗng
            cart = Cart.builder()
                    .tableSessionId(tableSessionId)
                    .threadId(threadId)
                    .items(new ArrayList<>())
                    .build();
        }

        return cartMapper.mapToCartResponse(cart) ;
    }

    // 4. Lấy toàn bộ thông tin giỏ hàng
    @Override
    public CartResponse getCart(Long tableSessionId, Long threadId) {

        validateTableSession(tableSessionId);

        String cartKey = buildCartKey(tableSessionId , threadId ) ;

        // ĐỌC TRỰC TIẾP TỪ REDIS RAM
        Cart cart = (Cart) redisTemplate.opsForValue().get(cartKey) ;

        if( cart == null ){
            // Trả về giỏ hàng rỗng nếu chưa thêm món nào
            return CartResponse.builder()
                    .tableSessionId(tableSessionId)
                    .threadId(threadId)
                    .items(new ArrayList<>())
                    .totalItems(0L)
                    .totalAmount(0L)
                    .build();
        }
        return cartMapper.mapToCartResponse(cart);
    }

    // 5. Xoá sạch giỏ hàng
    @Override
    public CartResponse clearCart(Long tableSessionId, Long threadId) {
        String cartKey = buildCartKey(tableSessionId, threadId);

        // GỬI LỆNH "DEL cart:" TỚI REDIS SERVER
        redisTemplate.delete(cartKey);

        return CartResponse.builder()
                .tableSessionId(tableSessionId)
                .threadId(threadId)
                .items(new ArrayList<>())
                .totalItems(0L)
                .totalAmount(0L)
                .build();
    }
}
