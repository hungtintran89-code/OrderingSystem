package ordersystem.backend.modules.kds.service.run;

import lombok.RequiredArgsConstructor;
import ordersystem.backend.modules.auth.repository.UserRepository;
import ordersystem.backend.modules.kds.dto.response.ChefWorkHistoryResponse;
import ordersystem.backend.modules.kds.dto.response.KitchenTicketResponse;
import ordersystem.backend.modules.kds.entity.KitchenTicketEntity;
import ordersystem.backend.modules.kds.enums.KitchenItemStatus;
import ordersystem.backend.modules.kds.exception.KdsException;
import ordersystem.backend.modules.kds.mapper.KitchenTicketMapper;
import ordersystem.backend.modules.kds.repository.KitchenTicketRepository;
import ordersystem.backend.modules.kds.service.impl.KitchenTicketService;
import ordersystem.backend.modules.kds.websocket.KitchenWebSocketPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.RequestBody;

import java.security.Principal;
import java.time.ZonedDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class KitchenTicketServiceImpl implements KitchenTicketService {

    final private KitchenTicketRepository kitchenTicketRepository ;
    final private KitchenTicketMapper kitchenTicketMapper ;
    final private KitchenWebSocketPublisher webSocketPublisher ;
    final private UserRepository userRepository ;


    // 📌 1. Lấy danh sách Màn hình chung (Chỉ chứa món PENDING chưa ai nhận)
    @Override
    @Transactional
    public List<KitchenTicketResponse> getPendingTickets() {
        List<KitchenTicketEntity> kitchenTicketEntityList = kitchenTicketRepository.findByStatus(KitchenItemStatus.PENDING ) ;
        return kitchenTicketEntityList.stream()
                .map(kitchenTicketMapper::toResponse)
                .toList() ;
    }

    // 📌 2. Lấy danh sách Màn hình cá nhân (Chỉ chứa món COOKING của chính Đầu bếp này)
    @Override
    @Transactional( readOnly = true )
    public List<KitchenTicketResponse> getMyCookingTickets(Long cookUserId) {
        List<KitchenTicketEntity> tickets = kitchenTicketRepository.findMyCookingTickets(cookUserId);
        return tickets.stream()
                .map(kitchenTicketMapper::toResponse)
                .toList();
    }

    // 📌 3. ĐẦU BẾP BẤM "NHẬN LÀM": Chuyển từ PENDING -> COOKING
    @Override
    @Transactional
    public KitchenTicketResponse claimTicket ( Long ticketId, Principal principal ){
        KitchenTicketEntity kitchenTicketEntity = kitchenTicketRepository.findByIdWithLock( ticketId )
                .orElseThrow( ()-> new KdsException("Food ticket does not exist:")) ;

        if( kitchenTicketEntity.getStatus() != KitchenItemStatus.PENDING){
            throw new KdsException("The dish is being cooking") ;
        }

        Long userId = Long.parseLong((principal.getName())) ;
        String userName = userRepository.findById(userId).orElseThrow(()->new KdsException("Not found user")).getFullName() ;
        kitchenTicketEntity.setStatus(KitchenItemStatus.COOKING);
        kitchenTicketEntity.setAssignedCookId(userId);
        kitchenTicketEntity.setAssignedCookName(userName);

        KitchenTicketResponse response = kitchenTicketMapper.toResponse(kitchenTicketEntity);
        webSocketPublisher.broadcastKitchenEvent(response);
        return response ;
    }

    // 📌 4. ĐẦU BẾP BẤM "ĐÃ XONG" TẠI MÀN HÌNH CÁ NHÂN: Chuyển từ COOKING -> COMPLETED
    @Override
    @Transactional
    public KitchenTicketResponse completeTicket(Long ticketId, Long cookUserId) {

        KitchenTicketEntity kitchenTicketEntity = kitchenTicketRepository.findByIdWithLock( ticketId )
                .orElseThrow( ()-> new KdsException("Food ticket does not exist:")) ;

        if( kitchenTicketEntity.getStatus() != KitchenItemStatus.COOKING){
            throw new KdsException("The dish is not currently being cooked!") ;
        }

        // Rào cản bảo mật: CHỈ ĐẦU BẾP ĐÃ NHẬN MÓN NÀY MỚI CÓ QUYỀN BẤM ĐÃ XONG!
        if (kitchenTicketEntity.getAssignedCookId() != null && ! kitchenTicketEntity.getAssignedCookId().equals(cookUserId)) {
            throw new KdsException("You cannot mark the dish as complete because chef [" + kitchenTicketEntity.getAssignedCookName() + "] is currently preparing it!");
        }

        kitchenTicketEntity.setStatus(KitchenItemStatus.COMPLETED);
        KitchenTicketResponse response = kitchenTicketMapper.toResponse(kitchenTicketEntity) ;
        webSocketPublisher.broadcastToSharedCompletedHistory(response);
        webSocketPublisher.broadcastKitchenEvent(response);
        return response ;
    }

    // 5 : Lấy Lịch sử Hoàn thành Chung của TẤT CẢ các đầu bếp
    @Override
    @Transactional(readOnly = true)
    public List<KitchenTicketResponse> getSharedCompletedHistory(int limit) {
        int pageSize = limit > 0 ? limit : 50; // Mặc định lấy 50 món mới nhất
        List<KitchenTicketEntity> tickets = kitchenTicketRepository.findSharedCompletedHistory(PageRequest.of(0, pageSize));
        return tickets.stream().map(kitchenTicketMapper::toResponse).toList();
    }

    //// 6 : Lấy Lịch sử Hoàn thành từng các đầu bếp
    @Override
    @Transactional(readOnly = true)
    public ChefWorkHistoryResponse getCookWorkHistory(Long cookUserId) {

        List<KitchenTicketEntity> kitchenTicketEntityList = kitchenTicketRepository.findByAssignedCookIdAndStatus(cookUserId , KitchenItemStatus.COMPLETED);;

        String cookName = userRepository.findById(cookUserId)
                .orElseThrow(()-> new KdsException("Not found cooker")).getFullName() ;

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

}
