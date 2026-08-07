package ordersystem.backend.modules.cart.mapper;

import ordersystem.backend.modules.cart.domain.Cart;
import ordersystem.backend.modules.cart.dto.response.CartItemResponse;
import ordersystem.backend.modules.cart.dto.response.CartResponse;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;


@Component
public class CartMapper {

    public CartResponse mapToCartResponse(Cart cart) {
        if (cart == null) {
            return null;
        }
        var itemResponses = cart.getItems().stream()
                .map(item -> CartItemResponse.builder()
                        .productId(item.getProductId())
                        .productName(item.getProductName())
                        .productImageUrl(item.getProductImageUrl())
                        .price(item.getPrice())
                        .quantity(item.getQuantity())
                        .totalPrice(item.getTotalPrice())
                        .note(item.getNote())
                        .threadId(item.getThreadId())
                        .build())
                .collect(Collectors.toList());
        return CartResponse.builder()
                .tableSessionId(cart.getTableSessionId())
                .threadId(cart.getThreadId())
                .items(itemResponses)
                .totalItems(cart.getTotalItems())
                .totalAmount(cart.getTotalAmount())
                .build();
    }

}
