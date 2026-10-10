package com.example.demo.repository;

import com.example.demo.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {

    Optional<Order> findByOrderNumber(String orderNumber);

    boolean existsByOrderNumber(String orderNumber);

    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

    Page<Order> findByUserId(Long userId, Pageable pageable);

    List<Order> findByStatus(String status);

    List<Order> findByPaymentStatusAndPaymentMethodAndStatusAndCreatedAtBefore(
            String paymentStatus, String paymentMethod, String status, java.time.LocalDateTime threshold);

    long countByStatusIgnoreCase(String status);

    long countByPaymentStatusIgnoreCase(String paymentStatus);

    @Query("select count(o) from Order o where upper(o.paymentStatus) = 'PAID' and upper(o.status) <> 'CANCELLED'")
    long countSuccessfulPaidOrders();

    @Query("select coalesce(sum(o.totalAmount), 0) from Order o where upper(o.paymentStatus) = 'PAID' and upper(o.status) <> 'CANCELLED'")
    java.math.BigDecimal sumPaidOrderAmounts();
}
