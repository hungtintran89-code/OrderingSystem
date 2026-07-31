package ordersystem.backend.modules.table.entity;

import jakarta.persistence.*;
import lombok.*;
import ordersystem.backend.modules.table.enums.SessionStatus;

import java.util.Date;

@Entity
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@Table(name = "table_sessions")
public class TableSessionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false, name = "table_session_id")
    private Long tableSessionId;

    @Column(nullable = false, name = "table_name")
    private String tableName;

    @Column(nullable = false, name = "session_token")
    private String sessionToken;

    // Biểu diễn Khóa ngoại (Foreign Key) liên kết tới RestaurantTable
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "table_id", nullable = false)
    private RestaurantTableEntity table;

    // Map Enum dạng Chuỗi (String) vào Database
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private SessionStatus status;

    @Column(name = "started_at", nullable = false)
    private Date startedAt;

    @Column(name = "ended_at")
    private Date endedAt;

    public void close() {
        this.status = SessionStatus.CLOSED;
        this.endedAt = new Date();
    }
}
