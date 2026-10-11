package com.example.demo.service;

import com.example.demo.event.OrderConfirmationEmailRequestedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/** Chỉ đưa email vào executor sau khi đơn hàng đã được commit thành công. */
@Component
@RequiredArgsConstructor
public class OrderConfirmationEmailListener {

    private final EmailService emailService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onOrderConfirmationRequested(OrderConfirmationEmailRequestedEvent event) {
        emailService.sendOrderConfirmationEmail(event.toOrderSnapshot(), event.recipientEmail());
    }
}
