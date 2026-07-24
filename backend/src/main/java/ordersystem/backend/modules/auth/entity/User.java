package ordersystem.backend.modules.auth.entity;


import jakarta.persistence.*;
import lombok.*;

import java.util.Date;


@Entity
@Table( name = "user")
@Builder
@Setter @Getter
@NoArgsConstructor @AllArgsConstructor
public class User {

    @Id
    @GeneratedValue( strategy = GenerationType.IDENTITY)
    private Long user_id ;

    @Column( nullable = false , unique = true)
    private String username ;

    @Column( nullable = false )
    private String password_hash ;

    @Column( nullable = false )
    private String full_name ;

    @Column( nullable = false )
    private Long role_id ;

    @Column( nullable = false )
    private boolean is_active ;

    @Column( nullable = false )
    private Date created_at ;

}
