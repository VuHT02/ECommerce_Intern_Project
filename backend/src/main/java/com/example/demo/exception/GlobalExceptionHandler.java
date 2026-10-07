package com.example.demo.exception;

import com.example.demo.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Bộ xử lý ngoại lệ tập trung (Global Exception Handling) cho toàn bộ ứng dụng Spring Boot.
 * Áp dụng mô hình AOP với @RestControllerAdvice.
 * Đảm bảo 100% response lỗi được chuẩn hóa theo định dạng ErrorResponse:
 * { "timestamp": "...", "status": 4xx/5xx, "error": "...", "message": "...", "path": "...", "errors": {...} }
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * 1. Bắt lỗi không tìm thấy tài nguyên (ResourceNotFoundException & ProductNotFoundException)
     * Trả về HTTP 404 NOT_FOUND
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
        log.warn("[404 Not Found] Path: {} - Message: {}", request.getRequestURI(), ex.getMessage());
        ErrorResponse response = ErrorResponse.of(
                HttpStatus.NOT_FOUND.value(),
                HttpStatus.NOT_FOUND.getReasonPhrase(),
                ex.getMessage(),
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    /**
     * 2. Bắt lỗi sản phẩm hết hàng hoặc không đủ tồn kho (OutOfStockException & InsufficientStockException)
     * Trả về HTTP 409 CONFLICT
     */
    @ExceptionHandler(InsufficientStockException.class)
    public ResponseEntity<ErrorResponse> handleOutOfStock(InsufficientStockException ex, HttpServletRequest request) {
        log.warn("[409 Conflict - Stock] Path: {} - Message: {}", request.getRequestURI(), ex.getMessage());
        ErrorResponse response = ErrorResponse.of(
                HttpStatus.CONFLICT.value(),
                HttpStatus.CONFLICT.getReasonPhrase(),
                ex.getMessage(),
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    /**
     * 3. Bắt lỗi mã giảm giá / Voucher không hợp lệ (InvalidVoucherException)
     * Trả về HTTP 400 BAD_REQUEST
     */
    @ExceptionHandler(InvalidVoucherException.class)
    public ResponseEntity<ErrorResponse> handleInvalidVoucher(InvalidVoucherException ex, HttpServletRequest request) {
        log.warn("[400 Bad Request - Voucher] Path: {} - Message: {}", request.getRequestURI(), ex.getMessage());
        ErrorResponse response = ErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                ex.getMessage(),
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /**
     * 4. Bắt lỗi nghiệp vụ Client không hợp lệ chung (BadRequestException)
     * Trả về HTTP 400 BAD_REQUEST
     */
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(BadRequestException ex, HttpServletRequest request) {
        log.warn("[400 Bad Request] Path: {} - Message: {}", request.getRequestURI(), ex.getMessage());
        ErrorResponse response = ErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                ex.getMessage(),
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /**
     * 5. Bắt lỗi Validate dữ liệu đầu vào (MethodArgumentNotValidException do @Valid sinh ra)
     * Trả về HTTP 400 BAD_REQUEST kèm danh sách chi tiết các field bị lỗi (ví dụ: 'Mật khẩu phải trên 8 ký tự')
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationExceptions(MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                fieldErrors.put(error.getField(), error.getDefaultMessage())
        );

        log.warn("[400 Bad Request - Validation] Path: {} - {} lỗi: {}", request.getRequestURI(), fieldErrors.size(), fieldErrors);

        ErrorResponse response = ErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                "Dữ liệu đầu vào không hợp lệ!",
                request.getRequestURI(),
                fieldErrors
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /**
     * 6. Override lỗi từ chối truy cập Spring Security (AccessDeniedException - 403 Forbidden)
     * Thường xảy ra khi gọi API có yêu cầu Role/Quyền nhưng user không đủ quyền hạn.
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        log.warn("[403 Forbidden] Path: {} - Message: {}", request.getRequestURI(), ex.getMessage());
        ErrorResponse response = ErrorResponse.of(
                HttpStatus.FORBIDDEN.value(),
                HttpStatus.FORBIDDEN.getReasonPhrase(),
                "Bạn không có quyền thực hiện thao tác này!",
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    /**
     * 7. Override lỗi xác thực Spring Security (AuthenticationException - 401 Unauthorized)
     * Thường xảy ra khi chưa đăng nhập hoặc token không hợp lệ.
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthentication(AuthenticationException ex, HttpServletRequest request) {
        log.warn("[401 Unauthorized] Path: {} - Message: {}", request.getRequestURI(), ex.getMessage());
        ErrorResponse response = ErrorResponse.of(
                HttpStatus.UNAUTHORIZED.value(),
                HttpStatus.UNAUTHORIZED.getReasonPhrase(),
                "Bạn cần đăng nhập để thực hiện thao tác này!",
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    /**
     * 8. Bắt lỗi sai kiểu tham số URL (MethodArgumentTypeMismatchException, vd: /api/products/abc thay vì số)
     * Trả về HTTP 400 BAD_REQUEST
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        String requiredType = ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "không xác định";
        String message = String.format("Tham số '%s' có giá trị '%s' không đúng định dạng (yêu cầu kiểu: %s)",
                ex.getName(), ex.getValue(), requiredType);

        log.warn("[400 Type Mismatch] Path: {} - {}", request.getRequestURI(), message);
        ErrorResponse response = ErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                message,
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /**
     * 9. Bắt lỗi JSON payload không đọc được (HttpMessageNotReadableException)
     * Trả về HTTP 400 BAD_REQUEST
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleMessageNotReadable(HttpMessageNotReadableException ex, HttpServletRequest request) {
        log.warn("[400 Malformed JSON] Path: {} - Message: {}", request.getRequestURI(), ex.getMessage());
        ErrorResponse response = ErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                "Dữ liệu JSON gửi lên sai cú pháp hoặc rỗng!",
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /**
     * 10. Bắt lỗi gọi sai phương thức HTTP (HttpRequestMethodNotSupportedException)
     * Trả về HTTP 405 METHOD_NOT_ALLOWED
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotAllowed(HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {
        String message = String.format("Phương thức HTTP '%s' không được hỗ trợ cho đường dẫn này!", ex.getMethod());
        log.warn("[405 Method Not Allowed] Path: {} - {}", request.getRequestURI(), message);
        ErrorResponse response = ErrorResponse.of(
                HttpStatus.METHOD_NOT_ALLOWED.value(),
                HttpStatus.METHOD_NOT_ALLOWED.getReasonPhrase(),
                message,
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(response);
    }

    /**
     * 11. Bắt lỗi hệ thống không lường trước (Exception.class - 500 Internal Server Error)
     * Ghi log chi tiết (dùng SLF4J) kèm full stack trace để kỹ sư debug,
     * nhưng chỉ trả ra client message: 'Lỗi hệ thống cục bộ'.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralException(Exception ex, HttpServletRequest request) {
        // Ghi log chi tiết lỗi kèm stack trace để server admin/dev theo dõi
        log.error("[500 Internal Server Error - Lỗi hệ thống cục bộ] Path: {} - Exception: ", request.getRequestURI(), ex);

        // Client chỉ nhận message an toàn, không bao giờ lộ stack trace nhạy cảm
        ErrorResponse response = ErrorResponse.of(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase(),
                "Lỗi hệ thống cục bộ",
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
