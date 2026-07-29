package ordersystem.backend.modules.catalog.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;


@Setter @Getter
@NoArgsConstructor @AllArgsConstructor
@Entity
@Table(name = "categories")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "category_id")
    private Long categoryId ;

    @Column(nullable = false)
    private String name; // "Món Chính", "Đồ Uống", "Khai Vị"

    // Một danh mục có chứa Danh sách nhiều Món ăn
    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL)
    private List<Product> products = new ArrayList<>();


}