package ordersystem.backend.modules.catalog.dto.response;

import lombok.*;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryMenuResponse implements Serializable {

    private static final long serialVersionUID = 1L;


    private Long categoryId;
    private String categoryName;
    @Builder.Default
    private List<ProductResponse> products = new ArrayList<>();

}
