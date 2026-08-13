package ordersystem.backend.modules.kds.service.run;

import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.websocket.WebSocketPublisher;
import ordersystem.backend.modules.auth.entity.User;
import ordersystem.backend.modules.auth.repository.UserRepository;
import ordersystem.backend.modules.kds.dto.response.ChefWorkHistoryResponse;
import ordersystem.backend.modules.kds.dto.response.KitchenItemAggregatedResponse;
import ordersystem.backend.modules.kds.dto.response.KitchenTicketResponse;
import ordersystem.backend.modules.kds.entity.KitchenTicketEntity;
import ordersystem.backend.modules.kds.enums.KitchenItemStatus;
import ordersystem.backend.modules.kds.exception.KdsException;
import ordersystem.backend.modules.kds.mapper.KitchenTicketMapper;
import ordersystem.backend.modules.kds.repository.KitchenTicketRepository;
import ordersystem.backend.modules.kds.service.impl.KitchenTicketService;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ordersystem.backend.modules.order.repository.OrderRepository;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service triển khai logic xử lý phiếu đơn bếp KDS (Kitchen Display System).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class KitchenTicketServiceImpl implements KitchenTicketService {

    private final KitchenTicketRepository kitchenTicketRepository;
    private final KitchenTicketMapper kitchenTicketMapper;
    private final WebSocketPublisher webSocketPublisher;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    // 📌 1. Lấy danh sách Màn hình chung (Bao gồm món PENDING chờ làm và COOKING đang làm)
    @Override
    public List<KitchenTicketResponse> getPendingTickets() {
        List<KitchenTicketEntity> kitchenTicketEntityList = kitchenTicketRepository
                .findByStatusInOrderByKitchenTicketIdAsc(List.of(KitchenItemStatus.PENDING, KitchenItemStatus.COOKING));
        return kitchenTicketEntityList.stream()
                .map(kitchenTicketMapper::toResponse)
                .toList();
    }

    // Helper method to resolve Principal to user entity safely
    private User resolveUser(Principal principal) {
        if (principal == null || principal.getName() == null) {
            return null;
        }
        return userRepository.findByUsername(principal.getName()).orElse(null);
    }

    // 📌 2. Lấy danh sách Màn hình cá nhân (Chỉ chứa món COOKING của chính Đầu bếp này)
    @Override
    public List<KitchenTicketResponse> getMyCookingTickets(Principal principal) {
        User cookUser = resolveUser(principal);
        Long cookUserId = cookUser != null ? cookUser.getUserId() : 8L;
        List<KitchenTicketEntity> tickets = kitchenTicketRepository.findByStatusAndAssignedCookId(KitchenItemStatus.COOKING, cookUserId);
        return tickets.stream()
                .map(kitchenTicketMapper::toResponse)
                .toList();
    }

    // 📌 3. ĐẦU BẾP BẤM "NHẬN LÀM": Chuyển từ PENDING -> COOKING
    @Override
    @Transactional
    public KitchenTicketResponse claimTicket(Long ticketId, Principal principal) {
        KitchenTicketEntity kitchenTicketEntity = kitchenTicketRepository.findByIdWithLock(ticketId)
                .orElseThrow(() -> new KdsException("Food ticket does not exist: " + ticketId));

        if (kitchenTicketEntity.getStatus() != KitchenItemStatus.PENDING) {
            throw new KdsException("The dish is being cooked");
        }

        User cookUser = resolveUser(principal);
        Long userId = cookUser != null ? cookUser.getUserId() : 8L;
        String userName = cookUser != null ? cookUser.getFullName() : (principal != null ? principal.getName() : "Đầu bếp");

        kitchenTicketEntity.setStatus(KitchenItemStatus.COOKING);
        kitchenTicketEntity.setAssignedCookId(userId);
        kitchenTicketEntity.setAssignedCookName(userName);

        KitchenTicketResponse response = kitchenTicketMapper.toResponse(kitchenTicketEntity);
        webSocketPublisher.notifyKitchenOrders(response);

        if (kitchenTicketEntity.getOrderId() != null) {
            orderRepository.findById(kitchenTicketEntity.getOrderId()).ifPresent(order -> {
                if (order.getTableSession() != null && order.getTableSession().getSessionToken() != null) {
                    webSocketPublisher.notifyClientOrderStatus(order.getTableSession().getSessionToken(), response);
                }
            });
        }

        return response;
    }

    // 📌 4. ĐẦU BẾP BẤM "ĐÃ XONG" TẠI MÀN HÌNH CÁ NHÂN: Chuyển từ COOKING -> COMPLETED
    @Override
    @Transactional
    public KitchenTicketResponse completeTicket(Long ticketId, Principal principal) {
        KitchenTicketEntity kitchenTicketEntity = kitchenTicketRepository.findByIdWithLock(ticketId)
                .orElseThrow(() -> new KdsException("Food ticket does not exist: " + ticketId));

        if (kitchenTicketEntity.getStatus() != KitchenItemStatus.COOKING) {
            // Cho phép hoàn thành trực tiếp từ PENDING nếu bếp bấm hoàn thành nhanh
            kitchenTicketEntity.setStatus(KitchenItemStatus.COOKING);
        }

        User cookUser = resolveUser(principal);
        Long cookUserId = cookUser != null ? cookUser.getUserId() : 8L;
        String userName = cookUser != null ? cookUser.getFullName() : (principal != null ? principal.getName() : "Đầu bếp");

        kitchenTicketEntity.setStatus(KitchenItemStatus.COMPLETED);
        if (kitchenTicketEntity.getAssignedCookId() == null) {
            kitchenTicketEntity.setAssignedCookId(cookUserId);
            kitchenTicketEntity.setAssignedCookName(userName);
        }

        KitchenTicketResponse response = kitchenTicketMapper.toResponse(kitchenTicketEntity);
        webSocketPublisher.notifyKitchenCompletedHistory(response);
        webSocketPublisher.notifyKitchenOrders(response);

        if (kitchenTicketEntity.getOrderId() != null) {
            orderRepository.findById(kitchenTicketEntity.getOrderId()).ifPresent(order -> {
                if (order.getTableSession() != null && order.getTableSession().getSessionToken() != null) {
                    webSocketPublisher.notifyClientOrderStatus(order.getTableSession().getSessionToken(), response);
                }
            });
        }

        return response;
    }

    // 5 : Lấy Lịch sử Hoàn thành Chung của TẤT CẢ các đầu bếp (Mới nhất lên đầu)
    @Override
    public List<KitchenTicketResponse> getSharedCompletedHistory(int limit) {
        int pageSize = limit > 0 ? limit : 50;
        List<KitchenTicketEntity> tickets = kitchenTicketRepository.findByStatusOrderByKitchenTicketIdDesc(KitchenItemStatus.COMPLETED, PageRequest.of(0, pageSize));
        return tickets.stream().map(kitchenTicketMapper::toResponse).toList();
    }

    // 6 : Lấy Lịch sử Hoàn thành từng đầu bếp (Mới nhất lên đầu)
    @Override
    public ChefWorkHistoryResponse getCookWorkHistory(Principal principal) {
        User cookUser = resolveUser(principal);
        Long cookUserId = cookUser != null ? cookUser.getUserId() : 8L;
        String cookName = cookUser != null ? cookUser.getFullName() : "Đầu bếp";

        List<KitchenTicketEntity> kitchenTicketEntityList = kitchenTicketRepository.findByAssignedCookIdAndStatusOrderByKitchenTicketIdDesc(cookUserId, KitchenItemStatus.COMPLETED);

        List<KitchenTicketResponse> ticketResponses = kitchenTicketEntityList.stream()
                .map(kitchenTicketMapper::toResponse)
                .toList();

        return ChefWorkHistoryResponse.builder()
                .cookId(cookUserId)
                .cookName(cookName)
                .totalCompletedItems(ticketResponses.size())
                .completedTickets(ticketResponses)
                .build();
    }

    /**
     * Khôi phục Ticket từ Lịch sử Hoàn thành về lại trạng thái Chế biến (COOKING / PENDING).
     * 
     * @param ticketId ID ticket KDS
     * @return KitchenTicketResponse chứa ticket sau khi khôi phục
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public KitchenTicketResponse recallTicket(Long ticketId) {
        KitchenTicketEntity ticket = kitchenTicketRepository.findById(ticketId)
                .orElseThrow(() -> new KdsException("Khái niệm ticket KDS không tồn tại: " + ticketId));

        if (ticket.getStatus() != KitchenItemStatus.COMPLETED) {
            throw new KdsException("Chỉ có thể khôi phục các đơn hàng ở trạng thái ĐÃ HOÀN THÀNH (COMPLETED)");
        }

        // Chuyển lại trạng thái về COOKING (nếu đã có đầu bếp) hoặc PENDING (nếu chưa gán)
        if (ticket.getAssignedCookId() != null) {
            ticket.setStatus(KitchenItemStatus.COOKING);
        } else {
            ticket.setStatus(KitchenItemStatus.PENDING);
        }

        KitchenTicketEntity updatedTicket = kitchenTicketRepository.save(ticket);
        KitchenTicketResponse response = kitchenTicketMapper.toResponse(updatedTicket);

        // Bắn WebSocket thông báo cập nhật KDS Realtime
        webSocketPublisher.notifyKitchenOrders(response);
        return response;
    }

    /**
     * Bảng tổng hợp số lượng món gom cần chế biến mẻ lớn (Batch Cooking Matrix).
     * 
     * @return Danh sách KitchenItemAggregatedResponse gom nhóm theo tên sản phẩm
     */
    @Override
    public List<KitchenItemAggregatedResponse> getAggregatedDishes() {
        List<KitchenTicketEntity> activeTickets = kitchenTicketRepository.findByStatus(KitchenItemStatus.PENDING);

        Map<String, Long> aggregatedMap = activeTickets.stream()
                .collect(Collectors.groupingBy(
                        KitchenTicketEntity::getProductName,
                        Collectors.summingLong(KitchenTicketEntity::getQuantity)
                ));

        return aggregatedMap.entrySet().stream()
                .map(entry -> KitchenItemAggregatedResponse.builder()
                        .productName(entry.getKey())
                        .totalQuantity(entry.getValue().intValue())
                        .build())
                .toList();
    }
}
