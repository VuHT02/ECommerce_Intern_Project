package com.example.demo.service.impl;

import com.example.demo.dto.CreateOrderRequest;
import com.example.demo.dto.OrderResponse;
import com.example.demo.entity.Cart;
import com.example.demo.entity.CartItem;
import com.example.demo.entity.Order;
import com.example.demo.entity.OrderItem;
import com.example.demo.entity.Product;
import com.example.demo.entity.User;
import com.example.demo.exception.OutOfStockException;
import com.example.demo.repository.CartItemRepository;
import com.example.demo.repository.CartRepository;
import com.example.demo.repository.OrderRepository;
import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.VoucherRepository;
import com.example.demo.service.VoucherService;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    private static final Long USER_ID = 7L;
    private static final Long PRODUCT_ID = 41L;
    private static final BigDecimal DATABASE_PRICE = new BigDecimal("32990000");

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private CartRepository cartRepository;
    @Mock
    private CartItemRepository cartItemRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private VoucherRepository voucherRepository;
    @Mock
    private VoucherService voucherService;

    @InjectMocks
    private OrderServiceImpl orderService;

    @Captor
    private ArgumentCaptor<Order> orderCaptor;
    @Captor
    private ArgumentCaptor<Product> productCaptor;

    @Test
    void givenValidCart_whenCreateOrder_thenOrderSavedAndStockDecreased() {
        OrderFixture fixture = arrangeCart(2, 5, DATABASE_PRICE);
        stubOrderSave();

        OrderResponse response = orderService.createOrderFromCart(validRequest(USER_ID));

        assertEquals(0, new BigDecimal("65980000").compareTo(response.getSubtotal()));
        assertEquals(0, BigDecimal.ZERO.compareTo(response.getShippingFee()));
        assertEquals(0, new BigDecimal("65980000").compareTo(response.getTotalAmount()));
        assertEquals(1, response.getItems().size());
        assertEquals(2, response.getItems().get(0).getQuantity());
        assertEquals(0, DATABASE_PRICE.compareTo(response.getItems().get(0).getUnitPrice()));

        verify(orderRepository).save(orderCaptor.capture());
        Order savedOrder = orderCaptor.getValue();
        assertEquals(USER_ID, savedOrder.getUser().getId());
        assertEquals("PENDING", savedOrder.getStatus());
        assertEquals(1, savedOrder.getItems().size());

        verify(productRepository).save(productCaptor.capture());
        assertEquals(3, productCaptor.getValue().getStockQuantity());
        verify(cartItemRepository).deleteByCartId(fixture.cart().getId());
    }

    @Test
    void givenForgedClientPrice_whenCreateOrder_thenDatabaseCartPriceIsUsed() throws Exception {
        OrderFixture fixture = arrangeCart(1, 3, DATABASE_PRICE);
        stubOrderSave();

        // Checkout DTO has no product/price field; an extra client price is ignored by JSON binding.
        String forgedPayload = """
                {
                  "userId": 7,
                  "recipientName": "Test Buyer",
                  "recipientPhone": "0900000000",
                  "shippingAddress": "Hanoi",
                  "paymentMethod": "COD",
                  "price": 1000
                }
                """;
        CreateOrderRequest request = new ObjectMapper()
                .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
                .readValue(forgedPayload, CreateOrderRequest.class);

        OrderResponse response = orderService.createOrderFromCart(request);

        assertEquals(0, DATABASE_PRICE.compareTo(response.getItems().get(0).getUnitPrice()));
        assertEquals(0, DATABASE_PRICE.compareTo(response.getSubtotal()));
        assertEquals(0, DATABASE_PRICE.compareTo(response.getTotalAmount()));
        assertEquals(2, fixture.product().getStockQuantity());
        verify(orderRepository).save(orderCaptor.capture());
        assertEquals(0, DATABASE_PRICE.compareTo(orderCaptor.getValue().getItems().get(0).getUnitPrice()));
    }

    @Test
    void givenRequestedQuantityExceedsStock_whenCreateOrder_thenOrderIsRejected() {
        arrangeCart(4, 3, DATABASE_PRICE);

        assertThrows(OutOfStockException.class,
                () -> orderService.createOrderFromCart(validRequest(USER_ID)));

        verifyNoInteractions(orderRepository, productRepository, cartItemRepository);
    }

    @Test
    void givenCartCleanupFails_whenCheckout_thenDatabaseStockRollsBack() throws NoSuchMethodException {
        OrderFixture fixture = arrangeCart(2, 5, DATABASE_PRICE);
        stubOrderSave();

        DataSource dataSource = new DriverManagerDataSource(
                "jdbc:h2:mem:order_rollback_" + UUID.randomUUID().toString().replace("-", "")
                        + ";DB_CLOSE_DELAY=-1",
                "sa",
                "");
        JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);
        try {
            jdbcTemplate.execute("CREATE TABLE product_stock (product_id BIGINT PRIMARY KEY, stock_quantity INT NOT NULL)");
            jdbcTemplate.update("INSERT INTO product_stock (product_id, stock_quantity) VALUES (?, ?)",
                    PRODUCT_ID, 5);

            when(productRepository.save(any(Product.class))).thenAnswer(invocation -> {
                Product product = invocation.getArgument(0);
                jdbcTemplate.update("UPDATE product_stock SET stock_quantity = ? WHERE product_id = ?",
                        product.getStockQuantity(), product.getId());
                return product;
            });

            doThrow(new IllegalStateException("Simulated cart cleanup failure"))
                    .when(cartItemRepository).deleteByCartId(fixture.cart().getId());

            CreateOrderRequest request = validRequest(USER_ID);

            TransactionTemplate transactionTemplate = new TransactionTemplate(
                    new DataSourceTransactionManager(dataSource));
            assertThrows(IllegalStateException.class,
                    () -> transactionTemplate.execute(status -> orderService.createOrderFromCart(request)));

            Integer persistedStock = jdbcTemplate.queryForObject(
                    "SELECT stock_quantity FROM product_stock WHERE product_id = ?", Integer.class, PRODUCT_ID);
            assertEquals(5, persistedStock);
            assertEquals(3, fixture.product().getStockQuantity(),
                    "The in-memory entity changed, while the failed DB transaction must restore persisted stock.");

            Transactional transactional = OrderServiceImpl.class
                    .getMethod("createOrderFromCart", CreateOrderRequest.class)
                    .getAnnotation(Transactional.class);
            assertNotNull(transactional);
            assertTrue(Arrays.asList(transactional.rollbackFor()).contains(Exception.class));
            verify(orderRepository).save(any(Order.class));
        } finally {
            jdbcTemplate.execute("SHUTDOWN");
        }
    }

    @Test
    void givenOwnPendingOrder_whenCancelOrder_thenOrderCancelledAndStockRestored() {
        User owner = user(USER_ID);
        Product product = product(90L, "Mouse", "MOUSE-90", new BigDecimal("500000"), 2);
        Order order = new Order();
        order.setId(300L);
        order.setUser(owner);
        order.setStatus("PENDING");
        order.setPaymentMethod("COD");
        order.setPaymentStatus("UNPAID");
        order.setSubtotal(new BigDecimal("1000000"));
        order.setShippingFee(BigDecimal.ZERO);
        order.setDiscountAmount(BigDecimal.ZERO);
        order.setTotalAmount(new BigDecimal("1000000"));
        order.setItems(new java.util.ArrayList<>());

        OrderItem item = new OrderItem();
        item.setOrder(order);
        item.setProduct(product);
        item.setProductName(product.getName());
        item.setSku(product.getSku());
        item.setQuantity(2);
        item.setUnitPrice(product.getPrice());
        order.getItems().add(item);

        when(orderRepository.findById(300L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse response = orderService.cancelOrder(300L, USER_ID);

        assertEquals("CANCELLED", response.getStatus());
        assertEquals(4, product.getStockQuantity());
        verify(productRepository).save(product);
        verify(orderRepository).save(order);
    }

    private OrderFixture arrangeCart(int quantity, int stock, BigDecimal price) {
        User user = user(USER_ID);
        Product product = product(PRODUCT_ID, "ASUS ROG Strix", "ASUS-ROG-41", price, stock);
        Cart cart = new Cart();
        cart.setId(72L);
        cart.setUser(user);

        CartItem cartItem = new CartItem();
        cartItem.setId(73L);
        cartItem.setProduct(product);
        cartItem.setQuantity(quantity);
        cart.addItem(cartItem);

        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(cartRepository.findByUserIdWithItems(USER_ID)).thenReturn(Optional.of(cart));
        return new OrderFixture(cart, product);
    }

    private void stubOrderSave() {
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order order = invocation.getArgument(0);
            order.setId(501L);
            return order;
        });
    }

    private CreateOrderRequest validRequest(Long userId) {
        return CreateOrderRequest.builder()
                .userId(userId)
                .recipientName("Test Buyer")
                .recipientPhone("0900000000")
                .shippingAddress("Hanoi")
                .paymentMethod("COD")
                .build();
    }

    private User user(Long id) {
        User user = new User();
        user.setId(id);
        user.setEmail("buyer" + id + "@example.test");
        return user;
    }

    private Product product(Long id, String name, String sku, BigDecimal price, int stock) {
        Product product = new Product();
        product.setId(id);
        product.setName(name);
        product.setSku(sku);
        product.setPrice(price);
        product.setStockQuantity(stock);
        product.setActive(true);
        return product;
    }

    private record OrderFixture(Cart cart, Product product) { }
}
