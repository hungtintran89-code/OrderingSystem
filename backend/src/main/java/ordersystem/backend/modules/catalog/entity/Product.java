package ordersystem.backend.modules.catalog.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "product_id")
    private Long id;

    @Column(nullable = false, name = "product_name")
    private String name;

    @Column(nullable = false, name = "product_price")
    private Long price;

    private String imageUrl;
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isAvailable = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    // Convenience alias getters to support both productId/name/price naming conventions
    public Long getProductId() {
        return this.id;
    }

    public String getProductName() {
        return this.name;
    }

    public Long getProductPrice() {
        return this.price;
    }
}