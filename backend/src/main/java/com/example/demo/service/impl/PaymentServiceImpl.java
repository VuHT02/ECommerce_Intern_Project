package com.example.demo.service.impl;

import com.example.demo.config.VnPayConfig;
import com.example.demo.dto.OrderItemResponse;
import com.example.demo.dto.OrderResponse;
import com.example.demo.dto.PaymentResponse;
import com.example.demo.entity.Order;
import com.example.demo.entity.OrderItem;
import com.example.demo.entity.Product;
import com.example.demo.exception.BadRequestException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.OrderRepository;
import com.example.demo.repository.ProductRepository;
import com.example.demo.service.PaymentService;
import com.example.demo.service.VoucherService;
import com.example.demo.util.VNPayUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TimeZone;

/**
 * Xử lý logic nghiệp vụ thanh toán VNPAY Sandbox:
 * - createPaymentUrl: Tạo URL thanh toán kiểm tra trạng thái PENDING
 * - processIpn: Xử lý Webhook IPN từ VNPAY, kiểm tra tính lũy đẳng (Idempotency) và hoàn kho khi thất bại
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentServiceImpl implements PaymentService {

    private final VnPayConfig vnPayConfig;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final VoucherService voucherService;

    @Override
    @Transactional
    public PaymentResponse createPaymentUrl(Long orderId, HttpServletRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + orderId));

        // 1. Kiểm tra điều kiện: Chỉ tạo link thanh toán khi đơn hàng đang ở trạng thái PENDING
        if (!"PENDING".equalsIgnoreCase(order.getStatus())) {
            throw new BadRequestException("Chỉ có thể tạo thanh toán cho đơn hàng đang ở trạng thái Chờ xử lý (PENDING)!");
        }

        if ("PAID".equalsIgnoreCase(order.getPaymentStatus())) {
            throw new BadRequestException("Đơn hàng này đã được thanh toán thành công trước đó!");
        }

        // 2. Tính tổng tiền cần thanh toán (nhân 100 theo quy định không dấu thập phân của VNPAY)
        long amount = order.getTotalAmount().multiply(BigDecimal.valueOf(100)).longValue();

        // 3. Thời gian tạo giao dịch và hạn thanh toán (+15 phút)
        Calendar calendar = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        String createDate = formatter.format(calendar.getTime());

        calendar.add(Calendar.MINUTE, 15);
        String expireDate = formatter.format(calendar.getTime());

        // 4. Xây dựng các tham số URL gửi sang VNPAY
        Map<String, String> vnpParams = new HashMap<>();
        vnpParams.put("vnp_Version", VnPayConfig.VNP_VERSION);
        vnpParams.put("vnp_Command", VnPayConfig.VNP_COMMAND);
        vnpParams.put("vnp_TmnCode", vnPayConfig.getVnp_TmnCode());
        vnpParams.put("vnp_Amount", String.valueOf(amount));
        vnpParams.put("vnp_CurrCode", VnPayConfig.VNP_CURR_CODE);
        vnpParams.put("vnp_TxnRef", order.getOrderNumber());
        vnpParams.put("vnp_OrderInfo", "Thanh toan don hang #" + order.getOrderNumber());
        vnpParams.put("vnp_OrderType", "other");
        vnpParams.put("vnp_Locale", VnPayConfig.VNP_LOCALE);
        vnpParams.put("vnp_ReturnUrl", vnPayConfig.getVnp_ReturnUrl());
        vnpParams.put("vnp_IpAddr", VNPayUtil.getIpAddress(request));
        vnpParams.put("vnp_CreateDate", createDate);
        vnpParams.put("vnp_ExpireDate", expireDate);

        // 5. Sắp xếp các tham số theo bảng chữ cái US-ASCII để tính toán chữ ký số HmacSHA512
        List<String> fieldNames = new ArrayList<>(vnpParams.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();

        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnpParams.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                hashData.append(fieldName).append('=').append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII))
                        .append('=')
                        .append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                if (itr.hasNext()) {
                    query.append('&');
                    hashData.append('&');
                }
            }
        }

        // Tạo chữ ký số HMAC-SHA512 an toàn chống chỉnh sửa dữ liệu
        String secureHash = VNPayUtil.hmacSHA512(vnPayConfig.getVnp_HashSecret(), hashData.toString());
        String paymentUrl = vnPayConfig.getVnp_PayUrl() + "?" + query.toString() + "&vnp_SecureHash=" + secureHash;

        // Cập nhật phương thức thanh toán là VNPAY cho đơn hàng
        order.setPaymentMethod("VNPAY");
        orderRepository.save(order);

        log.info("[VNPAY] Tạo link thanh toán thành công cho đơn hàng #{} - Số tiền: {} đ",
                order.getOrderNumber(), order.getTotalAmount());

        return PaymentResponse.builder()
                .paymentUrl(paymentUrl)
                .status("OK")
                .message("Tạo URL chuyển hướng VNPAY thành công!")
                .build();
    }

    @Override
    @Transactional
    public Map<String, String> processIpn(Map<String, String> params) {
        log.info("[VNPAY IPN] Bắt đầu xử lý Webhook ngầm từ máy chủ VNPAY: {}", params);
        Map<String, String> response = new HashMap<>();

        // 1. Kiểm tra chữ ký Checksum hợp lệ
        String vnpSecureHash = params.get("vnp_SecureHash");
        Map<String, String> fields = new HashMap<>(params);
        fields.remove("vnp_SecureHash");
        fields.remove("vnp_SecureHashType");

        String calculatedHash = VNPayUtil.hashAllFields(fields, vnPayConfig.getVnp_HashSecret());
        if (!calculatedHash.equalsIgnoreCase(vnpSecureHash)) {
            log.error("[VNPAY IPN] Sai chữ ký số! Checksum không khớp.");
            response.put("RspCode", "97");
            response.put("Message", "Invalid Checksum");
            return response;
        }

        // 2. Kiểm tra sự tồn tại của đơn hàng
        String orderNumber = params.get("vnp_TxnRef");
        Optional<Order> orderOpt = orderRepository.findByOrderNumber(orderNumber);
        if (orderOpt.isEmpty()) {
            log.warn("[VNPAY IPN] Không tìm thấy đơn hàng với mã: {}", orderNumber);
            response.put("RspCode", "01");
            response.put("Message", "Order not found");
            return response;
        }

        Order order = orderOpt.get();

        // 3. Kiểm tra số tiền giao dịch
        long vnpAmount = Long.parseLong(params.get("vnp_Amount")) / 100;
        long orderAmount = order.getTotalAmount().longValue();
        if (vnpAmount != orderAmount) {
            log.warn("[VNPAY IPN] Số tiền không khớp! VNPAY: {} đ, Đơn hàng: {} đ", vnpAmount, orderAmount);
            response.put("RspCode", "04");
            response.put("Message", "Invalid Amount");
            return response;
        }

        // 4. Kiểm tra Tính lũy đẳng (Idempotency): Nếu đơn hàng đã ở trạng thái PAID hoặc CANCELLED, trả về mã 02 ('Order already confirmed')
        if ("PAID".equalsIgnoreCase(order.getPaymentStatus()) || "CANCELLED".equalsIgnoreCase(order.getStatus())) {
            log.info("[VNPAY IPN - Idempotency] Đơn hàng #{} đã ở trạng thái {} / {}. Bỏ qua xử lý lặp lại.",
                    orderNumber, order.getPaymentStatus(), order.getStatus());
            response.put("RspCode", "02");
            response.put("Message", "Order already confirmed");
            return response;
        }

        // 5. Kiểm tra mã phản hồi từ VNPAY
        String responseCode = params.get("vnp_ResponseCode");
        if ("00".equals(responseCode)) {
            // Thanh toán thành công (mã 00) -> Cập nhật đơn thành PAID
            order.setPaymentStatus("PAID");
            order.setStatus("PROCESSING");
            orderRepository.save(order);
            log.info("[VNPAY IPN] Thanh toán THÀNH CÔNG cho đơn hàng #{}. Trạng thái -> PAID", orderNumber);
        } else {
            // Thanh toán thất bại -> Cập nhật FAILED, đồng thời hoàn trả lại số lượng sản phẩm vào kho (Product.stockQuantity)
            order.setPaymentStatus("FAILED");
            order.setStatus("CANCELLED");

            rollbackStockAndVoucher(order);
            orderRepository.save(order);
            log.warn("[VNPAY IPN] Thanh toán thất bại (Mã lỗi: {}). Đã hủy đơn #{} và hoàn trả tồn kho.",
                    responseCode, orderNumber);
        }

        response.put("RspCode", "00");
        response.put("Message", "Confirm Success");
        return response;
    }

    @Override
    @Transactional
    public OrderResponse processPaymentReturn(Map<String, String> params) {
        String vnpSecureHash = params.get("vnp_SecureHash");
        Map<String, String> fields = new HashMap<>(params);
        fields.remove("vnp_SecureHash");
        fields.remove("vnp_SecureHashType");

        String calculatedHash = VNPayUtil.hashAllFields(fields, vnPayConfig.getVnp_HashSecret());
        if (!calculatedHash.equalsIgnoreCase(vnpSecureHash)) {
            throw new BadRequestException("Chữ ký bảo mật không hợp lệ!");
        }

        String orderNumber = params.get("vnp_TxnRef");
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng: " + orderNumber));

        String responseCode = params.get("vnp_ResponseCode");
        if ("00".equals(responseCode)) {
            if (!"PAID".equalsIgnoreCase(order.getPaymentStatus())) {
                order.setPaymentStatus("PAID");
                order.setStatus("PROCESSING");
                orderRepository.save(order);
            }
        } else {
            if (!"CANCELLED".equalsIgnoreCase(order.getStatus())) {
                order.setPaymentStatus("FAILED");
                order.setStatus("CANCELLED");
                rollbackStockAndVoucher(order);
                orderRepository.save(order);
            }
        }

        return mapToOrderResponse(order);
    }

    @Override
    @Scheduled(cron = "0 */5 * * * *")
    @Transactional
    public void cancelExpiredVnPayOrders() {
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(15);
        List<Order> expiredOrders = orderRepository.findByPaymentStatusAndPaymentMethodAndStatusAndCreatedAtBefore(
                "UNPAID", "VNPAY", "PENDING", threshold);

        if (!expiredOrders.isEmpty()) {
            log.info("[VNPAY Auto-Cancel] Quét thấy {} đơn hàng quá hạn 15 phút chưa thanh toán.", expiredOrders.size());
            for (Order order : expiredOrders) {
                order.setStatus("CANCELLED");
                order.setPaymentStatus("EXPIRED");
                rollbackStockAndVoucher(order);
                orderRepository.save(order);
                log.info("[VNPAY Auto-Cancel] Đã tự động hủy đơn #{} và hoàn trả tồn kho.", order.getOrderNumber());
            }
        }
    }

    /**
     * Hoàn trả lại số lượng tồn kho sản phẩm (Product.stockQuantity) và lượt dùng voucher khi đơn hàng bị hủy/thất bại.
     */
    private void rollbackStockAndVoucher(Order order) {
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                Product product = item.getProduct();
                if (product != null) {
                    product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
                    productRepository.save(product);
                    log.info("[Rollback Stock] Hoàn trả {} chiếc cho sản phẩm '{}' (ID: {})",
                            item.getQuantity(), product.getName(), product.getId());
                }
            }
        }

        if (order.getVoucher() != null) {
            voucherService.refundVoucherUsage(order.getVoucher().getId());
            log.info("[Rollback Voucher] Đã hoàn trả lượt sử dụng cho mã voucher '{}'", order.getVoucher().getCode());
        }
    }

    private OrderResponse mapToOrderResponse(Order order) {
        List<OrderItemResponse> itemResponses = new ArrayList<>();
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                BigDecimal subtotal = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
                itemResponses.add(OrderItemResponse.builder()
                        .id(item.getId())
                        .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                        .productName(item.getProductName())
                        .sku(item.getSku())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .subtotal(subtotal)
                        .build());
            }
        }

        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .userId(order.getUser().getId())
                .status(order.getStatus())
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(order.getPaymentStatus())
                .subtotal(order.getSubtotal())
                .shippingFee(order.getShippingFee())
                .discountAmount(order.getDiscountAmount())
                .voucherCode(order.getVoucher() != null ? order.getVoucher().getCode() : null)
                .totalAmount(order.getTotalAmount())
                .recipientName(order.getRecipientName())
                .recipientPhone(order.getRecipientPhone())
                .shippingAddress(order.getShippingAddress())
                .items(itemResponses)
                .createdAt(order.getCreatedAt())
                .build();
    }
}
