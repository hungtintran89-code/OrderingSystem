package ordersystem.backend.modules.catalog.dto.response;


import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductResponse {

    private Long productId;
    private String productName;
    private Long productPrice;
    private String productImageUrl;
    private String description;
    private Boolean isAvailable;
    private Long categoryId;
    private String categoryName;


}
