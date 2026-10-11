package com.example.demo.service;

import com.example.demo.event.PasswordResetOtpRequestedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.format.DateTimeFormatter;

/** Gửi email xác thực bất đồng bộ sau khi dữ liệu OTP đã được commit. */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private static final DateTimeFormatter EXPIRY_FORMAT = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:${spring.mail.username:no-reply@techzone.local}}")
    private String fromAddress;

    @Async("mailTaskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void sendPasswordResetOtp(PasswordResetOtpRequestedEvent event) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(event.recipientEmail());
        message.setSubject("Mã OTP đặt lại mật khẩu TechZone");
        message.setText("Xin chào,\n\n"
                + "Mã OTP đặt lại mật khẩu của bạn là: " + event.otp() + "\n"
                + "Mã có hiệu lực đến " + event.expiryTime().format(EXPIRY_FORMAT) + ".\n"
                + "Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.\n"
                + "Không chia sẻ mã OTP với bất kỳ ai.\n\nTechZone");

        try {
            mailSender.send(message);
            log.info("Password reset email sent successfully.");
        } catch (MailException ex) {
            // Không ghi mã OTP hay địa chỉ email vào log; người dùng có thể yêu cầu mã mới.
            log.error("Could not send password reset email. Check SMTP configuration.", ex);
        }
    }
}
