package ordersystem.backend.modules.order.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class SubmitPersonalOrderRequest {

    @NotBlank(message = "The Session Code/Desk Code cannot be left blank.")
    private Long tableSessionId;

    @NotBlank(message = "The device thread ID must not be empty.")
    private String threadId;

    private String note;

    @NotEmpty(message = "The list of ordered items cannot be left blank.")
    private List<OrderItemRequest> list = new ArrayList<>();
}
