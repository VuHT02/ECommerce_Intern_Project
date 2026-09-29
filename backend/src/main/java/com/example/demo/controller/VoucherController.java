package com.example.demo.controller;

import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.ApplyVoucherResponse;
import com.example.demo.entity.Voucher;
import com.example.demo.service.VoucherService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

/**
 * VoucherController - Quản lý mã giảm giá
 *
 * GET /api/vouchers/available          → Danh sách mã giảm giá đang có hiệu lực
 * GET /api/vouchers/apply              → Áp dụng & tính toán tiền giảm cho đơn hàng
 */
@RestController
@RequestMapping("/api/vouchers")
@RequiredArgsConstructor
public class VoucherController {

    private final VoucherService voucherService;

    /**
     * GET /api/vouchers/available
     * Danh sách tất cả voucher đang còn hiệu lực, còn lượt dùng
     * Dùng để hiển thị popup "Chọn mã giảm giá" cho khách hàng
     */
    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<Voucher>>> getAvailableVouchers() {
        return ResponseEntity.ok(
                ApiResponse.success("Lấy danh sách voucher khả dụng thành công",
                        voucherService.getAvailableVouchers())
        );
    }

    /**
     * GET /api/vouchers/apply?code=DIENTU2026&subtotal=25000000
     * Kiểm tra mã giảm giá hợp lệ và tính toán số tiền được giảm
     * Trả về: tiền giảm, tổng tiền sau giảm để hiển thị ngay cho khách hàng xem trước
     */
    @GetMapping("/apply")
    public ResponseEntity<ApiResponse<ApplyVoucherResponse>> applyVoucher(
            @RequestParam String code,
            @RequestParam BigDecimal subtotal) {
        return ResponseEntity.ok(
                ApiResponse.success("Áp dụng mã giảm giá thành công",
                        voucherService.validateAndCalculateDiscount(code, subtotal))
        );
    }
}
