package ordersystem.backend.modules.kds.dto.response;


import lombok.*;
import org.springframework.stereotype.Component;

import java.util.List;


@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ChefWorkHistoryResponse {
    private Long cookId;
    private String cookName;
    private Integer totalCompletedItems;
    private Double avgCookingTimeMinutes;
    private List<KitchenTicketResponse> completedTickets;
}
