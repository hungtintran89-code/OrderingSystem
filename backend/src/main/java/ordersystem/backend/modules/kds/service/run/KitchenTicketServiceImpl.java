package ordersystem.backend.modules.kds.service.run;

import lombok.RequiredArgsConstructor;
import ordersystem.backend.modules.kds.dto.response.KitchenTicketResponse;
import ordersystem.backend.modules.kds.entity.KitchenTicketEntity;
import ordersystem.backend.modules.kds.enums.KitchenItemStatus;
import ordersystem.backend.modules.kds.exception.KdsException;
import ordersystem.backend.modules.kds.mapper.KitchenTicketMapper;
import ordersystem.backend.modules.kds.repository.KitchenTicketRepository;
import ordersystem.backend.modules.kds.service.impl.KitchenTicketService;
import ordersystem.backend.modules.kds.websocket.KitchenWebSocketPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.RequestBody;

import java.time.ZonedDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class KitchenTicketServiceImpl implements KitchenTicketService {

    final private KitchenTicketRepository kitchenTicketRepository ;
    final private KitchenTicketMapper kitchenTicketMapper ;
    final private KitchenWebSocketPublisher webSocketPublisher ;


    @Override
    @Transactional
    public List<KitchenTicketResponse> getAllActiveTickets() {
        List<KitchenTicketEntity> kitchenTicketEntityList = kitchenTicketRepository.findAllStatusOrStatus(KitchenItemStatus.PENDING , KitchenItemStatus.COOKING) ;
        return kitchenTicketEntityList.stream()
                .map(kitchenTicketMapper::toResponse)
                .toList() ;
    }

    @Override
    @Transactional
    public KitchenTicketResponse claimTicket ( Long ticketId, Long cookUserId, String cookName ){

        KitchenTicketEntity kitchenTicketEntity = kitchenTicketRepository.findById( ticketId )
                .orElseThrow( ()-> new KdsException("Food ticket does not exist:")) ;

        if (kitchenTicketEntity.getStatus() == KitchenItemStatus.COOKING) {
            throw new KdsException("This dish has already been claimed by chef [" + kitchenTicketEntity.getAssignedCookName() + "]!");
        }

        if (kitchenTicketEntity.getStatus() == KitchenItemStatus.COMPLETED) {
            throw new KdsException("This dish is finished.!");
        }
        kitchenTicketEntity.setStatus(KitchenItemStatus.COOKING);
        kitchenTicketEntity.setAssignedCookId(cookUserId);
        kitchenTicketEntity.setAssignedCookName(cookName);

        KitchenTicketResponse response = kitchenTicketMapper.toResponse(kitchenTicketEntity);
        webSocketPublisher.broadcastToAllKitchenScreens(response);
        return response ;
    }

    @Override
    @Transactional
    public KitchenTicketResponse completeTicket(Long ticketId, Long cookUserId) {

        KitchenTicketEntity kitchenTicketEntity = kitchenTicketRepository.findById( ticketId )
                .orElseThrow( ()-> new KdsException("Food ticket does not exist:")) ;

        if( kitchenTicketEntity.getStatus() != KitchenItemStatus.COMPLETED)

    }

}
