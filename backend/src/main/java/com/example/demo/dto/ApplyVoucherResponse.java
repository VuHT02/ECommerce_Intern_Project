package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplyVoucherResponse {
    private String code;
    private String title;
    private BigDecimal discountAmount;
    private BigDecimal subtotal;
    private BigDecimal finalAmount;
    private boolean valid;
    private String message;
}
