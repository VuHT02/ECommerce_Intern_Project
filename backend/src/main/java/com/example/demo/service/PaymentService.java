package com.example.demo.service;

import com.example.demo.dto.OrderResponse;
import jakarta.servlet.http.HttpServletRequest;

import java.util.Map;

public interface PaymentService {

    /**
     * Tạo URL chuyển hướng sang cổng thanh toán VNPAY Sandbox cho đơn hàng.
     */
    String createVnPayPaymentUrl(Long orderId, HttpServletRequest request);

    /**
     * Xử lý IPN (Instant Payment Notification) Webhook gọi ngầm từ máy chủ VNPAY.
     * Đảm bảo tính Idempotency và đồng bộ trạng thái đơn hàng + kho hàng.
     */
    Map<String, String> processIpnWebhook(Map<String, String> params);

    /**
     * Xử lý redirect trả về của trình duyệt sau khi khách hàng hoàn tất thanh toán trên VNPAY.
     */
    OrderResponse processPaymentReturn(Map<String, String> params);

    /**
     * Tự động quét và hủy các đơn hàng VNPAY quá 15 phút chưa thanh toán,
     * đồng thời hoàn trả lại tồn kho sản phẩm và voucher.
     */
    void cancelExpiredVnPayOrders();
}
