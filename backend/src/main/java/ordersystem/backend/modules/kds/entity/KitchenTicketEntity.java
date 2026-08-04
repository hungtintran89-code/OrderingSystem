package ordersystem.backend.modules.kds.entity;


import jakarta.persistence.*;
import lombok.*;
import ordersystem.backend.modules.kds.enums.KitchenItemStatus;
import ordersystem.backend.modules.kds.enums.KitchenStation;

import java.time.ZonedDateTime;
import java.util.Date;


@Setter @Getter
@Builder
@NoArgsConstructor @AllArgsConstructor
@Entity
@Table(name = "kitchen_tickets")
public class KitchenTicketEntity {

    @Id
    @GeneratedValue( strategy = GenerationType.IDENTITY)
    private Long kitchenTicketId ;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "order_item_id", nullable = false, unique = true)
    private Long orderItemId;

    @Column(name = "table_number", nullable = false)
    private String tableNumber;

    @Column(name = "area_name")
    private String areaName;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(nullable = false)
    private Long quantity;

    private String note;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private KitchenItemStatus status = KitchenItemStatus.PENDING;

    @Column(name = "assigned_cook_id")
    private Long assignedCookId;

    @Column(name = "assigned_cook_name")
    private String assignedCookName;
}
