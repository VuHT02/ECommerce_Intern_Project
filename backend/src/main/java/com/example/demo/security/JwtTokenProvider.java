package com.example.demo.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SecurityException;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Tiện ích quản lý vòng đời JWT (JSON Web Token):
 * - Đọc Secret Key & thời hạn sống từ application.properties
 * - Sinh Access Token ngắn hạn (15 phút) mang thông tin định danh & quyền hạn
 * - Sinh Refresh Token dài hạn (7 ngày) dùng để cấp mới Access Token
 * - Trích xuất Claims (Subject, Role, UserId) và kiểm tra tính hợp lệ của Token
 */
@Component
@Slf4j
public class JwtTokenProvider {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Getter
    @Value("${app.jwt.access-token-expiration-ms:900000}")
    private long accessTokenExpirationMs; // Mặc định 15 phút (900,000 ms)

    @Getter
    @Value("${app.jwt.refresh-token-expiration-ms:604800000}")
    private long refreshTokenExpirationMs; // Mặc định 7 ngày (604,800,000 ms)

    /**
     * Tạo SecretKey an toàn (HMAC-SHA256) từ chuỗi bí mật.
     */
    private SecretKey getSigningKey() {
        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(jwtSecret);
            if (keyBytes.length < 32) {
                keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
            }
        } catch (Exception e) {
            keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Sinh Access Token chứa email (subject), role và userId.
     * Thời hạn: 15 phút.
     */
    public String generateAccessToken(String email, String role, Long userId) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + accessTokenExpirationMs);

        return Jwts.builder()
                .subject(email)
                .claim("role", role)
                .claim("userId", userId)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Sinh Access Token từ đối tượng Authentication của Spring Security.
     */
    public String generateAccessToken(Authentication authentication, String role, Long userId) {
        String email = authentication.getName();
        return generateAccessToken(email, role, userId);
    }

    /**
     * Sinh Refresh Token dài hạn (7 ngày).
     */
    public String generateRefreshToken(String email) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + refreshTokenExpirationMs);

        return Jwts.builder()
                .subject(email)
                .claim("type", "REFRESH")
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Trích xuất Username/Email từ Token.
     */
    public String getUsernameFromToken(String token) {
        return getClaimsFromToken(token).getSubject();
    }

    /**
     * Trích xuất Role từ Token.
     */
    public String getRoleFromToken(String token) {
        return getClaimsFromToken(token).get("role", String.class);
    }

    /**
     * Trích xuất UserId từ Token.
     */
    public Long getUserIdFromToken(String token) {
        Object val = getClaimsFromToken(token).get("userId");
        if (val instanceof Number number) {
            return number.longValue();
        }
        return null;
    }

    /**
     * Trích xuất toàn bộ Payload Claims từ Token.
     */
    public Claims getClaimsFromToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Kiểm tra tính toàn vẹn và hạn sử dụng của JWT Token.
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (SecurityException | MalformedJwtException ex) {
            log.warn("Chữ ký JWT không hợp lệ hoặc sai định dạng: {}", ex.getMessage());
        } catch (ExpiredJwtException ex) {
            log.warn("JWT Token đã hết hạn: {}", ex.getMessage());
        } catch (UnsupportedJwtException ex) {
            log.warn("JWT Token không được hỗ trợ: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            log.warn("Chuỗi JWT claims rỗng: {}", ex.getMessage());
        }
        return false;
    }
}
