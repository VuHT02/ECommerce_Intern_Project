package com.example.demo.service.impl;

import com.example.demo.dto.AddToCartRequest;
import com.example.demo.dto.CartResponse;
import com.example.demo.entity.Cart;
import com.example.demo.entity.CartItem;
import com.example.demo.entity.Product;
import com.example.demo.entity.User;
import com.example.demo.exception.OutOfStockException;
import com.example.demo.repository.CartItemRepository;
import com.example.demo.repository.CartRepository;
import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CartServiceTest {

    private static final Long USER_ID = 22L;
    private static final Long CART_ID = 41L;
    private static final Long PRODUCT_ID = 63L;

    @Mock
    private CartRepository cartRepository;
    @Mock
    private CartItemRepository cartItemRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CartServiceImpl cartService;

    @Captor
    private ArgumentCaptor<CartItem> cartItemCaptor;

    @Test
    void givenNewProduct_whenAddToCart_thenCartAndItemAreLinkedAndReturned() {
        User user = user(USER_ID);
        Cart cart = spy(cart(CART_ID, user));
        Product product = product(PRODUCT_ID, new BigDecimal("1999000"), 8);

        when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(product));
        when(cartRepository.findByUserIdWithItems(USER_ID)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findByCartIdAndProductId(CART_ID, PRODUCT_ID)).thenReturn(Optional.empty());
        when(cartItemRepository.save(any(CartItem.class))).thenAnswer(invocation -> {
            CartItem savedItem = invocation.getArgument(0);
            savedItem.setId(91L);
            return savedItem;
        });
        clearInvocations(cart);

        CartResponse response = cartService.addToCart(USER_ID,
                AddToCartRequest.builder().productId(PRODUCT_ID).quantity(2).build());

        verify(cart).addItem(cartItemCaptor.capture());
        CartItem addedItem = cartItemCaptor.getValue();
        assertSame(cart, addedItem.getCart());
        assertSame(product, addedItem.getProduct());
        assertEquals(2, addedItem.getQuantity());
        assertEquals(1, cart.getItems().size());
        assertSame(addedItem, cart.getItems().get(0));

        assertEquals(1, response.getItems().size());
        assertEquals(2, response.getItems().get(0).getQuantity());
        assertEquals(0, new BigDecimal("3998000").compareTo(response.getTotalAmount()));
    }

    @Test
    void givenProductAlreadyInCart_whenAddToCart_thenExistingQuantityIsMerged() {
        User user = user(USER_ID);
        Cart cart = cart(CART_ID, user);
        Product product = product(PRODUCT_ID, new BigDecimal("1999000"), 8);
        CartItem existingItem = new CartItem();
        existingItem.setId(92L);
        existingItem.setProduct(product);
        existingItem.setQuantity(3);
        cart.addItem(existingItem);

        when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(product));
        when(cartRepository.findByUserIdWithItems(USER_ID)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findByCartIdAndProductId(CART_ID, PRODUCT_ID))
                .thenReturn(Optional.of(existingItem));
        when(cartItemRepository.save(existingItem)).thenReturn(existingItem);

        CartResponse response = cartService.addToCart(USER_ID,
                AddToCartRequest.builder().productId(PRODUCT_ID).quantity(2).build());

        assertEquals(1, cart.getItems().size());
        assertSame(existingItem, cart.getItems().get(0));
        assertEquals(5, existingItem.getQuantity());
        assertEquals(5, response.getItems().get(0).getQuantity());
        verify(cartItemRepository).save(existingItem);
    }

    @Test
    void givenQuantityExceedsAvailableStock_whenAddToCart_thenRequestIsRejected() {
        Product product = product(PRODUCT_ID, new BigDecimal("1999000"), 2);
        when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(product));

        assertThrows(OutOfStockException.class,
                () -> cartService.addToCart(USER_ID,
                        AddToCartRequest.builder().productId(PRODUCT_ID).quantity(3).build()));

        verifyNoInteractions(cartRepository, cartItemRepository);
    }

    private Cart cart(Long id, User user) {
        Cart cart = new Cart();
        cart.setId(id);
        cart.setUser(user);
        return cart;
    }

    private User user(Long id) {
        User user = new User();
        user.setId(id);
        user.setEmail("buyer" + id + "@example.test");
        return user;
    }

    private Product product(Long id, BigDecimal price, int stock) {
        Product product = new Product();
        product.setId(id);
        product.setName("Test Product");
        product.setSku("TEST-" + id);
        product.setPrice(price);
        product.setStockQuantity(stock);
        product.setActive(true);
        return product;
    }
}
