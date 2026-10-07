package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO phản hồi chứa liên kết URL chuyển hướng sang cổng thanh toán VNPAY Sandbox.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {

    private String paymentUrl;

    @Builder.Default
    private String status = "OK";

    private String message;
}
