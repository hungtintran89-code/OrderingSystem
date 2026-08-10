package ordersystem.backend.modules.kds.service.run;

import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.websocket.WebSocketPublisher;
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

    // 📌 1. Lấy danh sách Màn hình chung (Chỉ chứa món PENDING chưa ai nhận)
    @Override
    public List<KitchenTicketResponse> getPendingTickets() {
        List<KitchenTicketEntity> kitchenTicketEntityList = kitchenTicketRepository.findByStatus(KitchenItemStatus.PENDING);
        return kitchenTicketEntityList.stream()
                .map(kitchenTicketMapper::toResponse)
                .toList();
    }

    // 📌 2. Lấy danh sách Màn hình cá nhân (Chỉ chứa món COOKING của chính Đầu bếp này)
    @Override
    public List<KitchenTicketResponse> getMyCookingTickets(Long cookUserId) {
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

        Long userId = Long.parseLong(principal.getName());
        String userName = userRepository.findById(userId)
                .orElseThrow(() -> new KdsException("Not found user"))
                .getFullName();

        kitchenTicketEntity.setStatus(KitchenItemStatus.COOKING);
        kitchenTicketEntity.setAssignedCookId(userId);
        kitchenTicketEntity.setAssignedCookName(userName);

        KitchenTicketResponse response = kitchenTicketMapper.toResponse(kitchenTicketEntity);
        webSocketPublisher.notifyKitchenOrders(response);
        return response;
    }

    // 📌 4. ĐẦU BẾP BẤM "ĐÃ XONG" TẠI MÀN HÌNH CÁ NHÂN: Chuyển từ COOKING -> COMPLETED
    @Override
    @Transactional
    public KitchenTicketResponse completeTicket(Long ticketId, Long cookUserId) {
        KitchenTicketEntity kitchenTicketEntity = kitchenTicketRepository.findByIdWithLock(ticketId)
                .orElseThrow(() -> new KdsException("Food ticket does not exist: " + ticketId));

        if (kitchenTicketEntity.getStatus() != KitchenItemStatus.COOKING) {
            throw new KdsException("The dish is not currently being cooked!");
        }

        // CHỈ ĐẦU BẾP ĐÃ NHẬN MÓN NÀY MỚI CÓ QUYỀN BẤM ĐÃ XONG!
        if (kitchenTicketEntity.getAssignedCookId() != null && !kitchenTicketEntity.getAssignedCookId().equals(cookUserId)) {
            throw new KdsException("You cannot mark the dish as complete because chef [" + kitchenTicketEntity.getAssignedCookName() + "] is currently preparing it!");
        }

        kitchenTicketEntity.setStatus(KitchenItemStatus.COMPLETED);
        KitchenTicketResponse response = kitchenTicketMapper.toResponse(kitchenTicketEntity);
        webSocketPublisher.notifyKitchenCompletedHistory(response);
        webSocketPublisher.notifyKitchenOrders(response);
        return response;
    }

    // 5 : Lấy Lịch sử Hoàn thành Chung của TẤT CẢ các đầu bếp
    @Override
    public List<KitchenTicketResponse> getSharedCompletedHistory(int limit) {
        int pageSize = limit > 0 ? limit : 50;
        List<KitchenTicketEntity> tickets = kitchenTicketRepository.findByStatus(KitchenItemStatus.COMPLETED, PageRequest.of(0, pageSize));
        return tickets.stream().map(kitchenTicketMapper::toResponse).toList();
    }

    // 6 : Lấy Lịch sử Hoàn thành từng đầu bếp
    @Override
    public ChefWorkHistoryResponse getCookWorkHistory(Long cookUserId) {
        List<KitchenTicketEntity> kitchenTicketEntityList = kitchenTicketRepository.findByAssignedCookIdAndStatus(cookUserId, KitchenItemStatus.COMPLETED);

        String cookName = userRepository.findById(cookUserId)
                .orElseThrow(() -> new KdsException("Not found cooker"))
                .getFullName();

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
