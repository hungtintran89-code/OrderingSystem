package ordersystem.backend.modules.cart.service.impl;

import ordersystem.backend.modules.cart.dto.request.AddToCartRequest;
import ordersystem.backend.modules.cart.dto.request.UpdateCartItemRequest;
import ordersystem.backend.modules.cart.dto.response.CartResponse;
import org.springframework.stereotype.Service;


@Service
public interface CartService {

    // Thêm món vào giỏ hàng
    CartResponse addToCart(AddToCartRequest request);

    // Cập nhật số lượng / ghi chú của 1 món trong giỏ
    CartResponse updateCartItem(Long tableSessionId, Long threadId, Long productId, UpdateCartItemRequest request);

    // Xoá 1 món khỏi giỏ hàng
    CartResponse removeFromCart(Long tableSessionId, Long threadId, Long productId);

    // Lấy thông tin giỏ hàng hiện tại
    CartResponse getCart(Long tableSessionId, Long threadId);

    // Xoá sạch giỏ hàng (khi đặt món thành công hoặc huỷ giỏ)
    CartResponse clearCart(Long tableSessionId, Long threadId);

}
