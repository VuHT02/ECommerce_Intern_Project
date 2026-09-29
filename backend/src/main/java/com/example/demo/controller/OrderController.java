package com.example.demo.controller;

import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.CreateOrderRequest;
import com.example.demo.dto.OrderResponse;
import com.example.demo.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * OrderController - Quản lý đơn đặt hàng
 *
 * POST   /api/orders                                  → Tạo đơn hàng từ giỏ (trừ tồn kho, xóa giỏ)
 * GET    /api/orders/{id}                             → Chi tiết đơn hàng theo ID
 * GET    /api/orders/number/{orderNumber}              → Chi tiết đơn hàng theo mã đơn
 * GET    /api/orders/user/{userId}                    → Lịch sử đơn hàng của người dùng
 * PATCH  /api/orders/{id}/status                      → Cập nhật trạng thái đơn [Admin]
 * DELETE /api/orders/{id}/cancel?userId={userId}      → Khách hủy đơn + hoàn kho tự động
 */
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    /**
     * POST /api/orders
     * Tạo đơn hàng từ giỏ hàng của user:
     *  - Kiểm tra tồn kho
     *  - Áp dụng mã giảm giá (Voucher)
     *  - Tính phí vận chuyển tự động
     *  - Trừ số lượng tồn kho máy tính / điện thoại
     *  - Xóa sạch giỏ hàng sau khi đặt thành công
     * Body: CreateOrderRequest JSON
     */
    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(@RequestBody CreateOrderRequest request) {
        OrderResponse order = orderService.createOrderFromCart(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đặt hàng thành công! Cảm ơn bạn đã mua sắm.", order));
    }

    /**
     * GET /api/orders/{id}
     * Chi tiết đơn hàng theo ID (dành cho Admin xem bất kỳ đơn nào)
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.success(orderService.getOrderById(id))
        );
    }

    /**
     * GET /api/orders/number/{orderNumber}
     * Chi tiết đơn hàng theo mã đơn hàng (ví dụ: ORD-20260929-1234)
     * Dùng cho khách hàng tra cứu trạng thái đơn hàng
     */
    @GetMapping("/number/{orderNumber}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderByNumber(@PathVariable String orderNumber) {
        return ResponseEntity.ok(
                ApiResponse.success(orderService.getOrderByOrderNumber(orderNumber))
        );
    }

    /**
     * GET /api/orders/user/{userId}?page=0&size=10
     * Lịch sử tất cả đơn hàng của một người dùng, có phân trang
     * Sắp xếp mới nhất ở đầu
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> getOrdersByUser(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(
                ApiResponse.success("Lấy lịch sử đơn hàng thành công",
                        orderService.getOrdersByUserId(userId, pageable))
        );
    }

    /**
     * PATCH /api/orders/{id}/status?newStatus=CONFIRMED
     * Cập nhật trạng thái đơn hàng [Dành cho Admin]
     * Các trạng thái hợp lệ: PENDING → CONFIRMED → SHIPPING → DELIVERED / CANCELLED
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam String newStatus) {
        return ResponseEntity.ok(
                ApiResponse.success("Cập nhật trạng thái đơn hàng thành công",
                        orderService.updateOrderStatus(id, newStatus))
        );
    }

    /**
     * DELETE /api/orders/{id}/cancel?userId={userId}
     * Khách hàng hủy đơn hàng của mình:
     *  - Chỉ được hủy khi đơn ở trạng thái PENDING hoặc CONFIRMED
     *  - Tự động hoàn trả số lượng tồn kho cho từng sản phẩm
     *  - Tự động hoàn lại lượt dùng của Voucher (nếu có)
     */
    @DeleteMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(
            @PathVariable Long id,
            @RequestParam Long userId) {
        return ResponseEntity.ok(
                ApiResponse.success("Đơn hàng đã được hủy thành công", orderService.cancelOrder(id, userId))
        );
    }
}
