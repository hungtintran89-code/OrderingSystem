package ordersystem.backend.modules.catalog.dto.response;

import lombok.*;

import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductMenuResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long productId;
    private String productName;
    private Long price;
    private String imageUrl;
    private Boolean isOrdered = false;
    private String description;
    private Boolean isAvailable;
}
