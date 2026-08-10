package ordersystem.backend.modules.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Entity quản lý Refresh Token trong cơ sở dữ liệu.
 * Phục vụ cơ sở hạ tầng Security Token Rotation cho hệ thống Commercial SaaS.
 * 
 * Nguồn dữ liệu: Bảng refresh_tokens (PostgreSQL Migration V6)
 */
@Entity
@Table(name = "refresh_tokens")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefreshTokenEntity {

    /**
     * Khóa chính tự tăng của bản ghi Refresh Token.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    /**
     * ID của người dùng sở hữu Refresh Token này.
     */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /**
     * Chuỗi Token mã hóa ngẫu nhiên duy nhất (UUID string).
     */
    @Column(name = "token", nullable = false, unique = true, length = 500)
    private String token;

    /**
     * Thời điểm hết hạn của Refresh Token.
     */
    @Column(name = "expiry_date", nullable = false)
    private LocalDateTime expiryDate;

    /**
     * Trạng thái bị thu hồi (revoke) khi người dùng đăng xuất.
     */
    @Column(name = "revoked", nullable = false)
    private boolean revoked;

    /**
     * Thời điểm tạo bản ghi Refresh Token.
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.revoked = false;
    }
}
