import { apiClient } from './api';

/**
 * Service đồng bộ Giỏ hàng (Cart) với Spring Boot Backend (/api/cart)
 */
export const cartApi = {
  // Lấy giỏ hàng từ DB
  getCart: async (userId) => {
    const res = await apiClient(`/cart/${userId}`);
    return res.data;
  },

  // Thêm sản phẩm vào giỏ DB
  addItem: async (userId, productId, quantity = 1) => {
    const res = await apiClient(`/cart/${userId}/items`, {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
    return res.data;
  },

  // Xóa sạch giỏ hàng DB
  clearCart: async (userId) => {
    const res = await apiClient(`/cart/${userId}`, {
      method: 'DELETE',
    });
    return res.data;
  },

  // Đồng bộ toàn bộ sản phẩm từ local Zustand lên DB giỏ hàng trước khi đặt hàng
  syncCartBeforeCheckout: async (userId, items) => {
    if (!userId || !items || items.length === 0) return;

    // Xóa giỏ cũ để tránh trùng lặp
    try {
      await cartApi.clearCart(userId);
    } catch {
      // Bỏ qua nếu giỏ DB chưa tồn tại
    }

    // Thêm từng sản phẩm vào giỏ DB
    for (const item of items) {
      await cartApi.addItem(userId, item.id, item.quantity);
    }
  },
};

export default cartApi;
