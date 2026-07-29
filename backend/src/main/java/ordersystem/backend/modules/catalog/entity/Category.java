package ordersystem.backend.modules.catalog.entity;

import jakarta.persistence.*;
import ordersystem.backend.modules.order.entity.Product;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "categories")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long category_id;

    private String name; // "Món Chính", "Đồ Uống", "Khai Vị"

    // Một danh mục có chứa Danh sách nhiều Món ăn
    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL)
    private List<Product> products = new ArrayList<>();


}