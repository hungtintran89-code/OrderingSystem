package ordersystem.backend.modules.cart.service.run;

import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.advice.WebSocketPublisher;
import ordersystem.backend.modules.cart.domain.Cart;
import ordersystem.backend.modules.cart.domain.CartItem;
import ordersystem.backend.modules.cart.dto.request.AddToCartRequest;
import ordersystem.backend.modules.cart.dto.request.UpdateCartItemRequest;
import ordersystem.backend.modules.cart.dto.response.CartResponse;
import ordersystem.backend.modules.cart.exception.CartException;
import ordersystem.backend.modules.cart.mapper.CartMapper;
import ordersystem.backend.modules.cart.service.impl.CartService;
import ordersystem.backend.modules.catalog.entity.ProductEntity;
import ordersystem.backend.modules.catalog.repository.ProductRepository;
import ordersystem.backend.modules.table.entity.TableSessionEntity;
import ordersystem.backend.modules.table.enums.SessionStatus;
import ordersystem.backend.modules.table.repository.TableSessionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartMapper cartMapper ;
    private final ProductRepository productRepository;
    private final TableSessionRepository tableSessionRepository;
    private final WebSocketPublisher webSocketPublisher ;

    // Sử dụng ConcurrentHashMap để lưu trữ giỏ hàng In-Memory an toàn trong môi trường Đa Luồng (Multi-threading).
    // Key của Map dạng: "tableSessionId:threadId" (VD: "10:1001")x
    private final Map<String, Cart> cartStore = new ConcurrentHashMap<>();

    private String buildCartKey(Long tableSessionId, Long threadId) {
        return tableSessionId + ":" + threadId;
    }

    private void validateTableSession( Long tableSessionId ){
        TableSessionEntity tableSessionEntity = tableSessionRepository.findByTableSessionId(tableSessionId)
                .orElseThrow(()-> new CartException("Table session with ID " + tableSessionId + " does not exist")) ;
        if( tableSessionEntity.getStatus() != SessionStatus.ACTIVE){
            throw new CartException("The session for this table has been closed!") ;
        }
    }

    @Override
    public CartResponse addToCart(AddToCartRequest request) {
        // Kiểm tra bàn còn mở không
        validateTableSession(request.getTableSessionId());

        // Kiểm tra món ăn có tồn tại trong Database không
        ProductEntity product = productRepository.findByProductId(request.getProductId())
                .orElseThrow( ()-> new CartException("Product with ID " + request.getProductId() + " not found")) ;

        // Kiểm tra món ăn có đang phục vụ (available) không
        if( Boolean.FALSE.equals(product.getProductIsAvailable())){
            throw new CartException("Product " + product.getProductName() + " is currently out of stock!") ;
        }

        String cartKey = buildCartKey(request.getTableSessionId(), request.getThreadId() ) ;

        // Lấy giỏ hàng hiện tại hoặc tạo mới giỏ rỗng nếu chưa có
        Cart cart = cartStore.computeIfAbsent( cartKey , k -> Cart.builder()
                .tableSessionId(request.getTableSessionId())
                .threadId(request.getThreadId())
                .items( new ArrayList<>())
                .build()) ;

        // Kiểm tra xem món ăn này đã có sẵn trong giỏ chưa
        Optional<CartItem> existingItemOpt = cart.getItems().stream()
                .filter(item -> item.getProductId().equals(request.getProductId()))
                .findFirst() ;
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

        CartResponse response = cartMapper.mapToCartResponse(cart);
        // BẮN THÔNG BÁO REAL-TIME: Gửi giỏ hàng mới cho tất cả điện thoại thuộc bàn này
        webSocketPublisher.notifyCartUpdate(request.getTableSessionId(), response);
        return response;
    }

    // 2. Cập nhật số lượng / ghi chú của 1 món
    @Override
    public CartResponse updateCartItem(Long tableSessionId, Long threadId, Long productId, UpdateCartItemRequest request) {
        validateTableSession(tableSessionId);

        String cartKey = buildCartKey( tableSessionId , threadId ) ;
        Cart cart = cartStore.get(cartKey) ;

        if( cart == null ){
            throw new CartException("Cart is empty!") ;
        }

        // Nếu số lượng = 0 thì tiến hành xoá món khỏi giỏ
        if( request.getQuantity() <= 0 ){
            cart.getItems().removeIf( item -> item.getProductId().equals(productId) ) ;
        }else{
            // Ngược lại cập nhật số lượng và ghi chú
            CartItem cartItem = cart.getItems().stream()
                    .filter( item -> item.getProductId().equals(productId))
                    .findFirst()
                    .orElseThrow(() -> new CartException("Item not found in cart!")) ;
            cartItem.setQuantity(request.getQuantity());
            cartItem.setNote(request.getNote());
        }
        CartResponse response = cartMapper.mapToCartResponse(cart);
        // BẮN THÔNG BÁO REAL-TIME: Cập nhật giỏ hàng Real-time cho cả bàn
        webSocketPublisher.notifyCartUpdate(tableSessionId, response);
        return response;
    }


    // 3. Xoá 1 món ra khỏi giỏ
    @Override
    public CartResponse removeFromCart(Long tableSessionId, Long threadId, Long productId) {
        validateTableSession(tableSessionId);

        String cartKey = buildCartKey(tableSessionId, threadId);
        Cart cart = cartStore.get(cartKey);

        if (cart != null) {
            cart.getItems().removeIf(item -> item.getProductId().equals(productId));
        }

        return cartMapper.mapToCartResponse(cart) ;
    }

    // 4. Lấy toàn bộ thông tin giỏ hàng
    @Override
    public CartResponse getCart(Long tableSessionId, Long threadId) {

        validateTableSession(tableSessionId);

        String cartKey = buildCartKey(tableSessionId , threadId ) ;
        Cart cart = cartStore.get(cartKey) ;

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
    public void clearCart(Long tableSessionId, Long threadId) {
        String cartKey = buildCartKey(tableSessionId, threadId);
        cartStore.remove(cartKey);
        // BẮN THÔNG BÁO REAL-TIME: Báo giỏ hàng đã bị làm rỗng cho các máy cùng bàn
        CartResponse emptyCart = CartResponse.builder()
                .tableSessionId(tableSessionId)
                .threadId(threadId)
                .items(new ArrayList<>())
                .totalItems(0L)
                .totalAmount(0L)
                .build();
        webSocketPublisher.notifyCartUpdate(tableSessionId, emptyCart);
    }



}
