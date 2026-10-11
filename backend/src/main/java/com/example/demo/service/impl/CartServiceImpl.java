package com.example.demo.service.impl;

import com.example.demo.dto.AddToCartRequest;
import com.example.demo.dto.CartItemResponse;
import com.example.demo.dto.CartResponse;
import com.example.demo.entity.Cart;
import com.example.demo.entity.CartItem;
import com.example.demo.entity.Product;
import com.example.demo.entity.User;
import com.example.demo.exception.BadRequestException;
import com.example.demo.exception.InsufficientStockException;
import com.example.demo.exception.OutOfStockException;
import com.example.demo.exception.ProductNotFoundException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.CartItemRepository;
import com.example.demo.repository.CartRepository;
import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public CartResponse getCartByUserId(Long userId) {
        Cart cart = getOrCreateCart(userId);
        return mapToCartResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse addToCart(Long userId, AddToCartRequest request) {
        if (request.getQuantity() <= 0) {
            throw new BadRequestException("Số lượng thêm vào giỏ phải lớn hơn 0!");
        }

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ProductNotFoundException(request.getProductId()));

        if (!product.isActive()) {
            throw new BadRequestException("Sản phẩm '" + product.getName() + "' hiện không còn kinh doanh!");
        }

        if (product.getStockQuantity() < request.getQuantity()) {
            throw new OutOfStockException(product.getName(), product.getStockQuantity(), request.getQuantity());
        }

        Cart cart = getOrCreateCart(userId);

        Optional<CartItem> existingItemOpt = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId());
        if (existingItemOpt.isPresent()) {
            CartItem item = existingItemOpt.get();
            int newQuantity = item.getQuantity() + request.getQuantity();
            if (newQuantity > product.getStockQuantity()) {
                throw new OutOfStockException(product.getName(), product.getStockQuantity(), newQuantity);
            }
            item.setQuantity(newQuantity);
            cartItemRepository.save(item);
        } else {
            CartItem newItem = new CartItem();
            newItem.setProduct(product);
            newItem.setQuantity(request.getQuantity());
            cart.addItem(newItem);
            cartItemRepository.save(newItem);
        }

        // Tải lại giỏ hàng đầy đủ chi tiết
        return getCartByUserId(userId);
    }

    @Override
    @Transactional
    public CartResponse updateItemQuantity(Long userId, Long cartItemId, int quantity) {
        if (quantity <= 0) {
            return removeItem(userId, cartItemId);
        }

        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mặt hàng trong giỏ với ID: " + cartItemId));

        if (!item.getCart().getUser().getId().equals(userId)) {
            throw new BadRequestException("Bạn không có quyền chỉnh sửa giỏ hàng này!");
        }

        if (item.getProduct().getStockQuantity() < quantity) {
            throw new InsufficientStockException("Kho chỉ còn " + item.getProduct().getStockQuantity() + " chiếc!");
        }

        item.setQuantity(quantity);
        cartItemRepository.save(item);

        return getCartByUserId(userId);
    }

    @Override
    @Transactional
    public CartResponse removeItem(Long userId, Long cartItemId) {
        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mặt hàng trong giỏ với ID: " + cartItemId));

        if (!item.getCart().getUser().getId().equals(userId)) {
            throw new BadRequestException("Bạn không có quyền chỉnh sửa giỏ hàng này!");
        }

        item.getCart().removeItem(item);
        return getCartByUserId(userId);
    }

    @Override
    @Transactional
    public void clearCart(Long userId) {
        Cart cart = cartRepository.findByUserId(userId).orElse(null);
        if (cart != null) {
            cartItemRepository.deleteByCartId(cart.getId());
        }
    }

    private Cart getOrCreateCart(Long userId) {
        return cartRepository.findByUserIdWithItems(userId).orElseGet(() -> {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + userId));
            Cart newCart = new Cart();
            newCart.setUser(user);
            return cartRepository.save(newCart);
        });
    }

    private CartResponse mapToCartResponse(Cart cart) {
        List<CartItemResponse> itemResponses = new ArrayList<>();
        int totalQuantity = 0;
        BigDecimal totalAmount = BigDecimal.ZERO;

        if (cart.getItems() != null) {
            for (CartItem item : cart.getItems()) {
                Product p = item.getProduct();
                BigDecimal subtotal = p.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
                totalQuantity += item.getQuantity();
                totalAmount = totalAmount.add(subtotal);

                itemResponses.add(CartItemResponse.builder()
                        .id(item.getId())
                        .productId(p.getId())
                        .productName(p.getName())
                        .productSku(p.getSku())
                        .productImageUrl(p.getImageUrl())
                        .unitPrice(p.getPrice())
                        .quantity(item.getQuantity())
                        .subtotal(subtotal)
                        .build());
            }
        }

        return CartResponse.builder()
                .cartId(cart.getId())
                .userId(cart.getUser().getId())
                .items(itemResponses)
                .totalQuantity(totalQuantity)
                .totalAmount(totalAmount)
                .build();
    }
}
