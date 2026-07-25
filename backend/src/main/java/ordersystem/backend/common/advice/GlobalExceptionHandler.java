package ordersystem.backend.common.advice;

import ordersystem.backend.common.payload.ApiResponse;
import ordersystem.backend.modules.auth.exception.BadCredentialsException;
import ordersystem.backend.modules.auth.exception.UserAlreadyExistsException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error( ex.getMessage() , 401 ) );
    }
    @ExceptionHandler(UserAlreadyExistsException.class)
    public ResponseEntity<ApiResponse<Void>> handleUserExists(UserAlreadyExistsException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error( ex.getMessage() , 400 ));
    }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
        String defaultMessage = ex.getBindingResult().getAllErrors().get(0).getDefaultMessage();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error( defaultMessage , 400) );
    }
}