package com.example.demo.util;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Random;

/**
 * Lớp tiện ích VNPayUtil:
 * - hmacSHA512: Tạo chữ ký số an toàn chống giả mạo / chỉnh sửa dữ liệu trên URL thanh toán
 * - getRandomNumber: Sinh chuỗi số ngẫu nhiên phục vụ mã giao dịch / txnRef
 * - getIpAddress: Lấy địa chỉ IP thực tế của client gọi thanh toán (hỗ trợ reverse proxy / cloudflare)
 */
@Slf4j
public class VNPayUtil {

    private VNPayUtil() {
        // Private constructor ngăn khởi tạo đối tượng utility
    }

    /**
     * 1. Tạo chữ ký số HMAC-SHA512 an toàn chống chỉnh sửa dữ liệu trên URL.
     *
     * @param key  Khóa bí mật (Secret Key do VNPAY cấp)
     * @param data Chuỗi dữ liệu cần băm đã được sắp xếp và format
     * @return Chuỗi chữ ký Hex (128 ký tự)
     */
    public static String hmacSHA512(final String key, final String data) {
        try {
            if (key == null || data == null) {
                throw new IllegalArgumentException("Khóa bí mật và dữ liệu băm không được null");
            }
            Mac hmac512 = Mac.getInstance("HmacSHA512");
            byte[] hmacKeyBytes = key.getBytes(StandardCharsets.UTF_8);
            SecretKeySpec secretKey = new SecretKeySpec(hmacKeyBytes, "HmacSHA512");
            hmac512.init(secretKey);
            byte[] dataBytes = data.getBytes(StandardCharsets.UTF_8);
            byte[] result = hmac512.doFinal(dataBytes);

            StringBuilder sb = new StringBuilder(2 * result.length);
            for (byte b : result) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (Exception ex) {
            log.error("[VNPayUtil] Lỗi khi tạo chữ ký số HMAC-SHA512: {}", ex.getMessage());
            return "";
        }
    }

    /**
     * 2. Sinh chuỗi số ngẫu nhiên với độ dài len chỉ định (dùng tạo mã tham chiếu giao dịch hoặc OTP).
     *
     * @param len Độ dài chuỗi số cần sinh (ví dụ: 6, 8, 10 ký tự)
     * @return Chuỗi số ngẫu nhiên
     */
    public static String getRandomNumber(int len) {
        Random rnd = new Random();
        String chars = "0123456789";
        StringBuilder sb = new StringBuilder(len);
        for (int i = 0; i < len; i++) {
            sb.append(chars.charAt(rnd.nextInt(chars.length())));
        }
        return sb.toString();
    }

    /**
     * 3. Lấy địa chỉ IP của client gọi thanh toán (hỗ trợ qua Proxy / Nginx / Load Balancer).
     *
     * @param request HttpServletRequest gửi từ client
     * @return Chuỗi IPv4 hoặc IPv6 hợp lệ
     */
    public static String getIpAddress(HttpServletRequest request) {
        String ipAddress = request.getHeader("X-FORWARDED-FOR");
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("Proxy-Client-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getRemoteAddr();
        }
        if ("0:0:0:0:0:0:0:1".equals(ipAddress)) {
            ipAddress = "127.0.0.1";
        }
        if (ipAddress != null && ipAddress.contains(",")) {
            ipAddress = ipAddress.split(",")[0].trim();
        }
        return (ipAddress != null && !ipAddress.isEmpty()) ? ipAddress : "127.0.0.1";
    }

    /**
     * Băm các tham số đã sắp xếp theo tên; nội dung URL được mã hóa UTF-8.
     */
    public static String hashAllFields(Map<String, String> fields, String secretKey) {
        List<String> fieldNames = new ArrayList<>(fields.keySet());
        Collections.sort(fieldNames);

        StringBuilder sb = new StringBuilder();
        boolean first = true;
        for (String fieldName : fieldNames) {
            String fieldValue = fields.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                if (!first) sb.append('&');
                sb.append(fieldName);
                sb.append("=");
                sb.append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8));
                first = false;
            }
        }
        return hmacSHA512(secretKey, sb.toString());
    }
}
