package ordersystem.backend.modules.kds.service.impl;


import ordersystem.backend.modules.kds.dto.response.ChefWorkHistoryResponse;
import ordersystem.backend.modules.kds.dto.response.KitchenItemAggregatedResponse;
import ordersystem.backend.modules.kds.dto.response.KitchenTicketResponse;
import ordersystem.backend.modules.kds.enums.KitchenItemStatus;
import ordersystem.backend.modules.kds.enums.KitchenStation;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface KitchenTicketService {
    List<KitchenTicketResponse> getAllActiveTickets();

    KitchenTicketResponse claimTicket(Long ticketId, Long cookUserId, String cookName);

    KitchenTicketResponse completeTicket(Long ticketId, Long cookUserId);

    ChefWorkHistoryResponse getCookWorkHistory(Long cookUserId);

}