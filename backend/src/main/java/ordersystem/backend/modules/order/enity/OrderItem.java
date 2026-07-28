package ordersystem.backend.modules.order.enity;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;


@Setter @Getter
@NoArgsConstructor @AllArgsConstructor
@Entity
@Table( name = "order_item")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long order_item_id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Long quantity;

    @Column(nullable = false)
    private Long price;

    @Column(nullable = false)
    private Long item_price = 0L ;

    @Column(nullable = false)
    private Long total_price = 0L;

    private String note;

    @Column(nullable = false)
    private String createdByThread;

    @ManyToMany
    @JoinTable(
            name = "order_item_selected_options", // Đặt tên bảng trung gian
            joinColumns = @JoinColumn(name = "order_item_id"), // Trỏ về ID của OrderItem
            inverseJoinColumns = @JoinColumn(name = "product_option_id")
    )
    private List<ProductOption> selectedOptions = new ArrayList<>();

    public OrderItem(Long order_item_id, Order order, Product product, Long quantity, Long price, String note, String createdByThread, List<ProductOption> selectedOptions) {
        this.order_item_id = order_item_id;
        this.order = order;
        this.product = product;
        this.quantity = quantity;
        this.price = price;
        this.note = note;
        this.createdByThread = createdByThread;
        this.selectedOptions = selectedOptions;
    }
    public void caculatePrice(List<ProductOption> selectedOptions , Long quantity  ){
        for( ProductOption p : this.getSelectedOptions() ){
            this.item_price += p.getExtraPrice() ;
        }
        this.total_price = price * quantity + item_price;
    }
}
