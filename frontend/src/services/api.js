/**
 * Client kết nối RESTful API với Spring Boot Backend (http://localhost:8080/api).
 * Tự động gắn kèm Header Authorization: Bearer <token> khi đã đăng nhập.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const apiClient = async (endpoint, options = {}) => {
  const token = localStorage.getItem('access_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    const err = new Error(data?.message || `Lỗi máy chủ (${response.status})`);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
};

export default apiClient;
