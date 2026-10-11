package com.example.demo.service.impl;

import com.example.demo.dto.CreateOrderRequest;
import com.example.demo.entity.Cart;
import com.example.demo.entity.CartItem;
import com.example.demo.entity.Category;
import com.example.demo.entity.Product;
import com.example.demo.entity.User;
import com.example.demo.exception.OutOfStockException;
import com.example.demo.repository.CartRepository;
import com.example.demo.repository.CategoryRepository;
import com.example.demo.repository.OrderRepository;
import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.OrderService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Integration test thật với Spring Data JPA và H2, kiểm tra khóa DB khi nhiều
 * transaction đồng thời đặt mua sản phẩm cuối cùng.
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:order-concurrency;MODE=MSSQLServer;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=15000",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.show-sql=false",
        "spring.sql.init.mode=always",
        "app.jwt.secret=VGhpc0lzQVRlc3RTZWNyZXRLZXlGb3JKd3RUZXN0aW5nMTIzNDU2Nzg5MA==",
        "vnpay.tmn-code=TESTCODE",
        "vnpay.hash-secret=TESTSECRET",
        "vnpay.pay-url=https://sandbox.example.test/pay",
        "vnpay.return-url=http://localhost/payment/result",
        "vnpay.ipn-url=http://localhost/api/payment/vnpay-ipn"
})
@ActiveProfiles("test")
class OrderConcurrencyTest {

    private static final int CONCURRENT_BUYERS = 10;

    @Autowired
    private OrderService orderService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private CartRepository cartRepository;
    @Autowired
    private OrderRepository orderRepository;

    @Test
    void givenOneItemInStock_whenTenCheckoutTransactionsRace_thenOnlyOneOrderSucceeds() throws Exception {
        // Arrange: tạo dữ liệu thật trong DB, với một user/cart và duy nhất một sản phẩm tồn kho.
        String suffix = UUID.randomUUID().toString().replace("-", "");

        User user = new User();
        user.setEmail("race-" + suffix + "@example.test");
        user.setPasswordHash("not-used-in-this-test");
        user.setRole("USER");
        user = userRepository.saveAndFlush(user);

        Category category = new Category();
        category.setName("Test category " + suffix);
        category.setSlug("test-category-" + suffix);
        category = categoryRepository.saveAndFlush(category);

        Product product = new Product();
        product.setCategory(category);
        product.setSku("RACE-" + suffix);
        product.setName("Last item " + suffix);
        product.setSlug("last-item-" + suffix);
        product.setPrice(new BigDecimal("100000"));
        product.setStockQuantity(1);
        product.setActive(true);
        product = productRepository.saveAndFlush(product);

        Cart cart = new Cart();
        cart.setUser(user);
        CartItem cartItem = new CartItem();
        cartItem.setProduct(product);
        cartItem.setQuantity(1);
        cart.addItem(cartItem);
        cartRepository.saveAndFlush(cart);

        Long userId = user.getId();
        Long productId = product.getId();
        CreateOrderRequest request = CreateOrderRequest.builder()
                .userId(userId)
                .recipientName("Concurrent Buyer")
                .recipientPhone("0900000000")
                .shippingAddress("Test address")
                // Giữ sản phẩm trong giỏ khi đơn chờ thanh toán để cả 10 luồng
                // đều kiểm tra cùng một product, không bị ảnh hưởng bởi xóa cart item.
                .paymentMethod("VNPAY")
                .build();

        ExecutorService executor = Executors.newFixedThreadPool(CONCURRENT_BUYERS);
        CountDownLatch readyLatch = new CountDownLatch(CONCURRENT_BUYERS);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch finishLatch = new CountDownLatch(CONCURRENT_BUYERS);
        AtomicInteger successCount = new AtomicInteger();
        AtomicInteger failCount = new AtomicInteger();
        AtomicReference<Throwable> unexpectedFailure = new AtomicReference<>();
        List<Runnable> checkoutTasks = new ArrayList<>();

        // Arrange: mọi worker chờ cùng một latch để bắt đầu gần như đồng thời.
        for (int i = 0; i < CONCURRENT_BUYERS; i++) {
            checkoutTasks.add(() -> {
                try {
                    readyLatch.countDown();
                    if (!startLatch.await(15, TimeUnit.SECONDS)) {
                        throw new IllegalStateException("Không nhận được tín hiệu bắt đầu test.");
                    }

                    orderService.createOrderFromCart(request);
                    successCount.incrementAndGet();
                } catch (OutOfStockException expected) {
                    // Chín luồng thua phải nhìn thấy stock đã về 0 sau khi lấy được lock.
                    failCount.incrementAndGet();
                } catch (Throwable unexpected) {
                    unexpectedFailure.compareAndSet(null, unexpected);
                } finally {
                    finishLatch.countDown();
                }
            });
        }

        try {
            for (Runnable task : checkoutTasks) {
                executor.submit(task);
            }

            assertTrue(readyLatch.await(15, TimeUnit.SECONDS),
                    "Không phải tất cả worker đều sẵn sàng trước khi bắt đầu.");
            // Act: chỉ mở cổng sau khi đủ 10 worker đã sẵn sàng checkout.
            startLatch.countDown();
            assertTrue(finishLatch.await(45, TimeUnit.SECONDS),
                    "Các luồng checkout không kết thúc trong thời gian cho phép.");
        } finally {
            executor.shutdownNow();
            assertTrue(executor.awaitTermination(15, TimeUnit.SECONDS),
                    "Executor của test không dừng đúng hạn.");
        }

        // Assert: chỉ một transaction trừ được sản phẩm cuối cùng và tạo đơn.
        assertNull(unexpectedFailure.get(), () -> "Lỗi ngoài dự kiến trong worker: " + unexpectedFailure.get());
        assertEquals(1, successCount.get(), "Chỉ một khách hàng được mua sản phẩm cuối cùng.");
        assertEquals(9, failCount.get(), "Chín khách hàng còn lại phải bị từ chối vì hết hàng.");
        assertEquals(0, productRepository.findById(productId).orElseThrow().getStockQuantity());
        assertEquals(1, orderRepository.findByUserIdOrderByCreatedAtDesc(userId).size(),
                "Database chỉ được ghi nhận một đơn hàng thành công cho khách hàng test.");
    }
}
