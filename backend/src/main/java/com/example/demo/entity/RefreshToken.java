package com.example.demo.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.time.LocalDateTime;

/**
 * Entity lưu trữ Refresh Token để cấp lại Access Token mới mà không bắt người dùng đăng nhập lại.
 * Quan hệ 1-1 với User (Mỗi user chỉ có 1 Refresh Token hợp lệ tại một thời điểm).
 */
@Entity
@Table(name = "RefreshTokens")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "RefreshTokenId")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "UserId", nullable = false, unique = true)
    private User user;

    @Column(name = "Token", nullable = false, unique = true, length = 512)
    private String token;

    @Column(name = "ExpiryDate", nullable = false)
    private Instant expiryDate;

    @CreationTimestamp
    @Column(name = "CreatedAt", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Kiểm tra xem Refresh Token đã hết hạn hay chưa.
     */
    public boolean isExpired() {
        return this.expiryDate.isBefore(Instant.now());
    }
}
