package com.example.demo.event;

import com.example.demo.entity.Order;
import com.example.demo.entity.OrderItem;

import java.math.BigDecimal;
import java.util.List;

/** Snapshot bất biến để gửi email sau commit mà không mang JPA entity/lazy proxy qua thread nền. */
public record OrderConfirmationEmailRequestedEvent(
        String orderNumber,
        String recipientEmail,
        String customerName,
        String paymentMethod,
        BigDecimal totalAmount,
        List<Item> items) {

    public OrderConfirmationEmailRequestedEvent {
        items = items == null ? List.of() : List.copyOf(items);
    }

    public static OrderConfirmationEmailRequestedEvent from(Order order) {
        List<Item> itemSnapshot = order.getItems() == null
                ? List.of()
                : order.getItems().stream().map(OrderConfirmationEmailRequestedEvent::snapshot).toList();

        return new OrderConfirmationEmailRequestedEvent(
                order.getOrderNumber(),
                order.getUser().getEmail(),
                order.getRecipientName(),
                order.getPaymentMethod(),
                order.getTotalAmount(),
                itemSnapshot);
    }

    private static Item snapshot(OrderItem item) {
        return new Item(item.getProductName(), item.getSku(), item.getQuantity(), item.getUnitPrice());
    }

    /** Tạo entity chỉ chứa field cần cho email, không mang lazy proxy sang thread nền. */
    public Order toOrderSnapshot() {
        Order order = new Order();
        order.setOrderNumber(orderNumber);
        order.setRecipientName(customerName);
        order.setPaymentMethod(paymentMethod);
        order.setTotalAmount(totalAmount);
        order.setItems(items.stream().map(item -> item.toOrderItem(order)).toList());
        return order;
    }

    public record Item(String productName, String sku, int quantity, BigDecimal unitPrice) {
        private OrderItem toOrderItem(Order order) {
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProductName(productName);
            orderItem.setSku(sku);
            orderItem.setQuantity(quantity);
            orderItem.setUnitPrice(unitPrice);
            return orderItem;
        }
    }
}
