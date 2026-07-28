package ordersystem.backend.modules.order.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.aspectj.weaver.ast.Or;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;



@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN') or hasRole('STAFF')")
public class MasterTableOrderResponse {

    private Long table_id ;
    private String table_name ;
    private Long table_session_id;
    private Long session_status ;
    private Long total_price ;
    private Date onpen_at ;
    private List<OrderItemResponse> allTableItems  = new ArrayList<>() ;


}