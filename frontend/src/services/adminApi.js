import { apiClient } from './api';

const query = (filters) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, value);
  });
  return params.toString();
};

export const adminApi = {
  getDashboard: async () => (await apiClient('/admin/dashboard')).data,

  getProducts: async (filters = {}) =>
    (await apiClient(`/admin/products?${query(filters)}`)).data,

  createProduct: async (product) =>
    (await apiClient('/admin/products', { method: 'POST', body: JSON.stringify(product) })).data,

  updateProduct: async (id, product) =>
    (await apiClient(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(product) })).data,

  deactivateProduct: async (id) =>
    (await apiClient(`/admin/products/${id}`, { method: 'DELETE' })).data,

  getOrders: async (filters = {}) =>
    (await apiClient(`/admin/orders?${query(filters)}`)).data,

  getOrder: async (id) => (await apiClient(`/admin/orders/${id}`)).data,

  updateOrderStatus: async (id, status) =>
    (await apiClient(`/admin/orders/${id}/status`, {
      method: 'PATCH', body: JSON.stringify({ status }),
    })).data,

  getUsers: async (filters = {}) =>
    (await apiClient(`/admin/users?${query(filters)}`)).data,

  updateUserRole: async (id, role) =>
    (await apiClient(`/admin/users/${id}/role`, {
      method: 'PATCH', body: JSON.stringify({ role }),
    })).data,

  updateUserActive: async (id, active) =>
    (await apiClient(`/admin/users/${id}/active`, {
      method: 'PATCH', body: JSON.stringify({ active }),
    })).data,
};
