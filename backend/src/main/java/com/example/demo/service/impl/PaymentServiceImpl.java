package com.example.demo.service.impl;

import com.example.demo.config.VnPayConfig;
import com.example.demo.dto.OrderItemResponse;
import com.example.demo.dto.OrderResponse;
import com.example.demo.dto.PaymentResponse;
import com.example.demo.dto.CreateOrderRequest;
import com.example.demo.event.OrderConfirmationEmailRequestedEvent;
import com.example.demo.entity.Cart;
import com.example.demo.entity.CartItem;
import com.example.demo.entity.Order;
import com.example.demo.entity.OrderItem;
import com.example.demo.entity.Product;
import com.example.demo.exception.BadRequestException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.CartItemRepository;
import com.example.demo.repository.CartRepository;
import com.example.demo.repository.OrderRepository;
import com.example.demo.repository.ProductRepository;
import com.example.demo.service.PaymentService;
import com.example.demo.service.OrderService;
import com.example.demo.service.VoucherService;
import com.example.demo.util.VNPayUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
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
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final VoucherService voucherService;
    private final OrderService orderService;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PaymentResponse createVnPayCheckout(CreateOrderRequest orderRequest, HttpServletRequest request) {
        orderRequest.setPaymentMethod("VNPAY");
        OrderResponse createdOrder = orderService.createOrderFromCart(orderRequest);
        PaymentResponse payment = createPaymentUrl(createdOrder.getId(), request);
        payment.setOrderId(createdOrder.getId());
        payment.setOrderNumber(createdOrder.getOrderNumber());
        payment.setAmount(createdOrder.getTotalAmount());
        return payment;
    }

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
        long amount;
        try {
            amount = order.getTotalAmount().multiply(BigDecimal.valueOf(100)).longValueExact();
        } catch (ArithmeticException exception) {
            throw new BadRequestException("Số tiền đơn hàng không hợp lệ để thanh toán VNPAY.");
        }
        if (amount < 500_000L) {
            throw new BadRequestException("Số tiền thanh toán tối thiểu qua VNPAY là 5.000 VND.");
        }

        // 3. Thời gian tạo giao dịch và hạn thanh toán (+15 phút)
        Calendar calendar = Calendar.getInstance(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        formatter.setTimeZone(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
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
                hashData.append(fieldName).append('=').append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8));
                query.append(URLEncoder.encode(fieldName, StandardCharsets.UTF_8))
                        .append('=')
                        .append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8));
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
                .orderId(order.getId())
                .orderNumber(order.getOrderNumber())
                .amount(order.getTotalAmount())
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
        if (!isValidSignature(calculatedHash, vnpSecureHash)
                || !vnPayConfig.getVnp_TmnCode().equals(params.get("vnp_TmnCode"))) {
            log.error("[VNPAY IPN] Sai chữ ký số! Checksum không khớp.");
            response.put("RspCode", "97");
            response.put("Message", "Invalid Checksum");
            return response;
        }

        // 2. Kiểm tra sự tồn tại của đơn hàng
        String orderNumber = params.get("vnp_TxnRef");
        Optional<Order> orderOpt = orderRepository.findByOrderNumberForUpdate(orderNumber);
        if (orderOpt.isEmpty()) {
            log.warn("[VNPAY IPN] Không tìm thấy đơn hàng với mã: {}", orderNumber);
            response.put("RspCode", "01");
            response.put("Message", "Order not found");
            return response;
        }

        Order order = orderOpt.get();
        if (!"VNPAY".equalsIgnoreCase(order.getPaymentMethod())) {
            response.put("RspCode", "03");
            response.put("Message", "Order does not use VNPAY");
            return response;
        }

        // 3. Kiểm tra số tiền giao dịch
        if (!isAmountValid(params.get("vnp_Amount"), order)) {
            log.warn("[VNPAY IPN] Số tiền không khớp! VNPAY: {}, đơn hàng: {} đ",
                    params.get("vnp_Amount"), order.getTotalAmount());
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
        if ("00".equals(responseCode) && "00".equals(params.get("vnp_TransactionStatus"))) {
            // Thanh toán thành công (mã 00) -> Cập nhật đơn thành PAID
            order.setPaymentStatus("PAID");
            order.setStatus("PAID");
            orderRepository.save(order);
            removePurchasedQuantitiesFromCart(order);
            eventPublisher.publishEvent(OrderConfirmationEmailRequestedEvent.from(order));
            log.info("[VNPAY IPN] Đã lưu orderCode={} với orderStatus=PAID, paymentStatus=PAID", orderNumber);
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
        String orderNumber = params.get("vnp_TxnRef");
        log.info("[VNPAY Return] Bắt đầu xác minh orderCode={}, responseCode={}",
                orderNumber, params.get("vnp_ResponseCode"));

        String vnpSecureHash = params.get("vnp_SecureHash");
        Map<String, String> fields = new HashMap<>(params);
        fields.remove("vnp_SecureHash");
        fields.remove("vnp_SecureHashType");

        String calculatedHash = VNPayUtil.hashAllFields(fields, vnPayConfig.getVnp_HashSecret());
        if (!isValidSignature(calculatedHash, vnpSecureHash)
                || !vnPayConfig.getVnp_TmnCode().equals(params.get("vnp_TmnCode"))) {
            log.warn("[VNPAY Return] Chữ ký hoặc mã cửa hàng không hợp lệ cho orderCode={}", orderNumber);
            throw new BadRequestException("Chữ ký bảo mật không hợp lệ!");
        }
        log.info("[VNPAY Return] Chữ ký hợp lệ cho orderCode={}", orderNumber);

        Order order = orderRepository.findByOrderNumberForUpdate(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng: " + orderNumber));
        log.info("[VNPAY Return] Đã tìm thấy đơn orderCode={}, currentStatus={}, currentPaymentStatus={}",
                orderNumber, order.getStatus(), order.getPaymentStatus());

        if (!"VNPAY".equalsIgnoreCase(order.getPaymentMethod())) {
            throw new BadRequestException("Đơn hàng này không sử dụng phương thức VNPAY.");
        }

        if (!isAmountValid(params.get("vnp_Amount"), order)) {
            log.warn("[VNPAY Return] Số tiền không khớp cho orderCode={}", orderNumber);
            throw new BadRequestException("Số tiền thanh toán VNPAY không khớp với đơn hàng.");
        }
        log.info("[VNPAY Return] Số tiền hợp lệ cho orderCode={}", orderNumber);

        String responseCode = params.get("vnp_ResponseCode");
        boolean paymentSucceeded = "00".equals(responseCode);
        if (paymentSucceeded) {
            if ("CANCELLED".equalsIgnoreCase(order.getStatus())
                    || "EXPIRED".equalsIgnoreCase(order.getPaymentStatus())) {
                throw new BadRequestException("Đơn hàng đã hết hạn hoặc bị hủy, không thể xác nhận thanh toán.");
            }
            if (!"PAID".equalsIgnoreCase(order.getPaymentStatus())
                    || !"PAID".equalsIgnoreCase(order.getStatus())) {
                order.setPaymentStatus("PAID");
                order.setStatus("PAID");
                orderRepository.save(order);
                removePurchasedQuantitiesFromCart(order);
                eventPublisher.publishEvent(OrderConfirmationEmailRequestedEvent.from(order));
                log.info("[VNPAY Return] Đã lưu DB orderCode={} với orderStatus=PAID, paymentStatus=PAID",
                        orderNumber);
            } else {
                log.info("[VNPAY Return] orderCode={} đã PAID trước đó, không cập nhật lặp", orderNumber);
            }
        } else {
            log.warn("[VNPAY Return] Giao dịch thất bại orderCode={}, responseCode={}, transactionStatus={}",
                    orderNumber, responseCode, params.get("vnp_TransactionStatus"));
            if (!"CANCELLED".equalsIgnoreCase(order.getStatus())
                    && !"EXPIRED".equalsIgnoreCase(order.getPaymentStatus())) {
                order.setPaymentStatus("FAILED");
                order.setStatus("CANCELLED");
                rollbackStockAndVoucher(order);
                orderRepository.save(order);
            }
        }

        return mapToOrderResponse(order);
    }

    /** Remove only quantities purchased by this order, preserving any later cart additions. */
    private void removePurchasedQuantitiesFromCart(Order order) {
        Cart cart = cartRepository.findByUserId(order.getUser().getId()).orElse(null);
        if (cart == null || order.getItems() == null) return;

        for (OrderItem orderedItem : order.getItems()) {
            CartItem cartItem = cartItemRepository
                    .findByCartIdAndProductId(cart.getId(), orderedItem.getProduct().getId())
                    .orElse(null);
            if (cartItem == null) continue;

            int remainingQuantity = cartItem.getQuantity() - orderedItem.getQuantity();
            if (remainingQuantity <= 0) {
                cartItemRepository.delete(cartItem);
            } else {
                cartItem.setQuantity(remainingQuantity);
                cartItemRepository.save(cartItem);
            }
        }
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

    private boolean isValidSignature(String calculatedHash, String providedHash) {
        return providedHash != null && !providedHash.isBlank()
                && MessageDigest.isEqual(
                        calculatedHash.toLowerCase().getBytes(StandardCharsets.US_ASCII),
                        providedHash.toLowerCase().getBytes(StandardCharsets.US_ASCII));
    }

    private boolean isAmountValid(String amountParam, Order order) {
        if (amountParam == null) return false;
        try {
            long vnpAmount = Long.parseLong(amountParam);
            long expectedAmount = order.getTotalAmount()
                    .multiply(BigDecimal.valueOf(100)).longValueExact();
            return vnpAmount == expectedAmount;
        } catch (NumberFormatException | ArithmeticException exception) {
            return false;
        }
    }
}
