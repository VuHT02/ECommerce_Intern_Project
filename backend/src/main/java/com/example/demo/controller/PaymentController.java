package com.example.demo.controller;

import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.OrderResponse;
import com.example.demo.dto.PaymentResponse;
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
 * PaymentController - Quản lý giao dịch thanh toán VNPAY Sandbox:
 * - GET /api/v1/payments/create-vnpay?orderId={id} → Tạo URL chuyển hướng VNPAY
 * - GET /api/v1/payments/vnpay-ipn                  → Webhook ngầm nhận kết quả từ server VNPAY
 * - GET /api/v1/payments/vnpay-return               → Return URL khi người dùng thanh toán xong
 */
@RestController
@RequestMapping({"/api/v1/payments", "/api/payment"})
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * 1. API Tạo URL chuyển hướng sang cổng thanh toán VNPAY Sandbox.
     * Endpoint chuẩn: GET /api/v1/payments/create-vnpay?orderId=123
     */
    @GetMapping("/create-vnpay")
    public ResponseEntity<ApiResponse<PaymentResponse>> createPaymentUrlGet(
            @RequestParam Long orderId,
            HttpServletRequest request) {

        log.info("[PaymentController] Nhận yêu cầu tạo URL thanh toán VNPAY cho đơn hàng ID: {}", orderId);
        PaymentResponse response = paymentService.createPaymentUrl(orderId, request);
        return ResponseEntity.ok(ApiResponse.success("Tạo URL thanh toán VNPAY thành công!", response));
    }

    /**
     * Hỗ trợ thêm dạng POST /create-vnpay/{orderId} để tương thích linh hoạt cho client
     */
    @PostMapping("/create-vnpay/{orderId}")
    public ResponseEntity<ApiResponse<PaymentResponse>> createPaymentUrlPost(
            @PathVariable Long orderId,
            HttpServletRequest request) {

        PaymentResponse response = paymentService.createPaymentUrl(orderId, request);
        return ResponseEntity.ok(ApiResponse.success("Tạo URL thanh toán VNPAY thành công!", response));
    }

    /**
     * 2. API Webhook IPN (Instant Payment Notification):
     * Endpoint: GET /api/v1/payments/vnpay-ipn
     * Nhận kết quả gọi ngầm từ máy chủ VNPAY về Spring Boot.
     * Trả về JSON { "RspCode": "00", "Message": "Confirm Success" } theo chuẩn VNPAY.
     */
    @GetMapping("/vnpay-ipn")
    public ResponseEntity<Map<String, String>> vnpayIpnWebhook(@RequestParam Map<String, String> allParams) {
        log.info("[PaymentController] Nhận kết quả IPN Webhook từ server VNPAY: TxnRef = {}", allParams.get("vnp_TxnRef"));
        Map<String, String> result = paymentService.processIpn(allParams);
        return ResponseEntity.ok(result);
    }

    /**
     * 3. API Return URL:
     * Endpoint: GET /api/v1/payments/vnpay-return
     * Nhận kết quả khi VNPAY redirect trình duyệt của người dùng về website sau khi thanh toán.
     */
    @GetMapping("/vnpay-return")
    public ResponseEntity<ApiResponse<OrderResponse>> vnpayReturnCallback(@RequestParam Map<String, String> allParams) {
        log.info("[PaymentController] Nhận chuyển hướng Return URL từ khách hàng: TxnRef = {}", allParams.get("vnp_TxnRef"));
        OrderResponse response = paymentService.processPaymentReturn(allParams);
        return ResponseEntity.ok(ApiResponse.success("Xử lý kết quả giao dịch VNPAY thành công!", response));
    }
}
