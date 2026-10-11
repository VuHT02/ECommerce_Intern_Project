package com.example.demo.service.impl;

import com.example.demo.dto.ApplyVoucherResponse;
import com.example.demo.dto.CreateOrderRequest;
import com.example.demo.dto.OrderItemResponse;
import com.example.demo.dto.OrderResponse;
import com.example.demo.entity.Cart;
import com.example.demo.entity.CartItem;
import com.example.demo.entity.Order;
import com.example.demo.entity.OrderItem;
import com.example.demo.entity.Product;
import com.example.demo.entity.User;
import com.example.demo.entity.Voucher;
import com.example.demo.exception.BadRequestException;
import com.example.demo.exception.InsufficientStockException;
import com.example.demo.exception.OutOfStockException;
import com.example.demo.exception.ProductNotFoundException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.CartItemRepository;
import com.example.demo.repository.CartRepository;
import com.example.demo.repository.OrderRepository;
import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.VoucherRepository;
import com.example.demo.service.OrderService;
import com.example.demo.service.VoucherService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final VoucherRepository voucherRepository;
    private final VoucherService voucherService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderResponse createOrderFromCart(CreateOrderRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + request.getUserId()));

        Cart cart = cartRepository.findByUserIdWithItems(user.getId())
                .orElseThrow(() -> new BadRequestException("Giỏ hàng của bạn đang trống!"));

        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new BadRequestException("Giỏ hàng của bạn đang trống! Hãy thêm sản phẩm trước khi thanh toán.");
        }

        // 1. Tính tổng tiền hàng (subtotal) & Kiểm tra tồn kho trước khi đặt
        BigDecimal subtotal = BigDecimal.ZERO;
        for (CartItem cartItem : cart.getItems()) {
            Product product = cartItem.getProduct();

            if (!product.isActive()) {
                throw new BadRequestException("Sản phẩm '" + product.getName() + "' hiện đã ngừng kinh doanh!");
            }

            if (product.getStockQuantity() < cartItem.getQuantity()) {
                throw new OutOfStockException(product.getName(), product.getStockQuantity(), cartItem.getQuantity());
            }

            BigDecimal itemTotal = product.getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity()));
            subtotal = subtotal.add(itemTotal);
        }

        // 2. Kiểm tra và áp dụng mã giảm giá (Voucher)
        Voucher appliedVoucher = null;
        BigDecimal discountAmount = BigDecimal.ZERO;
        if (request.getVoucherCode() != null && !request.getVoucherCode().trim().isEmpty()) {
            String code = request.getVoucherCode().trim().toUpperCase();
            ApplyVoucherResponse voucherResult = voucherService.validateAndCalculateDiscount(code, subtotal);
            discountAmount = voucherResult.getDiscountAmount();
            appliedVoucher = voucherRepository.findByCode(code).orElse(null);
        }

        // 3. Tính phí giao hàng (Đơn hàng từ 1.000.000đ được Free Ship, ngược lại 30.000đ)
        BigDecimal shippingFee = (subtotal.compareTo(BigDecimal.valueOf(1000000)) >= 0)
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(30000);

        // 4. Tính tổng tiền cần thanh toán
        BigDecimal totalAmount = subtotal.add(shippingFee).subtract(discountAmount);
        if (totalAmount.compareTo(BigDecimal.ZERO) < 0) {
            totalAmount = BigDecimal.ZERO;
        }

        // 5. Trừ số lượng tồn kho của máy tính/điện thoại (Tận dụng Optimistic Lock trên Product)
        for (CartItem cartItem : cart.getItems()) {
            Product product = cartItem.getProduct();
            int remainingStock = product.getStockQuantity() - cartItem.getQuantity();
            product.setStockQuantity(remainingStock);
            productRepository.save(product);
        }

        // 6. Khởi tạo đối tượng Đơn hàng
        String orderNumber = generateOrderNumber();
        Order order = new Order();
        order.setUser(user);
        order.setOrderNumber(orderNumber);
        order.setStatus("PENDING");
        order.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "COD");
        order.setPaymentStatus("UNPAID");
        order.setSubtotal(subtotal);
        order.setShippingFee(shippingFee);
        order.setDiscountAmount(discountAmount);
        order.setVoucher(appliedVoucher);
        order.setTotalAmount(totalAmount);
        order.setRecipientName(request.getRecipientName());
        order.setRecipientPhone(request.getRecipientPhone());
        order.setShippingAddress(request.getShippingAddress());

        // 7. Tạo danh sách chi tiết đơn hàng (OrderDetails)
        List<OrderItem> orderItems = new ArrayList<>();
        for (CartItem cartItem : cart.getItems()) {
            Product p = cartItem.getProduct();
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(p);
            orderItem.setProductName(p.getName());
            orderItem.setSku(p.getSku());
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setUnitPrice(p.getPrice());
            orderItems.add(orderItem);
        }
        order.setItems(orderItems);

        // 8. Lưu đơn hàng
        Order savedOrder = orderRepository.save(order);

        // 9. Cập nhật lượt dùng của Voucher (nếu có)
        if (appliedVoucher != null) {
            voucherService.markVoucherUsed(appliedVoucher.getId());
        }

        // Keep VNPAY items in the user's cart while payment is pending. A failed
        // payment can then be retried; successful VNPAY processing removes only
        // the quantities captured by this order. COD orders consume the cart now.
        if (!"VNPAY".equalsIgnoreCase(order.getPaymentMethod())) {
            cartItemRepository.deleteByCartId(cart.getId());
        }

        return mapToOrderResponse(savedOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + orderId));
        return mapToOrderResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderByOrderNumber(String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với mã: " + orderNumber));
        return mapToOrderResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getOrdersByUserId(Long userId, Pageable pageable) {
        return orderRepository.findByUserId(userId, pageable).map(this::mapToOrderResponse);
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, String newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + orderId));
        String next = newStatus == null ? "" : newStatus.trim().toUpperCase();
        String current = order.getStatus().toUpperCase();
        boolean validTransition = switch (current) {
            case "PENDING" -> "CONFIRMED".equals(next) || "CANCELLED".equals(next);
            case "CONFIRMED" -> "PROCESSING".equals(next) || "CANCELLED".equals(next);
            case "PAID" -> "PROCESSING".equals(next);
            case "PROCESSING" -> "SHIPPING".equals(next);
            case "SHIPPING" -> "DELIVERED".equals(next);
            default -> false;
        };
        if (!validTransition) {
            throw new BadRequestException("Không thể chuyển đơn hàng từ " + current + " sang " + next + ".");
        }

        if ("CANCELLED".equals(next)) {
            if ("PAID".equalsIgnoreCase(order.getPaymentStatus())) {
                throw new BadRequestException("Đơn đã thanh toán. Cần xử lý hoàn tiền riêng trước khi hủy.");
            }
            for (OrderItem item : order.getItems()) {
                Product product = item.getProduct();
                product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
                productRepository.save(product);
            }
            if (order.getVoucher() != null) {
                voucherService.refundVoucherUsage(order.getVoucher().getId());
            }
            if ("VNPAY".equalsIgnoreCase(order.getPaymentMethod())) {
                order.setPaymentStatus("CANCELLED");
            }
        }

        order.setStatus(next);
        return mapToOrderResponse(orderRepository.save(order));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderResponse cancelOrder(Long orderId, Long userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + orderId));

        if (!order.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("Bạn không có quyền hủy đơn hàng này.");
        }

        if (!"PENDING".equalsIgnoreCase(order.getStatus()) && !"CONFIRMED".equalsIgnoreCase(order.getStatus())) {
            throw new BadRequestException("Chỉ có thể hủy đơn hàng khi đang ở trạng thái Chờ xử lý hoặc Đã xác nhận!");
        }

        // Hoàn trả lại số lượng tồn kho cho từng sản phẩm máy tính / điện thoại
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
            productRepository.save(product);
        }

        // Hoàn trả lại lượt dùng của Voucher (nếu đơn hàng có áp dụng)
        if (order.getVoucher() != null) {
            voucherService.refundVoucherUsage(order.getVoucher().getId());
        }

        order.setStatus("CANCELLED");
        return mapToOrderResponse(orderRepository.save(order));
    }

    private OrderResponse mapToOrderResponse(Order order) {
        List<OrderItemResponse> itemResponses = new ArrayList<>();
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                BigDecimal subtotal = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
                itemResponses.add(OrderItemResponse.builder()
                        .id(item.getId())
                        .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                        .productName(item.getProductName())
                        .sku(item.getSku())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .subtotal(subtotal)
                        .build());
            }
        }

        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .userId(order.getUser().getId())
                .status(order.getStatus())
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(order.getPaymentStatus())
                .subtotal(order.getSubtotal())
                .shippingFee(order.getShippingFee())
                .discountAmount(order.getDiscountAmount())
                .voucherCode(order.getVoucher() != null ? order.getVoucher().getCode() : null)
                .totalAmount(order.getTotalAmount())
                .recipientName(order.getRecipientName())
                .recipientPhone(order.getRecipientPhone())
                .shippingAddress(order.getShippingAddress())
                .createdAt(order.getCreatedAt())
                .items(itemResponses)
                .build();
    }

    private String generateOrderNumber() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        int randomNum = ThreadLocalRandom.current().nextInt(1000, 9999);
        return "ORD-" + timestamp + "-" + randomNum;
    }
}
