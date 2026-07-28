package ordersystem.backend.modules.order.enity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import ordersystem.backend.modules.order.enums.TableStatus;

import java.time.LocalDateTime;

@Entity
@Table(name = "restaurant_tables")
public class RestaurantTable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String tableNumber;
    private String areaName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TableStatus status = TableStatus.EMPTY;
    private String qrToken; // Token dán trên bàn
    private LocalDateTime createdAt = LocalDateTime.now();
    // Getters, Setters & Constructors
}