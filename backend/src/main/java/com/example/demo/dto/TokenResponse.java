package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO phản hồi trả về cặp Access Token & Refresh Token kèm thông tin người dùng.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TokenResponse {

    private String accessToken;
    private String refreshToken;

    @Builder.Default
    private String tokenType = "Bearer";

    private long expiresIn; // Thời hạn Access Token tính bằng mili-giây (ví dụ: 900,000 ms)

    private Long userId;
    private String email;
    private String fullName;
    private String role;
}
