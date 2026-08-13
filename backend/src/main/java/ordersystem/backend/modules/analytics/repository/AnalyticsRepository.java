package ordersystem.backend.modules.analytics.repository;

import ordersystem.backend.modules.order.entity.OrderEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

/**
 * Analytics Repository executing optimized aggregation JPQL queries.
 */
@Repository
public interface AnalyticsRepository extends JpaRepository<OrderEntity, Long> {

    /**
     * Retrieves overall order count and sum of totalAmount for COMPLETED orders.
     */
    @Query("SELECT COUNT(o), COALESCE(SUM(o.totalAmount), 0) " +
           "FROM OrderEntity o " +
           "WHERE o.status = ordersystem.backend.modules.order.enums.OrderStatus.COMPLETED " +
           "AND o.createdAt >= :startDate AND o.createdAt <= :endDate")
    Object[] getCompletedOrdersSummary(@Param("startDate") Date startDate, @Param("endDate") Date endDate);

    /**
     * Truy vấn tổng tiền từ các món (OrderItemEntity) của các đơn đã COMPLETED
     */
    @Query("SELECT COALESCE(SUM(item.totalPrice), 0) " +
           "FROM OrderItemEntity item " +
           "JOIN item.order o " +
           "WHERE o.status = ordersystem.backend.modules.order.enums.OrderStatus.COMPLETED " +
           "AND o.createdAt >= :startDate AND o.createdAt <= :endDate")
    Long getCompletedOrdersItemTotal(@Param("startDate") Date startDate, @Param("endDate") Date endDate);

    /**
     * Truy vấn tổng doanh thu thực tế từ bảng payment_transactions thành công (SUCCESS)
     */
    @Query("SELECT COALESCE(SUM(p.totalAmount), 0) " +
           "FROM PaymentTransactionEntity p " +
           "WHERE p.paymentStatus = ordersystem.backend.modules.payment.enums.PaymentStatus.SUCCESS " +
           "AND p.createAt >= :startDate AND p.createAt <= :endDate")
    Long getSuccessfulTransactionsTotal(@Param("startDate") Date startDate, @Param("endDate") Date endDate);

    /**
     * Retrieves total count of all created orders regardless of status.
     */
    @Query("SELECT COUNT(o) FROM OrderEntity o WHERE o.createdAt >= :startDate AND o.createdAt <= :endDate")
    Long getTotalOrdersCount(@Param("startDate") Date startDate, @Param("endDate") Date endDate);

    /**
     * Retrieves hourly revenue and order count for COMPLETED orders.
     */
    @Query(value = "SELECT EXTRACT(HOUR FROM o.created_at) as hr, COUNT(o.id), COALESCE(SUM(o.total_amount), 0) " +
                   "FROM orders o " +
                   "WHERE o.status = 'COMPLETED' " +
                   "AND o.created_at >= :startDate AND o.created_at <= :endDate " +
                   "GROUP BY EXTRACT(HOUR FROM o.created_at) ORDER BY hr ASC", nativeQuery = true)
    List<Object[]> getHourlyRevenueData(@Param("startDate") Date startDate, @Param("endDate") Date endDate);

    /**
     * Retrieves daily revenue and order count for COMPLETED orders.
     */
    @Query(value = "SELECT CAST(o.created_at AS DATE) as dt, COUNT(o.id), COALESCE(SUM(o.total_amount), 0) " +
                   "FROM orders o " +
                   "WHERE o.status = 'COMPLETED' " +
                   "AND o.created_at >= :startDate AND o.created_at <= :endDate " +
                   "GROUP BY CAST(o.created_at AS DATE) ORDER BY dt ASC", nativeQuery = true)
    List<Object[]> getDailyRevenueData(@Param("startDate") Date startDate, @Param("endDate") Date endDate);

    /**
     * Retrieves monthly revenue and order count for COMPLETED orders.
     */
    @Query(value = "SELECT EXTRACT(MONTH FROM o.created_at) as mth, COUNT(o.id), COALESCE(SUM(o.total_amount), 0) " +
                   "FROM orders o " +
                   "WHERE o.status = 'COMPLETED' " +
                   "AND o.created_at >= :startDate AND o.created_at <= :endDate " +
                   "GROUP BY EXTRACT(MONTH FROM o.created_at) ORDER BY mth ASC", nativeQuery = true)
    List<Object[]> getMonthlyRevenueData(@Param("startDate") Date startDate, @Param("endDate") Date endDate);

    /**
     * Retrieves top-selling products ordered by quantity sold.
     */
    @Query("SELECT p.productId, p.productName, p.productImageUrl, c.categoryName, " +
           "SUM(item.quantity), SUM(item.totalPrice) " +
           "FROM OrderItemEntity item " +
           "JOIN item.product p " +
           "JOIN p.category c " +
           "JOIN item.order o " +
           "WHERE o.status = ordersystem.backend.modules.order.enums.OrderStatus.COMPLETED " +
           "AND o.createdAt >= :startDate AND o.createdAt <= :endDate " +
           "GROUP BY p.productId, p.productName, p.productImageUrl, c.categoryName " +
           "ORDER BY SUM(item.quantity) DESC")
    List<Object[]> getTopSellingProductsData(@Param("startDate") Date startDate, @Param("endDate") Date endDate);

    /**
     * Retrieves all product sales performance data for Menu Matrix analysis.
     */
    @Query("SELECT p.productId, p.productName, c.categoryName, " +
           "COALESCE(SUM(item.quantity), 0), COALESCE(SUM(item.totalPrice), 0) " +
           "FROM OrderItemEntity item " +
           "JOIN item.product p " +
           "JOIN p.category c " +
           "JOIN item.order o " +
           "WHERE o.status = ordersystem.backend.modules.order.enums.OrderStatus.COMPLETED " +
           "AND o.createdAt >= :startDate AND o.createdAt <= :endDate " +
           "GROUP BY p.productId, p.productName, c.categoryName")
    List<Object[]> getMenuMatrixRawData(@Param("startDate") Date startDate, @Param("endDate") Date endDate);

    /**
     * Retrieves successful payment method counts and amounts (VietQR vs Cash).
     */
    @Query("SELECT pt.paymentMethod, COUNT(pt), COALESCE(SUM(pt.totalAmount), 0) " +
           "FROM PaymentTransactionEntity pt " +
           "WHERE pt.paymentStatus = ordersystem.backend.modules.payment.enums.PaymentStatus.SUCCESS " +
           "AND COALESCE(pt.paidAt, pt.createAt) >= :startDate AND COALESCE(pt.paidAt, pt.createAt) <= :endDate " +
           "GROUP BY pt.paymentMethod")
    List<Object[]> getPaymentMethodData(@Param("startDate") Date startDate, @Param("endDate") Date endDate);

    /**
     * Retrieves count and total lost revenue from CANCELLED orders.
     */
    @Query("SELECT COUNT(o), COALESCE(SUM(o.totalAmount), 0) " +
           "FROM OrderEntity o " +
           "WHERE o.status = ordersystem.backend.modules.order.enums.OrderStatus.CANCELLED " +
           "AND o.createdAt >= :startDate AND o.createdAt <= :endDate")
    Object[] getCancellationData(@Param("startDate") Date startDate, @Param("endDate") Date endDate);

    /**
     * Retrieves sales performance breakdown per table.
     */
    @Query("SELECT t.tableId, t.tableName, COUNT(DISTINCT s.tableSessionId), COALESCE(SUM(o.totalAmount), 0) " +
           "FROM OrderEntity o " +
           "JOIN o.tableSession s " +
           "JOIN s.table t " +
           "WHERE o.status = ordersystem.backend.modules.order.enums.OrderStatus.COMPLETED " +
           "AND o.createdAt >= :startDate AND o.createdAt <= :endDate " +
           "GROUP BY t.tableId, t.tableName " +
           "ORDER BY SUM(o.totalAmount) DESC")
    List<Object[]> getTablePerformanceData(@Param("startDate") Date startDate, @Param("endDate") Date endDate);
}
