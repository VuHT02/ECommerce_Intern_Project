package com.example.demo.service.impl;

import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.RefreshTokenRequest;
import com.example.demo.dto.RegisterRequest;
import com.example.demo.dto.TokenResponse;
import com.example.demo.entity.RefreshToken;
import com.example.demo.entity.User;
import com.example.demo.exception.BadRequestException;
import com.example.demo.repository.RefreshTokenRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtTokenProvider;
import com.example.demo.service.AuthService;
import com.example.demo.service.GoogleCredentialVerifier;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

/**
 * Triển khai nghiệp vụ Xác thực và Quản lý phiên JWT:
 * - Đăng ký tài khoản mới mã hóa BCrypt
 * - Đăng nhập xác thực và lưu Refresh Token vào Database
 * - Cấp mới Access Token thông qua Refresh Token hợp lệ
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final GoogleCredentialVerifier googleCredentialVerifier;

    @Override
    @Transactional
    public TokenResponse register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        // 1. Kiểm tra email đã tồn tại hay chưa
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BadRequestException("Email '" + normalizedEmail + "' đã được đăng ký trong hệ thống!");
        }

        // 2. Tạo đối tượng User và mã hóa mật khẩu bằng BCrypt
        User user = new User();
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName().trim());
        user.setPhone(request.getPhone());
        user.setRole("CUSTOMER"); // Mặc định khách hàng đăng ký là CUSTOMER
        user.setActive(true);

        User savedUser = userRepository.save(user);
        log.info("[Auth] Đăng ký thành công tài khoản mới cho: {} (ID: {})", savedUser.getEmail(), savedUser.getId());

        // 3. Tự động sinh Access Token & Refresh Token để đăng nhập ngay sau khi đăng ký
        return generateAuthTokens(savedUser);
    }

    @Override
    @Transactional
    public TokenResponse login(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        // 1. Xác thực email và mật khẩu qua Spring Security AuthenticationManager
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword())
            );
        } catch (BadCredentialsException ex) {
            log.warn("[Auth] Đăng nhập thất bại: Sai email hoặc mật khẩu cho {}", normalizedEmail);
            throw new BadRequestException("Email hoặc mật khẩu không chính xác!");
        }

        // 2. Tìm người dùng trong cơ sở dữ liệu
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new BadRequestException("Tài khoản không tồn tại trên hệ thống!"));

        if (!user.isActive()) {
            throw new BadRequestException("Tài khoản của bạn hiện đang bị khóa. Vui lòng liên hệ quản trị viên!");
        }

        log.info("[Auth] Người dùng {} đăng nhập thành công. Đang cấp phát token...", user.getEmail());

        // 3. Sinh cặp token và lưu Refresh Token vào DB
        return generateAuthTokens(user);
    }

    @Override
    @Transactional
    public TokenResponse loginWithGoogle(String credential) {
        var payload = googleCredentialVerifier.verify(credential);
        String email = payload.getEmail().trim().toLowerCase(Locale.ROOT);

        User user = userRepository.findByEmail(email).orElseGet(() -> {
            Object nameClaim = payload.get("name");
            String fullName = nameClaim instanceof String name && !name.isBlank()
                    ? name.trim()
                    : email.substring(0, email.indexOf('@'));
            if (fullName.length() > 150) {
                fullName = fullName.substring(0, 150);
            }

            User newUser = new User();
            newUser.setEmail(email);
            newUser.setFullName(fullName);
            // Google accounts authenticate with Google; this random hash cannot be used as a known password.
            newUser.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
            newUser.setRole("CUSTOMER");
            newUser.setActive(true);
            return userRepository.save(newUser);
        });

        if (!user.isActive()) {
            throw new BadRequestException("TÃ i khoáº£n cá»§a báº¡n hiá»‡n Ä‘ang bá»‹ khÃ³a. Vui lÃ²ng liÃªn há»‡ quáº£n trá»‹ viÃªn!");
        }

        log.info("[Auth] Google sign-in successful for {}", email);
        return generateAuthTokens(user);
    }

    @Override
    @Transactional
    public TokenResponse refreshToken(RefreshTokenRequest request) {
        String tokenStr = request.getRefreshToken();

        // 1. Tìm Refresh Token trong Database
        RefreshToken refreshToken = refreshTokenRepository.findByToken(tokenStr)
                .orElseThrow(() -> new BadRequestException("Refresh Token không hợp lệ hoặc không tồn tại trong hệ thống!"));

        // 2. Kiểm tra xem Refresh Token đã hết hạn trong DB chưa
        if (refreshToken.isExpired()) {
            refreshTokenRepository.delete(refreshToken);
            log.warn("[Auth] Refresh Token của user {} đã hết hạn trong DB. Đã thu hồi token.",
                    refreshToken.getUser().getEmail());
            throw new BadRequestException("Refresh Token đã hết hạn! Vui lòng thực hiện đăng nhập lại.");
        }

        // 3. Kiểm tra tính toàn vẹn chữ ký HMAC của Refresh Token
        if (!jwtTokenProvider.validateToken(tokenStr)) {
            refreshTokenRepository.delete(refreshToken);
            throw new BadRequestException("Chữ ký Refresh Token không hợp lệ hoặc đã bị can thiệp!");
        }

        User user = refreshToken.getUser();
        if (!user.isActive()) {
            throw new BadRequestException("Tài khoản của bạn đã bị vô hiệu hóa!");
        }

        // 4. Sinh Access Token mới (15 phút)
        String newAccessToken = jwtTokenProvider.generateAccessToken(user.getEmail(), user.getRole(), user.getId());
        log.info("[Auth] Cấp mới Access Token thành công cho người dùng: {}", user.getEmail());

        return TokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getAccessTokenExpirationMs())
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .build();
    }

    /**
     * Helper sinh Access Token (15m) + Refresh Token (7d) và lưu/cập nhật vào bảng RefreshTokens.
     */
    private TokenResponse generateAuthTokens(User user) {
        String accessToken = jwtTokenProvider.generateAccessToken(user.getEmail(), user.getRole(), user.getId());
        String refreshTokenStr = jwtTokenProvider.generateRefreshToken(user.getEmail());

        Instant expiryDate = Instant.now().plusMillis(jwtTokenProvider.getRefreshTokenExpirationMs());

        // Cập nhật lại Refresh Token của User trong DB (hoặc tạo mới nếu chưa có)
        RefreshToken refreshToken = refreshTokenRepository.findByUser(user)
                .orElseGet(() -> RefreshToken.builder().user(user).build());

        refreshToken.setToken(refreshTokenStr);
        refreshToken.setExpiryDate(expiryDate);
        refreshTokenRepository.save(refreshToken);

        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenStr)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getAccessTokenExpirationMs())
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .build();
    }
}
