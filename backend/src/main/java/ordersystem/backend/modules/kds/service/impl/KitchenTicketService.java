package ordersystem.backend.modules.kds.service.impl;

import ordersystem.backend.modules.kds.dto.response.ChefWorkHistoryResponse;
import ordersystem.backend.modules.kds.dto.response.KitchenItemAggregatedResponse;
import ordersystem.backend.modules.kds.dto.response.KitchenTicketResponse;
import org.springframework.stereotype.Service;

import java.security.Principal;
import java.util.List;

/**
 * Interface Service định nghĩa các phương thức xử lý phiếu đơn bếp KDS.
 */
@Service
public interface KitchenTicketService {

    List<KitchenTicketResponse> getPendingTickets();

    List<KitchenTicketResponse> getMyCookingTickets(Long cookUserId);

    KitchenTicketResponse claimTicket(Long ticketId, Principal principal);

    KitchenTicketResponse completeTicket(Long ticketId, Long cookUserId);

    ChefWorkHistoryResponse getCookWorkHistory(Long cookUserId);

    List<KitchenTicketResponse> getSharedCompletedHistory(int limit);

    /**
     * Khôi phục ticket từ Lịch sử Hoàn thành về lại màn hình Bếp đang làm.
     * @param ticketId ID ticket cần khôi phục
     * @return KitchenTicketResponse ticket sau khi khôi phục
     */
    KitchenTicketResponse recallTicket(Long ticketId);

    /**
     * Bảng tổng hợp số lượng món gom nấu mẻ lớn khi nhà hàng đông khách.
     * @return Danh sách món ăn gom tổng hợp
     */
    List<KitchenItemAggregatedResponse> getAggregatedDishes();
}