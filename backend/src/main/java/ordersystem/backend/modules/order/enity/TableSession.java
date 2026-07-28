package ordersystem.backend.modules.order.enity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ordersystem.backend.modules.order.enums.SessionStatus;
import ordersystem.backend.modules.table.entity.RestaurantTable;
import ordersystem.backend.modules.table.* ;

import java.time.LocalDateTime;
import java.util.Date;



@Setter @Getter
@NoArgsConstructor @AllArgsConstructor
@Entity
@Table(name = "table_sessions")
public class TableSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id ;

    @Column( nullable = false , unique = true )
    private String tableSessionId ;

    @Column( nullable = false)
    @Enumerated(EnumType.STRING)
    private SessionStatus status;

    @ManyToOne
    @JoinColumn(name = "tableId")
    private RestaurantTable table ;

    @Column(nullable = false)
    private Date openedAt ;

    @PrePersist
    protected void onCreate() {
        this.openedAt = new Date();
    }

    private LocalDateTime closedAt;

}
