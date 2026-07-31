package ordersystem.backend.modules.servicerequest.entity;

import jakarta.persistence.*;
import lombok.*;
import ordersystem.backend.modules.servicerequest.enums.RequestStatus;
import ordersystem.backend.modules.servicerequest.enums.RequestType;
import org.hibernate.annotations.CreationTimestamp;

import java.util.Date;

@Entity
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@Table(name = "service_requests")
public class ServiceRequestEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false, name = "request_id")
    private Long requestId;

    @Column(nullable = false, name = "table_id")
    private Long tableId;

    @Column(nullable = false, name = "table_name")
    private String tableName;

    @Column(nullable = false, name = "session_id")
    private String sessionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, name = "type")
    private RequestType requestType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, name = "request_status")
    private RequestStatus requestStatus;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Date createdAt;

    @Column(name = "completed_at")
    private Date completedAt;



}
