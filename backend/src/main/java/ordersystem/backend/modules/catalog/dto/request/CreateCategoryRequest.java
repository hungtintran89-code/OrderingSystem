package ordersystem.backend.modules.catalog.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;


@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CreateCategoryRequest {

    @NotBlank(message = "The category name cannot be left blank.")
    private String categoryName  ;

    public Long getCategoryId ;
}
