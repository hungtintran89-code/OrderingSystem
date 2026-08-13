package ordersystem.backend.modules.order.repository;

import ordersystem.backend.modules.order.enity.OrderItem;
import ordersystem.backend.modules.order.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem , Long > {

    // 2. DÀNH CHO NHÂN VIÊN: Lấy toàn bộ món thuộc TAB CHUNG CẢ BÀN
    List<OrderItem> findByOrderTableSesionId ( String tableSessionId ) ;

    // 1. DÀNH CHO KHÁCH: Chỉ lấy món do đúng threadId (điện thoại khách A) đã đặt
    List<OrderItem> findByOrderTableSessionTableSessionIdAndCreatedByThread ( String tableSessionId, String createdByThread);

    // 3. DÀNH CHO BẾP (KDS): Lấy danh sách món đang chờ/đang chế biến
    List<OrderItem> findByOrderStatus(OrderStatus status);

    // 4. QUERY THỐNG KÊ: Tính tổng số lượng đã đặt của từng món tại bàn (Để hiển thị nhãn "Đã gọi x2")
    @Query("SELECT i.product.id AS productId, SUM(i.quantity) AS totalQuantity " +
            "FROM OrderItem i " +
            "WHERE i.order.tableSession.tableSessionId = :tableSessionId " +
            "AND i.order.status != 'CANCELLED' " +
            "GROUP BY i.product.id")
    List<Object[]> findOrderedItemSummaryBySession( @Param("tableSessionId") String tableSessionId);

}
