package com.example.demo.service.impl;

import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.RefreshTokenRequest;
import com.example.demo.dto.RegisterRequest;
import com.example.demo.dto.TokenResponse;
import com.example.demo.event.PasswordResetOtpRequestedEvent;
import com.example.demo.entity.RefreshToken;
import com.example.demo.entity.User;
import com.example.demo.exception.BadRequestException;
import com.example.demo.repository.RefreshTokenRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtTokenProvider;
import com.example.demo.service.AuthService;
import com.example.demo.service.GoogleCredentialVerifier;
import org.springframework.context.ApplicationEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDateTime;
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

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int OTP_LIFETIME_MINUTES = 15;
    private static final int OTP_MAX_ATTEMPTS = 5;
    private static final int OTP_REQUEST_COOLDOWN_SECONDS = 60;
    private static final int BCRYPT_MAX_PASSWORD_BYTES = 72;

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final GoogleCredentialVerifier googleCredentialVerifier;
    private final ApplicationEventPublisher eventPublisher;

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
        user.setAuthProvider("LOCAL");
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
            newUser.setAuthProvider("GOOGLE");
            newUser.setRole("CUSTOMER");
            newUser.setActive(true);
            return userRepository.save(newUser);
        });

        if (!user.isActive()) {
            throw new BadRequestException("TÃ i khoáº£n cá»§a báº¡n hiá»‡n Ä‘ang bá»‹ khÃ³a. Vui lÃ²ng liÃªn há»‡ quáº£n trá»‹ viÃªn!");
        }

        // Backfill legacy rows, which have no provider marker, after Google verification.
        if (user.getAuthProvider() == null || user.getAuthProvider().isBlank()) {
            user.setAuthProvider("GOOGLE");
            userRepository.save(user);
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

    @Override
    @Transactional
    public void forgotPassword(String email) {
        String normalizedEmail = normalizeEmail(email);
        User user = userRepository.findByEmailForUpdate(normalizedEmail)
                .orElseThrow(() -> new BadRequestException("Email không tồn tại"));

        if ("GOOGLE".equalsIgnoreCase(user.getAuthProvider())) {
            throw new BadRequestException(
                    "Tài khoản này đăng nhập bằng Google. Vui lòng chọn đăng nhập bằng Google.");
        }
        if (user.getAuthProvider() != null && !"LOCAL".equalsIgnoreCase(user.getAuthProvider())) {
            throw new BadRequestException("Tài khoản không hỗ trợ đặt lại mật khẩu bằng email.");
        }

        LocalDateTime now = LocalDateTime.now();
        if (user.getResetPasswordOtpRequestedAt() != null
                && now.isBefore(user.getResetPasswordOtpRequestedAt()
                        .plusSeconds(OTP_REQUEST_COOLDOWN_SECONDS))) {
            throw new BadRequestException("Vui lòng đợi 60 giây trước khi yêu cầu mã OTP mới.");
        }

        String otp = String.format(Locale.ROOT, "%06d", SECURE_RANDOM.nextInt(1_000_000));
        LocalDateTime expiryTime = now.plusMinutes(OTP_LIFETIME_MINUTES);

        // Chỉ lưu hash BCrypt trong database; OTP thô chỉ tồn tại để gửi qua email.
        user.setResetPasswordOtp(passwordEncoder.encode(otp));
        user.setOtpExpiryTime(expiryTime);
        user.setResetPasswordOtpAttempts(0);
        user.setResetPasswordOtpRequestedAt(now);
        userRepository.save(user);

        // Email được gửi sau khi transaction lưu OTP đã commit thành công.
        eventPublisher.publishEvent(new PasswordResetOtpRequestedEvent(
                user.getEmail(), otp, expiryTime));
        log.info("[Auth] Password reset code issued for account {}", maskEmail(user.getEmail()));
    }

    @Override
    @Transactional(noRollbackFor = BadRequestException.class)
    public void resetPassword(String email, String otp, String newPassword) {
        String normalizedEmail = normalizeEmail(email);
        User user = userRepository.findByEmailForUpdate(normalizedEmail)
                .orElseThrow(() -> new BadRequestException("Email không tồn tại"));

        if ("GOOGLE".equalsIgnoreCase(user.getAuthProvider())) {
            throw new BadRequestException(
                    "Tài khoản này đăng nhập bằng Google. Vui lòng chọn đăng nhập bằng Google.");
        }
        if (user.getAuthProvider() != null && !"LOCAL".equalsIgnoreCase(user.getAuthProvider())) {
            throw new BadRequestException("Tài khoản không hỗ trợ đặt lại mật khẩu bằng email.");
        }

        LocalDateTime now = LocalDateTime.now();
        if (user.getResetPasswordOtp() == null
                || user.getOtpExpiryTime() == null
                || !now.isBefore(user.getOtpExpiryTime())) {
            user.setResetPasswordOtp(null);
            user.setOtpExpiryTime(null);
            user.setResetPasswordOtpAttempts(0);
            userRepository.save(user);
            throw new BadRequestException("Mã OTP không hợp lệ hoặc đã hết hạn.");
        }

        if (!passwordEncoder.matches(otp, user.getResetPasswordOtp())) {
            int failedAttempts = (user.getResetPasswordOtpAttempts() == null
                    ? 0 : user.getResetPasswordOtpAttempts()) + 1;
            user.setResetPasswordOtpAttempts(failedAttempts);
            if (failedAttempts >= OTP_MAX_ATTEMPTS) {
                user.setResetPasswordOtp(null);
                user.setOtpExpiryTime(null);
                user.setResetPasswordOtpAttempts(0);
            }
            userRepository.save(user);
            throw new BadRequestException(failedAttempts >= OTP_MAX_ATTEMPTS
                    ? "Bạn đã nhập sai OTP quá số lần cho phép. Hãy yêu cầu mã mới."
                    : "Mã OTP không hợp lệ hoặc đã hết hạn.");
        }

        // BCrypt giới hạn đầu vào 72 byte; kiểm tra trước khi gọi encoder để có lỗi rõ ràng.
        if (newPassword.getBytes(StandardCharsets.UTF_8).length > BCRYPT_MAX_PASSWORD_BYTES) {
            throw new BadRequestException("Mật khẩu mới vượt quá giới hạn hỗ trợ.");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setResetPasswordOtp(null);
        user.setOtpExpiryTime(null);
        user.setResetPasswordOtpAttempts(0);
        user.setResetPasswordOtpRequestedAt(null);
        userRepository.save(user);

        // Thu hồi refresh token để buộc các phiên đăng nhập cũ xác thực lại.
        refreshTokenRepository.deleteByUser(user);
        log.info("[Auth] Password reset completed for account {}", maskEmail(user.getEmail()));
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static String maskEmail(String email) {
        int at = email.indexOf('@');
        if (at <= 1) {
            return "***" + (at >= 0 ? email.substring(at) : "");
        }
        return email.charAt(0) + "***" + email.substring(at);
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
