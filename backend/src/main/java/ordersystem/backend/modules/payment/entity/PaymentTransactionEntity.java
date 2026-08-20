package ordersystem.backend.modules.payment.entity;

import jakarta.persistence.*;
import lombok.*;
import ordersystem.backend.modules.payment.enums.PaymentMethod;
import ordersystem.backend.modules.payment.enums.PaymentStatus;
import ordersystem.backend.modules.table.entity.TableSessionEntity;

import java.util.Date;

@Entity
@Getter @Setter
@AllArgsConstructor @NoArgsConstructor
@Builder
@Table(name = "payment_transactions")
public class PaymentTransactionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false, name = "payment_id")
    private Long paymentId;

    @Column(name = "invoice_code", unique = true, nullable = false)
    private String invoiceCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "table_session_id", nullable = true)
    private TableSessionEntity tableSession;

    @Column(name = "order_type")
    private String orderType;

    @Column(name = "order_id")
    private Long orderId;

    @Column(name = "total_amount", nullable = false)
    private Long totalAmount;

    @Column(name = "receive_amount")
    private Long receivedAmount;

    @Column(name = "change_amount", nullable = true)
    private Long changeAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false)
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false)
    private PaymentStatus paymentStatus;

    @Column(name = "payos_order_code")
    private Long payosOrderCode;

    @Column(name = "qr_url", length = 1000)
    private String qrUrl;

    @Column(name = "items_json", columnDefinition = "TEXT")
    private String itemsJson;

    @Column(name = "paid_at", nullable = true)
    private Date paidAt;

    @Column(name = "create_at", nullable = false)
    private Date createAt;

    @PrePersist
    protected void onCreate(){
        this.createAt = new Date();
        if (this.paymentStatus == null) this.paymentStatus = PaymentStatus.PENDING;
    }
}
