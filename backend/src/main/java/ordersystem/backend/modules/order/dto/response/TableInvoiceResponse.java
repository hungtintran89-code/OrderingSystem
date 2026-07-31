package ordersystem.backend.modules.order.dto.response;


import lombok.*;
import ordersystem.backend.modules.order.entity.OrderItemEntity;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class TableInvoiceResponse {

    private Long invoiceCode ;
    private Long tableId ;
    private String tableName ;
    private Long tableSessionId ;

    List<OrderItemResponse> orderItemEntityList = new ArrayList<>() ;

    private Long totalPrice ;
    private Long vat ;
    private Long discount ;
    private Long finalTotalPrice ;
    private Date createAt ;


}
