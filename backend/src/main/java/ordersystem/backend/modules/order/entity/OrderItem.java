package ordersystem.backend.modules.order.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_item_id")
    private Long orderItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Long quantity;

    @Column(nullable = false)
    private Long price; // Giá đơn vị của món ăn

    @Column(nullable = false)
    private Long totalPrice; // Tổng tiền = price * quantity

    private String note;

    @Column(nullable = false)
    private Long createdByThread;

    public void calculatePrice() {
        Long unitPrice = (this.price != null) ? this.price : 0L;
        long qty = (this.quantity != null) ? this.quantity : 1L;
        this.totalPrice = unitPrice * qty  ;
    }
}
