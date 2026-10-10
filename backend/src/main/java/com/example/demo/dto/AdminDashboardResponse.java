package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class AdminDashboardResponse {
    private long totalProducts;
    private long activeProducts;
    private long lowStockProducts;
    private long totalOrders;
    private long pendingOrders;
    private long totalUsers;
    private long paidOrderCount;
    private BigDecimal paidRevenue;
}
