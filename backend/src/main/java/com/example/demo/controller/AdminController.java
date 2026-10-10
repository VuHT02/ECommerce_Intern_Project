package com.example.demo.controller;

import com.example.demo.dto.AdminDashboardResponse;
import com.example.demo.dto.AdminOrderResponse;
import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.ProductRequest;
import com.example.demo.dto.ProductResponse;
import com.example.demo.dto.UpdateOrderStatusRequest;
import com.example.demo.exception.BadRequestException;
import com.example.demo.service.AdminService;
import com.example.demo.service.OrderService;
import com.example.demo.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class AdminController {

    private final AdminService adminService;
    private final ProductService productService;
    private final OrderService orderService;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<AdminDashboardResponse>> dashboard() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getDashboard()));
    }

    @GetMapping("/products")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> products(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) Boolean lowStock,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        Pageable pageable = pageable(page, size, sortBy, sortDir,
                new String[]{"createdAt", "name", "price", "stockQuantity", "sku", "id"});
        return ResponseEntity.ok(ApiResponse.success(
                productService.getAdminProducts(keyword, categoryId, active, lowStock, pageable)));
    }

    @PostMapping("/products")
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(@Valid @RequestBody ProductRequest request) {
        ProductResponse product = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Đã tạo sản phẩm.", product));
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật sản phẩm.", productService.updateProduct(id, request)));
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<ApiResponse<Void>> deactivateProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.success("Đã ẩn sản phẩm khỏi cửa hàng.", null));
    }

    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<Page<AdminOrderResponse>>> orders(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String paymentStatus,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new BadRequestException("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.");
        }
        LocalDateTime from = fromDate == null ? null : fromDate.atStartOfDay();
        LocalDateTime to = toDate == null ? null : toDate.plusDays(1).atTime(LocalTime.MIDNIGHT);
        Pageable pageable = pageable(page, size, sortBy, sortDir,
                new String[]{"createdAt", "totalAmount", "status", "orderNumber"});
        return ResponseEntity.ok(ApiResponse.success(adminService.getOrders(
                keyword, status, paymentStatus, from, to, pageable)));
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<ApiResponse<AdminOrderResponse>> orderDetails(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getOrderById(id)));
    }

    @PatchMapping("/orders/{id}/status")
    public ResponseEntity<ApiResponse<com.example.demo.dto.OrderResponse>> updateOrderStatus(
            @PathVariable Long id, @Valid @RequestBody UpdateOrderStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật trạng thái xử lý đơn hàng.",
                orderService.updateOrderStatus(id, request.getStatus())));
    }

    private Pageable pageable(int page, int size, String sortBy, String sortDir, String[] allowedSorts) {
        String property = java.util.Arrays.asList(allowedSorts).contains(sortBy) ? sortBy : "createdAt";
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)), Sort.by(direction, property));
    }
}
