package com.example.demo.controller;

import com.example.demo.dto.AddToCartRequest;
import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.CartResponse;
import com.example.demo.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * CartController - Quản lý giỏ hàng người dùng
 *
 * GET    /api/cart/{userId}                       → Lấy toàn bộ giỏ hàng + tạm tính
 * POST   /api/cart/{userId}/items                 → Thêm sản phẩm vào giỏ
 * PUT    /api/cart/{userId}/items/{cartItemId}     → Cập nhật số lượng mặt hàng
 * DELETE /api/cart/{userId}/items/{cartItemId}     → Xóa 1 mặt hàng khỏi giỏ
 * DELETE /api/cart/{userId}                        → Xóa toàn bộ giỏ hàng
 */
@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    /**
     * GET /api/cart/{userId}
     * Lấy toàn bộ giỏ hàng kèm thông tin sản phẩm và tổng tiền tạm tính
     */
    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<CartResponse>> getCart(@PathVariable Long userId) {
        return ResponseEntity.ok(
                ApiResponse.success("Lấy giỏ hàng thành công", cartService.getCartByUserId(userId))
        );
    }

    /**
     * POST /api/cart/{userId}/items
     * Thêm sản phẩm vào giỏ (tự động gộp số lượng nếu đã có)
     * Body: { "productId": 1, "quantity": 2 }
     */
    @PostMapping("/{userId}/items")
    public ResponseEntity<ApiResponse<CartResponse>> addToCart(
            @PathVariable Long userId,
            @RequestBody AddToCartRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Đã thêm sản phẩm vào giỏ hàng", cartService.addToCart(userId, request))
        );
    }

    /**
     * PUT /api/cart/{userId}/items/{cartItemId}?quantity=3
     * Cập nhật số lượng sản phẩm trong giỏ (quantity = 0 sẽ tự xóa khỏi giỏ)
     */
    @PutMapping("/{userId}/items/{cartItemId}")
    public ResponseEntity<ApiResponse<CartResponse>> updateItemQuantity(
            @PathVariable Long userId,
            @PathVariable Long cartItemId,
            @RequestParam int quantity) {
        return ResponseEntity.ok(
                ApiResponse.success("Cập nhật giỏ hàng thành công",
                        cartService.updateItemQuantity(userId, cartItemId, quantity))
        );
    }

    /**
     * DELETE /api/cart/{userId}/items/{cartItemId}
     * Xóa 1 mặt hàng cụ thể ra khỏi giỏ hàng
     */
    @DeleteMapping("/{userId}/items/{cartItemId}")
    public ResponseEntity<ApiResponse<CartResponse>> removeItem(
            @PathVariable Long userId,
            @PathVariable Long cartItemId) {
        return ResponseEntity.ok(
                ApiResponse.success("Đã xóa sản phẩm khỏi giỏ hàng", cartService.removeItem(userId, cartItemId))
        );
    }

    /**
     * DELETE /api/cart/{userId}
     * Xóa sạch toàn bộ giỏ hàng (dùng sau khi đặt hàng xong hoặc khi user muốn làm lại)
     */
    @DeleteMapping("/{userId}")
    public ResponseEntity<ApiResponse<Void>> clearCart(@PathVariable Long userId) {
        cartService.clearCart(userId);
        return ResponseEntity.ok(
                ApiResponse.success("Đã xóa toàn bộ giỏ hàng", null)
        );
    }
}
