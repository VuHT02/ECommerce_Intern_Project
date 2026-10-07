/**
 * Client kết nối RESTful API với Spring Boot Backend (http://localhost:8080/api).
 * Tự động gắn kèm Header Authorization: Bearer <token> khi đã đăng nhập.
 */
const BASE_URL = 'http://localhost:8080/api';

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
    throw new Error(data.message || 'Đã có lỗi xảy ra từ máy chủ');
  }

  return data;
};

export default apiClient;
