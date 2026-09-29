package com.example.demo.service;

import com.example.demo.dto.CreateOrderRequest;
import com.example.demo.dto.OrderResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface OrderService {

    /**
     * Đặt hàng từ giỏ hàng:
     * - Tính toán subtotal giỏ hàng
     * - Kiểm tra và áp dụng Voucher
     * - Trừ tồn kho sản phẩm (Optimistic Locking)
     * - Xóa giỏ hàng sau khi tạo đơn thành công
     */
    OrderResponse createOrderFromCart(CreateOrderRequest request);

    OrderResponse getOrderById(Long orderId);

    OrderResponse getOrderByOrderNumber(String orderNumber);

    Page<OrderResponse> getOrdersByUserId(Long userId, Pageable pageable);

    OrderResponse updateOrderStatus(Long orderId, String newStatus);

    /**
     * Hủy đơn hàng và hoàn trả lại số lượng tồn kho cho sản phẩm
     */
    OrderResponse cancelOrder(Long orderId, Long userId);
}
