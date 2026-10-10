import { apiClient } from './api';

export const cartApi = {
  getCart: async (userId) => {
    const response = await apiClient(`/cart/${userId}`);
    return response.data;
  },

  addItem: async (userId, productId, quantity = 1) => {
    const response = await apiClient(`/cart/${userId}/items`, {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
    return response.data;
  },

  updateItem: async (userId, cartItemId, quantity) => {
    const response = await apiClient(`/cart/${userId}/items/${cartItemId}?quantity=${quantity}`, {
      method: 'PUT',
    });
    return response.data;
  },

  removeItem: async (userId, cartItemId) => {
    const response = await apiClient(`/cart/${userId}/items/${cartItemId}`, {
      method: 'DELETE',
    });
    return response.data;
  },

  clearCart: async (userId) => {
    const response = await apiClient(`/cart/${userId}`, { method: 'DELETE' });
    return response.data;
  },
};

export default cartApi;
