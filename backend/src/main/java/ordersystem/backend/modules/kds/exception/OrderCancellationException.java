package ordersystem.backend.modules.kds.exception;


public class OrderCancellationException extends RuntimeException {
    public OrderCancellationException(String message) {
        super(message);
    }
}
