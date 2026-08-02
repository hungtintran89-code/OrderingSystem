package ordersystem.backend.modules.cart.controller;


import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.payload.ApiResponse;
import ordersystem.backend.modules.cart.dto.request.AddToCartRequest;
import ordersystem.backend.modules.cart.dto.request.UpdateCartItemRequest;
import ordersystem.backend.modules.cart.dto.response.CartResponse;
import ordersystem.backend.modules.cart.service.impl.CartService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
public class CartController {

    final private CartService cartService ;

    // API 1: Thêm món vào giỏ hàng (POST /api/v1/cart)
    @PostMapping
    public ResponseEntity<ApiResponse<CartResponse>> addToCart(@Valid @RequestBody AddToCartRequest request) {
        CartResponse cartResponse = cartService.addToCart(request);
        return ResponseEntity.ok(ApiResponse.<CartResponse>builder()
                .code(HttpStatus.OK.value())
                .message("Item added to cart successfully")
                .data(cartResponse)
                .build());
    }

    // API 2: Lấy chi tiết giỏ hàng của phiên bàn (GET /api/v1/cart?tableSessionId=1&threadId=101)
    @GetMapping
    public ResponseEntity<ApiResponse<CartResponse>> getCart(
            @RequestParam Long tableSessionId,
            @RequestParam Long threadId) {
        CartResponse cartResponse = cartService.getCart(tableSessionId, threadId);
        return ResponseEntity.ok(ApiResponse.<CartResponse>builder()
                .code(HttpStatus.OK.value())
                .message("Cart retrieved successfully")
                .data(cartResponse)
                .build());
    }

    // API 3: Cập nhật số lượng / ghi chú của 1 món (PUT /api/v1/cart/items/{productId}?tableSessionId=1&threadId=101)
    @PutMapping("/items/{productId}")
    public ResponseEntity<ApiResponse<CartResponse>> updateCartItem(
            @RequestParam Long tableSessionId,
            @RequestParam Long threadId,
            @PathVariable Long productId,
            @Valid @RequestBody UpdateCartItemRequest request) {
        CartResponse cartResponse = cartService.updateCartItem(tableSessionId, threadId, productId, request);
        return ResponseEntity.ok(ApiResponse.<CartResponse>builder()
                .code(HttpStatus.OK.value())
                .message("Cart item updated successfully")
                .data(cartResponse)
                .build());
    }

    // API 4: Xoá 1 món khỏi giỏ (DELETE /api/v1/cart/items/{productId}?tableSessionId=1&threadId=101)
    @DeleteMapping("/items/{productId}")
    public ResponseEntity<ApiResponse<CartResponse>> removeFromCart(
            @RequestParam Long tableSessionId,
            @RequestParam Long threadId,
            @PathVariable Long productId) {
        CartResponse cartResponse = cartService.removeFromCart(tableSessionId, threadId, productId);
        return ResponseEntity.ok(ApiResponse.<CartResponse>builder()
                .code(HttpStatus.OK.value())
                .message("Item removed from cart successfully")
                .data(cartResponse)
                .build());
    }

    // API 5: Làm sạch giỏ hàng (DELETE /api/v1/cart/clear?tableSessionId=1&threadId=101)
    @DeleteMapping("/clear")
    public ResponseEntity<ApiResponse<Void>> clearCart(
            @RequestParam Long tableSessionId,
            @RequestParam Long threadId) {
        cartService.clearCart(tableSessionId, threadId);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .code(HttpStatus.OK.value())
                .message("Cart cleared successfully")
                .build());
    }


}
