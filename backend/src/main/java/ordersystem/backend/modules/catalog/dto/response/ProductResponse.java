package ordersystem.backend.modules.catalog.dto.response;


import lombok.*;

import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long productId;
    private String productName;
    private Long productPrice;
    private String productImageUrl;
    private String description;
    private Boolean isAvailable;
    private Long categoryId;
    private String categoryName;


}
