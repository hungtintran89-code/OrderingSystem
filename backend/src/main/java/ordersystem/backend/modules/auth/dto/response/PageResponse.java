package ordersystem.backend.modules.auth.dto.response;

import lombok.*;

import java.util.List;

@Getter @Setter
@Builder
public class PageResponse<T> {
    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
}
