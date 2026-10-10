package com.example.demo.controller;

import com.example.demo.dto.AdminUserResponse;
import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.UpdateUserActiveRequest;
import com.example.demo.dto.UpdateUserRoleRequest;
import com.example.demo.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminService adminService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AdminUserResponse>>> getUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        String safeSort = "email".equals(sortBy) || "role".equals(sortBy) ? sortBy : "createdAt";
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)),
                Sort.by(direction, safeSort));
        return ResponseEntity.ok(ApiResponse.success(adminService.getUsers(keyword, role, active, pageable)));
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<ApiResponse<AdminUserResponse>> updateRole(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRoleRequest request,
            @AuthenticationPrincipal UserDetails actor) {
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật vai trò.",
                adminService.updateUserRole(id, request.getRole(), actor.getUsername())));
    }

    @PatchMapping("/{id}/active")
    public ResponseEntity<ApiResponse<AdminUserResponse>> updateActive(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserActiveRequest request,
            @AuthenticationPrincipal UserDetails actor) {
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật trạng thái tài khoản.",
                adminService.updateUserActive(id, request.getActive(), actor.getUsername())));
    }
}
