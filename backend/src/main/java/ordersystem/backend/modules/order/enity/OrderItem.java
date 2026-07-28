package ordersystem.backend.modules.order.enity;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;

import java.math.BigDecimal;


@Setter @Getter
@NoArgsConstructor @AllArgsConstructor
@Entity
@Table( name = "order_item")
public class OrderItem {

    @Id
    @GeneratedValue( strategy = GenerationType.IDENTITY)
    private Long id ;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id" , nullable = false )
    private Order order ;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn( name = "product_id" , nullable = false )
    private Product product ;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private BigDecimal price;

    private String note;

    @Column(nullable = false)
    private String createdByThread;

}
