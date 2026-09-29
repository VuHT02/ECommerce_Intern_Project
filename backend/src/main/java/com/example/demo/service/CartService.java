package com.example.demo.service;

import com.example.demo.dto.AddToCartRequest;
import com.example.demo.dto.CartResponse;

public interface CartService {

    CartResponse getCartByUserId(Long userId);

    CartResponse addToCart(Long userId, AddToCartRequest request);

    CartResponse updateItemQuantity(Long userId, Long cartItemId, int quantity);

    CartResponse removeItem(Long userId, Long cartItemId);

    void clearCart(Long userId);
}
