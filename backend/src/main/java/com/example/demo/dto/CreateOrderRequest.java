package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {
    private Long userId;
    private String recipientName;
    private String recipientPhone;
    private String shippingAddress;
    private String voucherCode;     // Mã giảm giá (nếu có)
    private String paymentMethod;   // "COD", "VNPAY", "MOMO"
}
