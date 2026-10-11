package com.example.demo.service;

import com.example.demo.entity.Order;
import com.example.demo.event.PasswordResetOtpRequestedEvent;

/** API gửi email nền dùng chung trong hệ thống. */
public interface EmailService {

    /** Gửi email xác nhận từ snapshot đơn hàng đã được tạo sau commit. */
    void sendOrderConfirmationEmail(Order order, String recipientEmail);

    /** Gửi mã OTP đặt lại mật khẩu sau khi transaction OTP đã commit. */
    void sendPasswordResetOtp(PasswordResetOtpRequestedEvent event);
}
