package ordersystem.backend.common.advice;

import lombok.extern.slf4j.Slf4j;
import ordersystem.backend.common.exception.ResourceNotFoundException;
import ordersystem.backend.common.payload.ApiResponse;
import ordersystem.backend.modules.auth.exception.BadCredentialsException;
import ordersystem.backend.modules.auth.exception.UserAlreadyExistsException;
import ordersystem.backend.modules.catalog.exception.CatalogException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {


    // 0. Lỗi 400: Catalog Exception (Trùng món ăn, Danh mục)
    @ExceptionHandler(CatalogException.class)
    public ResponseEntity<ApiResponse<Void>> handleCatalogException(CatalogException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ex.getMessage(), 400));
    }

    // 0b. Lỗi 400: IllegalArgumentException (Nghiệp vụ bàn, khu vực...)
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgumentException(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ex.getMessage(), 400));
    }

    // 1. Lỗi 401: Sai tài khoản/mật khẩu
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error( ex.getMessage() , 401 ) );
    }

    // 2. Lỗi 400: User/Dữ liệu đã tồn tại
    @ExceptionHandler(UserAlreadyExistsException.class)
    public ResponseEntity<ApiResponse<Void>> handleUserExists(UserAlreadyExistsException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error( ex.getMessage() , 400 ));
    }

    // 3. Lỗi 404: Không tìm thấy tài nguyên (User, Table, Product, Order)
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleResourceNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(ex.getMessage(), 404));
    }

    // 4. Lỗi 400: Validate DTO thất bại (@NotBlank, @NotNull...)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "Validation Failed");
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(error.getField(), error.getDefaultMessage());
        }
        body.put("errors", fieldErrors);
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }
    // 5. Lỗi 400: JSON bị sai cú pháp hoặc sai kiểu dữ liệu
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleMalformedJson(HttpMessageNotReadableException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Malformed JSON request or invalid data types", 400));
    }

    // 6. Lỗi 400: Thiếu tham số RequestParam bắt buộc
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiResponse<Void>> handleMissingParams(MissingServletRequestParameterException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Missing required parameter: " + ex.getParameterName(), 400));
    }
    // 7. Lỗi 405: Gọi sai HTTP Method (GET thay vì POST...)
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(ApiResponse.error("HTTP method " + ex.getMethod() + " is not supported for this endpoint", 405));
    }

    // 8. Lỗi 403: Không có quyền truy cập (Method-level security)
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("Access denied: You do not have permission", 403));
    }

    // 9. Lỗi CSDL (Ràng buộc CSDL, trùng lặp key, NULL constraint): Trả về thông báo Tiếng Việt sạch sẽ
    @ExceptionHandler({org.springframework.dao.DataIntegrityViolationException.class, org.hibernate.JDBCException.class})
    public ResponseEntity<ApiResponse<Void>> handleDataIntegrityViolation(Exception ex) {
        log.error("[DATABASE ERROR] Data integrity violation: ", ex);
        String causeMsg = ex.getCause() != null ? ex.getCause().getMessage() : ex.getMessage();
        String userMsg = "Lỗi hệ thống CSDL: Dữ liệu không hợp lệ hoặc vi phạm ràng buộc!";
        if (causeMsg != null && (causeMsg.contains("value too long") || causeMsg.contains("varying"))) {
            userMsg = "Dữ liệu hình ảnh hoặc thông tin nhập vào quá dài. Vui lòng chọn hình ảnh có dung lượng nhỏ hơn!";
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(userMsg, 400));
    }

    // 10. Lỗi 500: Lỗi hệ thống không lường trước (Catch-all trả về Tiếng Việt mượt mà)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGlobalException(Exception ex) {
        log.error("[SYSTEM ERROR] Unexpected error occurred: ", ex);
        String msg = ex.getMessage();
        if (msg != null && (msg.contains("value too long") || msg.contains("varying") || msg.contains("statement"))) {
            msg = "Dữ liệu hình ảnh hoặc thông tin quá dài. Vui lòng chọn ảnh dung lượng nhỏ hơn!";
        } else {
            msg = "Đã có lỗi hệ thống xảy ra. Vui lòng thử lại sau!";
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(msg, 500));
    }
}