package com.example.demo.controller;

import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.OrderResponse;
import com.example.demo.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * REST Controller tiếp nhận giao dịch thanh toán VNPAY Sandbox:
 * - Tạo URL thanh toán
 * - Nhận IPN Webhook ngầm từ máy chủ VNPAY
 * - Nhận kết quả điều hướng (Return URL) cho người dùng
 */
@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * 1. API Tạo URL thanh toán VNPAY Sandbox cho đơn hàng.
     * Khách hàng sẽ dùng URL này để mở cổng thanh toán VNPAY.
     */
    @PostMapping("/create-vnpay/{orderId}")
    public ResponseEntity<ApiResponse<Map<String, String>>> createPaymentUrl(
            @PathVariable Long orderId,
            HttpServletRequest request) {

        String paymentUrl = paymentService.createVnPayPaymentUrl(orderId, request);
        return ResponseEntity.ok(ApiResponse.success(
                "Tạo liên kết thanh toán VNPAY thành công!",
                Map.of("paymentUrl", paymentUrl)
        ));
    }

    /**
     * 2. API Webhook IPN (Instant Payment Notification):
     * Máy chủ VNPAY sẽ gọi ngầm (Server-to-Server) đến endpoint này để thông báo kết quả giao dịch.
     * Trả về đúng format JSON { "RspCode": "...", "Message": "..." } mà VNPAY yêu cầu.
     */
    @GetMapping("/vnpay-ipn")
    public ResponseEntity<Map<String, String>> vnpayIpnWebhook(@RequestParam Map<String, String> allParams) {
        log.info("[PaymentController] Nhận tín hiệu IPN Webhook từ VNPAY");
        Map<String, String> result = paymentService.processIpnWebhook(allParams);
        return ResponseEntity.ok(result);
    }

    /**
     * 3. API Return URL:
     * Trình duyệt của khách hàng sẽ được VNPAY redirect về endpoint này sau khi bấm 'Quay lại website'.
     * Dùng để hiển thị trang xác nhận kết quả thanh toán trên Frontend.
     */
    @GetMapping("/vnpay-return")
    public ResponseEntity<ApiResponse<OrderResponse>> vnpayReturnCallback(@RequestParam Map<String, String> allParams) {
        log.info("[PaymentController] Nhận chuyển hướng Return URL từ khách hàng");
        OrderResponse response = paymentService.processPaymentReturn(allParams);
        return ResponseEntity.ok(ApiResponse.success("Xử lý kết quả giao dịch VNPAY thành công!", response));
    }
}
