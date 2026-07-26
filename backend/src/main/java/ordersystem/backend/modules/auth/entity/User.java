package ordersystem.backend.modules.auth.entity;


import jakarta.persistence.*;
import lombok.*;
import ordersystem.backend.modules.auth.enums.RoleEnum;
import ordersystem.backend.modules.auth.enums.UserStatus;

import java.util.Date;
import java.util.UUID;


@Entity
@Table( name = "users")
@Builder
@Setter @Getter
@NoArgsConstructor @AllArgsConstructor
public class User {

    @Id
    @GeneratedValue( strategy = GenerationType.UUID)
    private UUID user_id ;

    @Column( nullable = false , unique = true)
    private String username ;

    @Column( nullable = false )
    private String password_hash ;

    @Column( nullable = false )
    private String fullname ;

    @Enumerated(EnumType.STRING)
    @Column( nullable = false )
    private RoleEnum role ;

    @Column( nullable = false )
    private boolean is_active ;

    @Column( nullable = false )
    private Date created_at ;

    @Column( nullable = true)
    private String phone ;

    @PrePersist
    protected void onCreate() {
        this.created_at = new Date();
        this.is_active = true ;
    }
}
