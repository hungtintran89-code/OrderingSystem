package ordersystem.backend.modules.kds.dto;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TableQuantityDetail {
    private String tableNumber;
    private Integer quantity;
    private String note;
}