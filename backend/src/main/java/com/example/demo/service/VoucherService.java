package com.example.demo.service;

import com.example.demo.dto.ApplyVoucherResponse;
import com.example.demo.entity.Voucher;

import java.math.BigDecimal;
import java.util.List;

public interface VoucherService {

    ApplyVoucherResponse validateAndCalculateDiscount(String voucherCode, BigDecimal subtotal);

    void markVoucherUsed(Long voucherId);

    void refundVoucherUsage(Long voucherId);

    List<Voucher> getAvailableVouchers();
}
