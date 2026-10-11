package com.example.demo.service;

import com.example.demo.entity.Order;
import com.example.demo.entity.OrderItem;
import com.example.demo.event.PasswordResetOtpRequestedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/** Gửi email OTP và xác nhận đơn hàng ở luồng nền sau khi transaction đã commit. */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

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

    /** Gửi email HTML xác nhận đơn hàng, không chặn luồng tạo đơn. */
    @Override
    @Async("mailTaskExecutor")
    public void sendOrderConfirmationEmail(Order order, String recipientEmail) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(recipientEmail);
            helper.setSubject("TechZone xác nhận đơn hàng " + order.getOrderNumber());
            helper.setText(buildPlainText(order), buildHtml(order));

            mailSender.send(message);
            log.info("Order confirmation email sent for order {}", order.getOrderNumber());
        } catch (MessagingException | MailException ex) {
            // Lỗi email chỉ được ghi log; không làm hỏng kết quả đặt hàng đã commit.
            log.error("Could not send order confirmation email for order {}", order.getOrderNumber(), ex);
        }
    }

    private static String buildHtml(Order order) {
        StringBuilder rows = new StringBuilder();
        for (OrderItem item : order.getItems()) {
            BigDecimal lineTotal = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            rows.append("<tr>")
                    .append("<td style='padding:12px 8px;border-bottom:1px solid #e2e8f0;'>")
                    .append(escape(item.getProductName()))
                    .append("<br><span style='color:#64748b;font-size:12px;'>Mã: ")
                    .append(escape(item.getSku()))
                    .append("</span></td>")
                    .append("<td style='padding:12px 8px;border-bottom:1px solid #e2e8f0;text-align:center;'>")
                    .append(item.getQuantity())
                    .append("</td><td style='padding:12px 8px;border-bottom:1px solid #e2e8f0;text-align:right;'>")
                    .append(formatVnd(item.getUnitPrice()))
                    .append("</td><td style='padding:12px 8px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;'>")
                    .append(formatVnd(lineTotal))
                    .append("</td></tr>");
        }

        return """
                <!doctype html><html lang="vi"><body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a;">
                  <div style="max-width:680px;margin:24px auto;padding:28px;background:#fff;border-radius:16px;">
                    <div style="font-size:22px;font-weight:700;color:#2563eb;">TechZone</div>
                    <h1 style="font-size:22px;margin:24px 0 8px;">Đặt hàng thành công</h1>
                    <p>Xin chào %s, TechZone đã tiếp nhận đơn hàng của bạn.</p>
                    <p><strong>Mã đơn:</strong> %s<br><strong>Thanh toán:</strong> %s</p>
                    <table style="width:100%%;border-collapse:collapse;font-size:14px;">
                      <thead><tr style="color:#64748b;text-align:left;">
                        <th style="padding:8px;">Sản phẩm</th><th style="padding:8px;text-align:center;">SL</th>
                        <th style="padding:8px;text-align:right;">Đơn giá</th><th style="padding:8px;text-align:right;">Thành tiền</th>
                      </tr></thead><tbody>%s</tbody>
                    </table>
                    <p style="margin-top:20px;text-align:right;font-size:18px;font-weight:700;">Tổng thanh toán: %s</p>
                    <p style="color:#64748b;font-size:13px;">Cảm ơn bạn đã mua sắm tại TechZone.</p>
                  </div>
                </body></html>
                """.formatted(escape(order.getRecipientName()), escape(order.getOrderNumber()),
                escape(paymentLabel(order.getPaymentMethod())), rows, formatVnd(order.getTotalAmount()));
    }

    private static String buildPlainText(Order order) {
        StringBuilder content = new StringBuilder()
                .append("Xin chào ").append(order.getRecipientName()).append(",\n")
                .append("TechZone đã tiếp nhận đơn hàng ").append(order.getOrderNumber()).append(".\n")
                .append("Phương thức thanh toán: ").append(paymentLabel(order.getPaymentMethod())).append("\n\n")
                .append("Sản phẩm:\n");
        order.getItems().forEach(item -> content.append("- ").append(item.getProductName())
                .append(" x ").append(item.getQuantity()).append(" — ")
                .append(formatVnd(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))).append("\n"));
        return content.append("\nTổng thanh toán: ").append(formatVnd(order.getTotalAmount()))
                .append("\nCảm ơn bạn đã mua sắm tại TechZone.").toString();
    }

    private static String formatVnd(BigDecimal amount) {
        return NumberFormat.getNumberInstance(Locale.forLanguageTag("vi-VN")).format(amount) + " ₫";
    }

    private static String paymentLabel(String paymentMethod) {
        if ("COD".equalsIgnoreCase(paymentMethod)) return "Thanh toán khi nhận hàng (COD)";
        if ("VNPAY".equalsIgnoreCase(paymentMethod)) return "VNPay";
        return paymentMethod == null || paymentMethod.isBlank() ? "Chưa xác định" : paymentMethod;
    }

    private static String escape(String value) {
        return HtmlUtils.htmlEscape(value == null ? "" : value);
    }
}
