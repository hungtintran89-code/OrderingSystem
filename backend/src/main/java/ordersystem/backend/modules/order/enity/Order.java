package ordersystem.backend.modules.order.enity;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import ordersystem.backend.modules.order.enums.OrderStatus;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;


@Getter @Setter
@Entity
@Table( name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id ;

    @Column( nullable = false , unique = false )
    private String orderCode ;

    @ManyToOne
    @JoinColumn(name = "table_session_id", nullable = false)
    private TableSession tableSession;

    @Column(nullable = false)
    private BigDecimal totalAmount ;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.PENDING;

    @OneToMany
    private List<OrderItem> items = new ArrayList<>();

}
