package ordersystem.backend.modules.payment.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.Date;

@Entity
@Getter @Setter
@AllArgsConstructor @NoArgsConstructor
@Builder
@Table(name = "payment_configs")
public class PaymentConfigEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false, name = "config_id")
    private Long configId;

    @Column(name = "payos_client_id", nullable = false)
    private String clientId;

    @Column(name = "payos_api_key", nullable = false)
    private String apiKey;

    @Column(name = "payos_checksum_key")
    private String checksumKey;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Column(name = "update_at", nullable = false)
    private Date updateAt;

    @PrePersist
    @PreUpdate
    protected void onSave(){
        this.updateAt = new Date();
        if (this.isActive == null) this.isActive = true;
    }


}
