package ordersystem.backend.modules.order.enity;


import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


import java.math.BigDecimal;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "product_option")
public class ProductOption {

    @Id
    @GeneratedValue( strategy = GenerationType.IDENTITY)
    private Long product_option_id ;

    @Column(nullable = false)
    private String name ;

    @Column(nullable = false)
    private Long extraPrice ;

}
