package com.example.demo.event;

import java.time.LocalDateTime;

/** Event nội bộ để gửi email OTP sau khi transaction ghi mã vào DB đã commit. */
public record PasswordResetOtpRequestedEvent(
        String recipientEmail,
        String otp,
        LocalDateTime expiryTime) {
}
