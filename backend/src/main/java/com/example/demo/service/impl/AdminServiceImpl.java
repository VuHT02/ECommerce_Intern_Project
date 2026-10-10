package com.example.demo.service.impl;

import com.example.demo.dto.AdminDashboardResponse;
import com.example.demo.dto.AdminOrderResponse;
import com.example.demo.dto.AdminUserResponse;
import com.example.demo.dto.OrderItemResponse;
import com.example.demo.entity.Order;
import com.example.demo.entity.User;
import com.example.demo.exception.BadRequestException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.OrderRepository;
import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public AdminDashboardResponse getDashboard() {
        BigDecimal paidRevenue = orderRepository.sumPaidOrderAmounts();
        return AdminDashboardResponse.builder()
                .totalProducts(productRepository.count())
                .activeProducts(productRepository.countByActiveTrue())
                .lowStockProducts(productRepository.countByActiveTrueAndStockQuantityLessThanEqual(5))
                .totalOrders(orderRepository.count())
                .pendingOrders(orderRepository.countByStatusIgnoreCase("PENDING"))
                .totalUsers(userRepository.count())
                .paidOrderCount(orderRepository.countSuccessfulPaidOrders())
                .paidRevenue(paidRevenue == null ? BigDecimal.ZERO : paidRevenue)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminOrderResponse> getOrders(String keyword, String status, String paymentStatus,
                                               LocalDateTime from, LocalDateTime to, Pageable pageable) {
        Specification<Order> spec = (root, query, cb) -> cb.conjunction();
        if (keyword != null && !keyword.isBlank()) {
            String term = "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("orderNumber")), term),
                    cb.like(cb.lower(root.get("recipientName")), term),
                    cb.like(cb.lower(root.get("recipientPhone")), term),
                    cb.like(cb.lower(root.join("user").get("email")), term)));
        }
        if (status != null && !status.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(cb.upper(root.get("status")), status.trim().toUpperCase(Locale.ROOT)));
        }
        if (paymentStatus != null && !paymentStatus.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(cb.upper(root.get("paymentStatus")), paymentStatus.trim().toUpperCase(Locale.ROOT)));
        }
        if (from != null) spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), from));
        if (to != null) spec = spec.and((root, query, cb) -> cb.lessThan(root.get("createdAt"), to));
        return orderRepository.findAll(spec, pageable).map(this::toAdminOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminOrderResponse getOrderById(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng."));
        return toAdminOrder(order);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminUserResponse> getUsers(String keyword, String role, Boolean active, Pageable pageable) {
        Specification<User> spec = (root, query, cb) -> cb.conjunction();
        if (keyword != null && !keyword.isBlank()) {
            String term = "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("email")), term),
                    cb.like(cb.lower(root.get("fullName")), term),
                    cb.like(cb.lower(root.get("phone")), term)));
        }
        if (role != null && !role.isBlank()) {
            String normalizedRole = normalizeRole(role);
            spec = spec.and((root, query, cb) -> cb.equal(cb.upper(root.get("role")), normalizedRole));
        }
        if (active != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("active"), active));
        }
        return userRepository.findAll(spec, pageable).map(this::toAdminUser);
    }

    @Override
    @Transactional
    public AdminUserResponse updateUserRole(Long userId, String requestedRole, String actorEmail) {
        List<User> admins = userRepository.lockAdminAccountsForUpdate();
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản."));
        if (target.getEmail().equalsIgnoreCase(actorEmail)) {
            throw new BadRequestException("Không thể thay đổi vai trò của chính tài khoản đang đăng nhập.");
        }

        String role = normalizeRole(requestedRole);
        if (isAdmin(target.getRole()) && !"ADMIN".equals(role) && isLastActiveAdmin(admins)) {
            throw new BadRequestException("Không thể hạ quyền Admin hoạt động cuối cùng.");
        }
        target.setRole(role);
        return toAdminUser(userRepository.save(target));
    }

    @Override
    @Transactional
    public AdminUserResponse updateUserActive(Long userId, boolean active, String actorEmail) {
        List<User> admins = userRepository.lockAdminAccountsForUpdate();
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản."));
        if (target.getEmail().equalsIgnoreCase(actorEmail) && !active) {
            throw new BadRequestException("Không thể vô hiệu hóa tài khoản đang đăng nhập.");
        }
        if (!active && isAdmin(target.getRole()) && target.isActive() && isLastActiveAdmin(admins)) {
            throw new BadRequestException("Không thể vô hiệu hóa Admin hoạt động cuối cùng.");
        }
        target.setActive(active);
        return toAdminUser(userRepository.save(target));
    }

    private boolean isLastActiveAdmin(List<User> admins) {
        return admins.stream().filter(User::isActive).count() <= 1;
    }

    private boolean isAdmin(String role) {
        return "ADMIN".equals(normalizeRole(role));
    }

    private String normalizeRole(String role) {
        String normalized = role == null ? "" : role.trim().toUpperCase(Locale.ROOT);
        return normalized.startsWith("ROLE_") ? normalized.substring(5) : normalized;
    }

    private AdminUserResponse toAdminUser(User user) {
        return AdminUserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(normalizeRole(user.getRole()))
                .active(user.isActive())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private AdminOrderResponse toAdminOrder(Order order) {
        List<OrderItemResponse> items = order.getItems().stream().map(item -> OrderItemResponse.builder()
                .id(item.getId())
                .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                .productName(item.getProductName())
                .sku(item.getSku())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .subtotal(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .build()).toList();

        return AdminOrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .userId(order.getUser().getId())
                .customerName(order.getUser().getFullName())
                .customerEmail(order.getUser().getEmail())
                .status(order.getStatus())
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(order.getPaymentStatus())
                .subtotal(order.getSubtotal())
                .shippingFee(order.getShippingFee())
                .discountAmount(order.getDiscountAmount())
                .totalAmount(order.getTotalAmount())
                .recipientName(order.getRecipientName())
                .recipientPhone(order.getRecipientPhone())
                .shippingAddress(order.getShippingAddress())
                .createdAt(order.getCreatedAt())
                .items(items)
                .build();
    }
}
