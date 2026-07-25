package ordersystem.backend.common.payload;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.util.Date;




@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private int code ;
    private String message ;
    private T data ;
    private Date timestamp ;

    public static <T> ApiResponse<T> success( String message , T data ){
        return ApiResponse.<T>builder()
                .code( 200 )
                .message( message )
                .data( data)
                .timestamp( new Date())
                .build();
    }

    public static <T> ApiResponse<T> created( String message , T data ){
        return ApiResponse.<T>builder()
                .code( 201 )
                .message( message )
                .data( data)
                .timestamp( new Date())
                .build();
    }

    public static <T> ApiResponse<T> error( String message , int code){
        return ApiResponse.<T>builder()
                .code( code  )
                .message( message )
                .timestamp( new Date())
                .build();
    }


}
