package com.example.demo.config;

import com.example.demo.util.VNPayUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

/**
 * Cấu hình kết nối cổng thanh toán VNPAY Sandbox.
 * Đọc trực tiếp các tham số từ application.properties:
 * vnp_TmnCode, vnp_HashSecret, vnp_PayUrl, vnp_ReturnUrl, vnp_IpnUrl.
 */
@Configuration
@Getter
public class VnPayConfig {

    @Value("${vnpay.tmn-code}")
    private String vnp_TmnCode;

    @Value("${vnpay.hash-secret}")
    private String vnp_HashSecret;

    @Value("${vnpay.pay-url}")
    private String vnp_PayUrl;

    @Value("${vnpay.return-url}")
    private String vnp_ReturnUrl;

    @Value("${vnpay.ipn-url:http://localhost:8080/api/payment/vnpay-ipn}")
    private String vnp_IpnUrl;

    public static final String VNP_VERSION = "2.1.0";
    public static final String VNP_COMMAND = "pay";
    public static final String VNP_CURR_CODE = "VND";
    public static final String VNP_LOCALE = "vn";

    // Getter hỗ trợ định dạng camelCase
    public String getVnpTmnCode() {
        return vnp_TmnCode;
    }

    public String getVnpHashSecret() {
        return vnp_HashSecret;
    }

    public String getVnpPayUrl() {
        return vnp_PayUrl;
    }

    public String getVnpReturnUrl() {
        return vnp_ReturnUrl;
    }

    public String getVnpIpnUrl() {
        return vnp_IpnUrl;
    }

    // Các hàm wrapper gọi tới VNPayUtil
    public String hmacSHA512(String key, String data) {
        return VNPayUtil.hmacSHA512(key, data);
    }

    public String hashAllFields(Map<String, String> fields) {
        return VNPayUtil.hashAllFields(fields, vnp_HashSecret);
    }

    public String getIpAddress(HttpServletRequest request) {
        return VNPayUtil.getIpAddress(request);
    }
}
