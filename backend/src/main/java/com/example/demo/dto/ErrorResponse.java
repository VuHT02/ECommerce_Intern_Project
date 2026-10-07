package com.example.demo.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * DTO chuẩn hóa phản hồi lỗi tập trung cho toàn bộ hệ thống API.
 * Tuân theo tiêu chuẩn RFC 7807 (Problem Details for HTTP APIs) & Spring Boot Error Attributes.
 *
 * Cấu trúc JSON trả về:
 * {
 *   "timestamp": "2026-10-07T14:10:00",
 *   "status": 404,
 *   "error": "Not Found",
 *   "message": "Không tìm thấy sản phẩm với ID: 99",
 *   "path": "/api/products/99",
 *   "errors": { "field": "message" } // (tuỳ chọn khi có validation)
 * }
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    private int status;
    private String error;
    private String message;
    private String path;
    private Map<String, String> errors;

    // Helper tạo nhanh response lỗi đơn giản
    public static ErrorResponse of(int status, String error, String message, String path) {
        return ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(status)
                .error(error)
                .message(message)
                .path(path)
                .build();
    }

    // Helper tạo nhanh response lỗi kèm validation errors
    public static ErrorResponse of(int status, String error, String message, String path, Map<String, String> errors) {
        return ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(status)
                .error(error)
                .message(message)
                .path(path)
                .errors(errors)
                .build();
    }
}
