package ordersystem.backend.modules.order.entity;

import jakarta.persistence.*;
import lombok.*;
import ordersystem.backend.modules.order.enums.OrderStatus;
import ordersystem.backend.modules.table.entity.TableSession;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String orderCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "table_session_id", nullable = false)
    private TableSession tableSession;

    @Column(nullable = false)
    private Long totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    private Date createdAt;
    private Date updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = new Date() ;
        this.updatedAt = new Date() ;
        if (this.totalAmount == null) {
            this.totalAmount = 0L;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = new Date() ;
    }
}
