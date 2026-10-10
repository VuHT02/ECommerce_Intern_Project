package com.example.demo.service;

import com.example.demo.dto.AdminDashboardResponse;
import com.example.demo.dto.AdminOrderResponse;
import com.example.demo.dto.AdminUserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;

public interface AdminService {
    AdminDashboardResponse getDashboard();

    Page<AdminOrderResponse> getOrders(String keyword, String status, String paymentStatus,
                                       LocalDateTime from, LocalDateTime to, Pageable pageable);

    AdminOrderResponse getOrderById(Long orderId);

    Page<AdminUserResponse> getUsers(String keyword, String role, Boolean active, Pageable pageable);

    AdminUserResponse updateUserRole(Long userId, String role, String actorEmail);

    AdminUserResponse updateUserActive(Long userId, boolean active, String actorEmail);
}
