package ordersystem.backend.common.payload;

import lombok.*;
import ordersystem.backend.modules.auth.enums.RoleEnum;

import java.util.List;
import java.util.UUID;

@Getter @Setter
@Builder
public class PageResponse<T> {
    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
}
