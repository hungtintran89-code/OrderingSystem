package ordersystem.backend.modules.table.entity;

import jakarta.persistence.*;
import lombok.*;
import ordersystem.backend.modules.table.enums.TableStatus;

import java.util.Date;

@Entity
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@Table(name = "tables")
public class RestaurantTableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "table_id")
    private Long tableId;

    @Column(nullable = false, unique = true, name = "table_name")
    private String tableName;

    @Column(nullable = false, unique = true, name = "qr_token")
    private String qrToken;

    @Column(nullable = false, name = "qr_url")
    private String qrUrl;

    @Column(nullable = false, name = "is_active")
    private Boolean isActive;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false , name = "table_status")
    private TableStatus tableStatus ;

    @Column(nullable = false, name = "creat_at")
    private Date createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = new Date();
        this.isActive = true;
        if (this.tableStatus == null) {
            this.tableStatus = TableStatus.EMPTY;
        }
    }
}
