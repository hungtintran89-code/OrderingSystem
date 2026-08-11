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
public class ProductEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "product_id")
    private Long productId;

    @Column(nullable = false, name = "product_name")
    private String productName;

    @Column(nullable = false, name = "product_price")
    private Long productPrice;

    @Column(name = "product_image_url", columnDefinition = "TEXT")
    private String productImageUrl;

    @Column(name = "product_description", columnDefinition = "TEXT")
    private String productDescription;

    @Column(nullable = false)
    @Builder.Default
    private Boolean productIsAvailable = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private CategoryEntity category;

}
