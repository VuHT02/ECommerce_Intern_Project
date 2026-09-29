package com.example.demo.service.impl;

import com.example.demo.dto.ApplyVoucherResponse;
import com.example.demo.entity.Voucher;
import com.example.demo.exception.BadRequestException;
import com.example.demo.repository.VoucherRepository;
import com.example.demo.service.VoucherService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VoucherServiceImpl implements VoucherService {

    private final VoucherRepository voucherRepository;

    @Override
    @Transactional(readOnly = true)
    public ApplyVoucherResponse validateAndCalculateDiscount(String voucherCode, BigDecimal subtotal) {
        if (voucherCode == null || voucherCode.trim().isEmpty()) {
            return ApplyVoucherResponse.builder()
                    .code(null)
                    .title("Không áp dụng voucher")
                    .discountAmount(BigDecimal.ZERO)
                    .subtotal(subtotal)
                    .finalAmount(subtotal)
                    .valid(true)
                    .message("Không có mã giảm giá")
                    .build();
        }

        LocalDateTime now = LocalDateTime.now();
        Voucher voucher = voucherRepository.findValidVoucher(voucherCode.trim().toUpperCase(), now)
                .orElseThrow(() -> new BadRequestException("Mã giảm giá '" + voucherCode + "' không tồn tại, đã hết hạn hoặc hết lượt dùng!"));

        if (voucher.getMinOrderValue() != null && subtotal.compareTo(voucher.getMinOrderValue()) < 0) {
            throw new BadRequestException("Mã '" + voucher.getCode() + "' yêu cầu đơn hàng tối thiểu từ " 
                    + voucher.getMinOrderValue().stripTrailingZeros().toPlainString() + " đ!");
        }

        BigDecimal discountAmount;
        if ("PERCENTAGE".equalsIgnoreCase(voucher.getDiscountType())) {
            discountAmount = subtotal.multiply(voucher.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            if (voucher.getMaxDiscountAmount() != null && discountAmount.compareTo(voucher.getMaxDiscountAmount()) > 0) {
                discountAmount = voucher.getMaxDiscountAmount();
            }
        } else {
            discountAmount = voucher.getDiscountValue();
        }

        if (discountAmount.compareTo(subtotal) > 0) {
            discountAmount = subtotal;
        }

        BigDecimal finalAmount = subtotal.subtract(discountAmount);

        return ApplyVoucherResponse.builder()
                .code(voucher.getCode())
                .title(voucher.getTitle())
                .discountAmount(discountAmount)
                .subtotal(subtotal)
                .finalAmount(finalAmount)
                .valid(true)
                .message("Áp dụng mã giảm giá thành công!")
                .build();
    }

    @Override
    @Transactional
    public void markVoucherUsed(Long voucherId) {
        if (voucherId == null) return;
        Voucher voucher = voucherRepository.findByIdWithPessimisticLock(voucherId)
                .orElseThrow(() -> new BadRequestException("Voucher không tồn tại!"));
        if (voucher.getUsageLimit() != null && voucher.getUsedCount() >= voucher.getUsageLimit()) {
            throw new BadRequestException("Mã giảm giá đã hết lượt sử dụng!");
        }
        voucher.setUsedCount(voucher.getUsedCount() + 1);
        voucherRepository.save(voucher);
    }

    @Override
    @Transactional
    public void refundVoucherUsage(Long voucherId) {
        if (voucherId == null) return;
        voucherRepository.findById(voucherId).ifPresent(v -> {
            if (v.getUsedCount() > 0) {
                v.setUsedCount(v.getUsedCount() - 1);
                voucherRepository.save(v);
            }
        });
    }

    @Override
    @Transactional(readOnly = true)
    public List<Voucher> getAvailableVouchers() {
        return voucherRepository.findAvailableVouchers(LocalDateTime.now());
    }
}
