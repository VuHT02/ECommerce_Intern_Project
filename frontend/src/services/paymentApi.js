import { apiClient } from './api';

export const paymentApi = {
  createVnPayCheckout: async (orderData) => {
    const response = await apiClient('/payment/checkout', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
    return response.data;
  },

  verifyVnPayReturn: async (queryString) => {
    const response = await apiClient(`/payment/vnpay-return?${queryString}`);
    return response.data;
  },
};

