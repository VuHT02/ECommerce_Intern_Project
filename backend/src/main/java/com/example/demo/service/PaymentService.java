package com.example.demo.service;

import com.example.demo.dto.OrderResponse;
import com.example.demo.dto.PaymentResponse;
import com.example.demo.dto.CreateOrderRequest;
import jakarta.servlet.http.HttpServletRequest;

import java.util.Map;

public interface PaymentService {

    /**
     * Tạo URL chuyển hướng sang cổng thanh toán VNPAY Sandbox cho đơn hàng ở trạng thái PENDING.
     */
    PaymentResponse createPaymentUrl(Long orderId, HttpServletRequest request);

    /** Creates a pending order and its VNPAY URL in one database transaction. */
    PaymentResponse createVnPayCheckout(CreateOrderRequest orderRequest, HttpServletRequest request);

    /**
     * Xử lý IPN (Instant Payment Notification) Webhook gọi ngầm từ máy chủ VNPAY:
     * - Kiểm tra chữ ký Checksum
     * - Kiểm tra tính lũy đẳng (Idempotency): Nếu đã PAID hoặc CANCELLED -> trả về mã 02
     * - Thành công (mã 00) -> cập nhật PAID
     * - Thất bại -> cập nhật FAILED và hoàn trả lại tồn kho sản phẩm (Product.stockQuantity)
     */
    Map<String, String> processIpn(Map<String, String> params);

    /**
     * Xử lý kết quả trả về khi người dùng được chuyển hướng (Return URL).
     */
    OrderResponse processPaymentReturn(Map<String, String> params);

    /**
     * Tự động quét và hủy các đơn hàng quá 15 phút chưa thanh toán, hoàn trả tồn kho và voucher.
     */
    void cancelExpiredVnPayOrders();
}
