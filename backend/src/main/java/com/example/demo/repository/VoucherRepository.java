package com.example.demo.repository;

import com.example.demo.entity.Voucher;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, Long> {

    Optional<Voucher> findByCode(String code);

    Optional<Voucher> findByCodeAndActiveTrue(String code);

    /**
     * Tìm kiếm Voucher hợp lệ tại thời điểm hiện tại:
     * - Trạng thái active = true
     * - Trong khoảng thời gian hiệu lực (startDate <= now <= endDate)
     * - Chưa vượt quá số lượt dùng (usageLimit IS NULL hoặc usedCount < usageLimit)
     */
    @Query("SELECT v FROM Voucher v " +
           "WHERE v.code = :code " +
           "AND v.active = true " +
           "AND v.startDate <= :now " +
           "AND v.endDate >= :now " +
           "AND (v.usageLimit IS NULL OR v.usedCount < v.usageLimit)")
    Optional<Voucher> findValidVoucher(@Param("code") String code, @Param("now") LocalDateTime now);

    /**
     * Danh sách voucher đang có hiệu lực hiển thị cho khách hàng chọn
     */
    @Query("SELECT v FROM Voucher v " +
           "WHERE v.active = true " +
           "AND v.startDate <= :now " +
           "AND v.endDate >= :now " +
           "AND (v.usageLimit IS NULL OR v.usedCount < v.usageLimit) " +
           "ORDER BY v.endDate ASC")
    List<Voucher> findAvailableVouchers(@Param("now") LocalDateTime now);

    /**
     * Hỗ trợ khóa bi quan (Pessimistic Lock - SELECT FOR UPDATE)
     * Thường dùng khi phỏng vấn giải quyết bài toán Flash Sale / Race Condition
     * khi hàng nghìn người cùng tranh nhau 1 voucher có giới hạn lượt dùng.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT v FROM Voucher v WHERE v.id = :id")
    Optional<Voucher> findByIdWithPessimisticLock(@Param("id") Long id);
}
