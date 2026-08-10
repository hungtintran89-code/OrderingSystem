package ordersystem.backend.modules.auth.repository;

import ordersystem.backend.modules.auth.entity.RefreshTokenEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Optional;

/**
 * Repository truy vấn dữ liệu Refresh Token.
 * Cung cấp các thao tác tìm kiếm, thu hồi (revoke) và xóa token đã hết hạn.
 */
@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshTokenEntity, Long> {

    /**
     * Tìm kiếm Refresh Token theo chuỗi token chưa bị thu hồi.
     * @param token Chuỗi Refresh Token
     * @return Optional RefreshTokenEntity
     */
    Optional<RefreshTokenEntity> findByTokenAndRevokedFalse(String token);

    /**
     * Thu hồi toàn bộ Refresh Tokens active của 1 người dùng khi thực hiện Token Rotation.
     * @param userId ID người dùng
     */
    @Modifying
    @Query("UPDATE RefreshTokenEntity r SET r.revoked = true WHERE r.userId = :userId")
    void revokeAllUserTokens(Long userId);
}
