package ordersystem.backend.modules.auth.exception;

import org.springframework.http.HttpStatus;

public class UserAlreadyExistsException extends RuntimeException {

    private final HttpStatus status ;

    public UserAlreadyExistsException( String message ){
        super(message) ;
        this.status = HttpStatus.BAD_REQUEST ;
    }
}
