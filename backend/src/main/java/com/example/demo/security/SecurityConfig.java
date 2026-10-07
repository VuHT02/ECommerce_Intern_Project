package com.example.demo.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Cấu hình bảo mật trung tâm Spring Security 6 & JWT:
 * - SessionCreationPolicy.STATELESS: Phù hợp kiến trúc REST API không lưu session máy chủ
 * - CORS: Cho phép Frontend React Vite (http://localhost:5173) gọi API
 * - BCryptPasswordEncoder: Mã hóa mật khẩu người dùng
 * - Phân quyền: GET public xem sản phẩm/danh mục; POST/PUT/DELETE quản trị yêu cầu ROLE ADMIN/STAFF
 * - Bộ lọc JWT (JwtAuthenticationFilter) tích hợp trước UsernamePasswordAuthenticationFilter
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomAuthenticationEntryPoint authenticationEntryPoint;
    private final CustomAccessDeniedHandler accessDeniedHandler;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // 1. Tắt CSRF vì ứng dụng sử dụng JWT Stateless
            .csrf(AbstractHttpConfigurer::disable)

            // 2. Kích hoạt cấu hình CORS cho Frontend React Vite
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // 3. Quản lý phiên không trạng thái (STATELESS)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // 4. Xử lý Exception bảo mật trả về JSON chuẩn (401 / 403)
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint(authenticationEntryPoint)
                .accessDeniedHandler(accessDeniedHandler)
            )

            // 5. Phân quyền Endpoint API chi tiết
            .authorizeHttpRequests(auth -> auth
                // Endpoint xác thực (Đăng ký, Đăng nhập, Refresh Token): Công khai
                .requestMatchers("/api/auth/**").permitAll()

                // Webhook IPN và Return URL từ cổng thanh toán VNPAY: Công khai (không yêu cầu JWT Bearer)
                .requestMatchers(
                    "/api/payment/vnpay-ipn", "/api/payment/vnpay-return",
                    "/api/v1/payments/vnpay-ipn", "/api/v1/payments/vnpay-return"
                ).permitAll()

                // GET Xem sản phẩm, danh mục, voucher khả dụng: Công khai cho khách vãng lai
                .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/categories/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/vouchers/**").permitAll()

                // POST, PUT, DELETE quản trị sản phẩm / danh mục: Yêu cầu quyền ADMIN hoặc STAFF
                .requestMatchers(HttpMethod.POST, "/api/products/**").hasAnyRole("ADMIN", "STAFF")
                .requestMatchers(HttpMethod.PUT, "/api/products/**").hasAnyRole("ADMIN", "STAFF")
                .requestMatchers(HttpMethod.DELETE, "/api/products/**").hasAnyRole("ADMIN")

                .requestMatchers(HttpMethod.POST, "/api/categories/**").hasAnyRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/categories/**").hasAnyRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/categories/**").hasAnyRole("ADMIN")

                // Cập nhật trạng thái đơn hàng (Duyệt/Giao): Yêu cầu ADMIN hoặc STAFF
                .requestMatchers(HttpMethod.PUT, "/api/orders/*/status").hasAnyRole("ADMIN", "STAFF")

                // Giỏ hàng và đặt hàng: Bắt buộc đã đăng nhập (bất kể Role)
                .requestMatchers("/api/cart/**").authenticated()
                .requestMatchers("/api/orders/**").authenticated()

                // Cho phép xem tài liệu Swagger / OpenAPI nếu có
                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()

                // Mọi request còn lại yêu cầu xác thực
                .anyRequest().authenticated()
            )

            // 6. Thêm JWT Filter trước bộ lọc đăng nhập mặc định
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Cấu hình CORS (Cross-Origin Resource Sharing):
     * Cho phép cổng http://localhost:5173 của React Vite gửi request kèm thông tin xác thực.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept", "X-Requested-With"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L); // Cache kết quả Preflight request trong 1 giờ

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
