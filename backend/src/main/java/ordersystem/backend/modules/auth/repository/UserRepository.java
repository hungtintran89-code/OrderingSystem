package ordersystem.backend.modules.auth.repository;

import ordersystem.backend.modules.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByUsername( String username );

    boolean existsByUsername( String username ) ;
}
