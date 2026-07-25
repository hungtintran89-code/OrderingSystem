package ordersystem.backend.modules.auth.exception;

import org.springframework.http.HttpStatus;

public class BadCredentialsException extends RuntimeException{

    private final HttpStatus status ;

    public BadCredentialsException( String massage ){
        super( massage ) ;
        this.status = HttpStatus.UNAUTHORIZED ;
    }

}
