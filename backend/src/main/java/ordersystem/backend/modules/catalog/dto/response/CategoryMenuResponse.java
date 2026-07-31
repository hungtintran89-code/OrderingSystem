package ordersystem.backend.modules.catalog.dto.response;

import lombok.*;

import java.util.ArrayList;
import java.util.List;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryMenuResponse {


    private Long categoryId;
    private String categoryName;
    @Builder.Default
    private List<ProductResponse> products = new ArrayList<>();

}
