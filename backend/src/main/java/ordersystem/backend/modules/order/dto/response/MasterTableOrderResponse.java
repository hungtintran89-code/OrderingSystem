package ordersystem.backend.modules.order.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ordersystem.backend.modules.order.enums.TableStatus;
import org.aspectj.weaver.ast.Or;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;



@Getter @Setter
@NoArgsConstructor
@PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN') or hasRole('STAFF')")
public class MasterTableOrderResponse {

    private Long table_id ;
    private String table_name ;
    private Long table_session_id;
    private String session_status ;
    private Long total_price ;
    private Date onpen_at ;
    private List<OrderItemResponse> allTableItems  = new ArrayList<>() ;

    public MasterTableOrderResponse(Long table_id, String table_name, Long table_session_id, String session_status, Long total_price, Date onpen_at, List<OrderItemResponse> allTableItems) {
        this.table_id = table_id;
        this.table_name = table_name;
        this.table_session_id = table_session_id;
        this.session_status = session_status;
        this.total_price = total_price;
        this.onpen_at = onpen_at;
        this.allTableItems = allTableItems;
    }
}