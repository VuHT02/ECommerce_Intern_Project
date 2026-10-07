import { apiClient } from './api';

/**
 * Service gọi API liên quan đến Đơn hàng (Order) từ Spring Boot Backend:
 * - createOrder: Tạo đơn hàng mới
 * - getOrderById: Chi tiết đơn hàng theo ID
 * - getOrderByNumber: Chi tiết đơn hàng theo mã đơn
 * - getUserOrders: Lịch sử đơn hàng của người dùng theo userId
 * - cancelOrder: Hủy đơn hàng (nếu đang ở PENDING/CONFIRMED)
 */
export const orderApi = {
  // Lấy lịch sử đơn hàng của user
  getUserOrders: async (userId, page = 0, size = 20) => {
    if (!userId) return { content: [], totalPages: 0, totalElements: 0 };
    const res = await apiClient(`/orders/user/${userId}?page=${page}&size=${size}`);
    return res.data; // Page<OrderResponse>
  },

  // Lấy chi tiết đơn hàng theo ID
  getOrderById: async (id) => {
    const res = await apiClient(`/orders/${id}`);
    return res.data; // OrderResponse
  },

  // Lấy chi tiết đơn hàng theo mã đơn (orderNumber)
  getOrderByNumber: async (orderNumber) => {
    const res = await apiClient(`/orders/number/${orderNumber}`);
    return res.data;
  },

  // Tạo đơn hàng mới
  createOrder: async (orderData) => {
    const res = await apiClient('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
    return res.data;
  },

  // Hủy đơn hàng
  cancelOrder: async (orderId, userId) => {
    const res = await apiClient(`/orders/${orderId}/cancel?userId=${userId}`, {
      method: 'DELETE',
    });
    return res.data;
  },
};

export default orderApi;
