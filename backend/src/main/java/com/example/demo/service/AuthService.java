package com.example.demo.service;

import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.RefreshTokenRequest;
import com.example.demo.dto.RegisterRequest;
import com.example.demo.dto.TokenResponse;

public interface AuthService {

    /**
     * Đăng ký tài khoản khách hàng mới, mã hóa mật khẩu và tạo phiên đăng nhập.
     */
    TokenResponse register(RegisterRequest request);

    /**
     * Xác thực thông tin đăng nhập, sinh Access Token & lưu Refresh Token vào Database.
     */
    TokenResponse login(LoginRequest request);

    /**
     * Xác thực Refresh Token và cấp Access Token mới mà không bắt người dùng đăng nhập lại.
     */
    TokenResponse refreshToken(RefreshTokenRequest request);
}
