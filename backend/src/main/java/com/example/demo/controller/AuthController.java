package com.example.demo.controller;

import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.ForgotPasswordRequest;
import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.GoogleLoginRequest;
import com.example.demo.dto.RefreshTokenRequest;
import com.example.demo.dto.RegisterRequest;
import com.example.demo.dto.ResetPasswordRequest;
import com.example.demo.dto.TokenResponse;
import com.example.demo.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller phụ trách Xác thực & Quản lý phiên đăng nhập (Authentication):
 * - POST /api/auth/register      → Đăng ký tài khoản khách hàng mới
 * - POST /api/auth/login         → Đăng nhập hệ thống & lấy cặp Access + Refresh Token
 * - POST /api/auth/refresh-token → Cấp mới Access Token khi phiên ngắn hạn hết hạn
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;

    /** Tạo tài khoản mới; đăng ký không tự tạo phiên đăng nhập. */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Void>> register(@Valid @RequestBody RegisterRequest request) {
        log.info("[AuthController] Nhận yêu cầu đăng ký cho email: {}", request.getEmail());
        authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đăng ký thành công. Vui lòng đăng nhập.", null));
    }

    /**
     * 2. API Đăng nhập:
     * Xác thực email và mật khẩu, trả về Access Token (15 phút) và Refresh Token (7 ngày).
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<TokenResponse>> login(@Valid @RequestBody LoginRequest request) {
        log.info("[AuthController] Nhận yêu cầu đăng nhập cho email: {}", request.getEmail());
        TokenResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công!", response));
    }

    /** Sign in with a Google Identity Services credential (Google ID token). */
    @PostMapping("/google")
    public ResponseEntity<ApiResponse<TokenResponse>> loginWithGoogle(
            @Valid @RequestBody GoogleLoginRequest request) {
        TokenResponse response = authService.loginWithGoogle(request.getCredential());
        return ResponseEntity.ok(ApiResponse.success("ÄÄƒng nháº­p báº±ng Google thÃ nh cÃ´ng!", response));
    }

    /** Tạo OTP đặt lại mật khẩu cho tài khoản LOCAL. */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success(
                "Đã gửi mã OTP đặt lại mật khẩu đến email của bạn.", null));
    }

    /** Xác minh OTP một lần và cập nhật mật khẩu mới. */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.getEmail(), request.getOtp(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.success("Đặt lại mật khẩu thành công.", null));
    }

    /** Cấp mới access token từ refresh token hợp lệ. */
    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<TokenResponse>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        log.info("[AuthController] Nhận yêu cầu refresh token");
        TokenResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success("Cấp mới Access Token thành công!", response));
    }
}
