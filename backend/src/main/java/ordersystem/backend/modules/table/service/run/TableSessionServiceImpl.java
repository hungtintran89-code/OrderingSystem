package ordersystem.backend.modules.table.service.run;

import ordersystem.backend.modules.table.entity.TableSession;
import ordersystem.backend.modules.table.service.impl.TableSessionService;
import org.springframework.stereotype.Service;

@Service
public class TableSessionServiceImpl implements TableSessionService {

    @Override
    public TableSession getOrCreatActiveSession(Long tableId){
        return null;
    }

    @Override
    public void closeSession(String sessionToken){

    }

    @Override
    public void cancelSession(String sessionToken){

    }
}
