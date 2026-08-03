package ordersystem.backend.modules.catalog.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;


@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CreateProductRequest {

    @NotBlank(message = "The dish name cannot be left blank.")
    private String productName ;

    @Min(value = 0 , message = "The price of the dish must be greater than or equal to 0.")
    @NotNull(message = "The dish price cannot be left blank.")
    private Long productPrice ;

    @NotNull( message = "The category id cannot be left blank." )
    private String categoryName ;

    private String imageUrl;
    private String description ;
    private Boolean isAvailbale;


}
