package com.example.demo.service;

import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.RefreshTokenRequest;
import com.example.demo.dto.RegisterRequest;
import com.example.demo.dto.TokenResponse;

public interface AuthService {

    /** Đăng ký tài khoản khách hàng mới; người dùng sẽ đăng nhập riêng sau đó. */
    void register(RegisterRequest request);

    /**
     * Xác thực thông tin đăng nhập, sinh Access Token & lưu Refresh Token vào Database.
     */
    TokenResponse login(LoginRequest request);

    /** Verify a Google ID token and create or sign in the corresponding local account. */
    TokenResponse loginWithGoogle(String credential);

    /**
     * Xác thực Refresh Token và cấp Access Token mới mà không bắt người dùng đăng nhập lại.
     */
    TokenResponse refreshToken(RefreshTokenRequest request);

    /** Tạo mã OTP có thời hạn cho tài khoản đăng nhập bằng email và mật khẩu. */
    void forgotPassword(String email);

    /** Xác minh OTP dùng một lần và cập nhật mật khẩu tài khoản LOCAL. */
    void resetPassword(String email, String otp, String newPassword);
}
