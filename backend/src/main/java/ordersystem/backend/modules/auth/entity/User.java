package ordersystem.backend.modules.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import ordersystem.backend.modules.auth.enums.UserRole;

import java.util.Date;

@Entity
@Table(name = "users")
@Builder
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, name = "password_hash")
    private String passwordHash;

    @Column(nullable = false, name = "fullname")
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    @Column(nullable = false, name = "is_active")
    private boolean active;

    @Column(nullable = false, name = "created_at")
    private Date createdAt;

    @Column(nullable = true)
    private String phone;

    @PrePersist
    protected void onCreate() {
        this.createdAt = new Date();
        this.active = true;
    }
}

