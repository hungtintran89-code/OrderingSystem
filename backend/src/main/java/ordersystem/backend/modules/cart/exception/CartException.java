package ordersystem.backend.modules.cart.exception;



// Exception riêng cho module Cart kế thừa từ RuntimeException
public class CartException extends RuntimeException {
    public CartException(String message) {
        super(message);
    }
}