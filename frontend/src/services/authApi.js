import { apiClient } from './api';

/**
 * Service giao tiếp với các API xác thực người dùng Spring Boot (/api/auth)
 */
export const authApi = {
  // 1. Đăng ký tài khoản mới
  register: async ({ fullName, email, password, phone }) => {
    return await apiClient('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password, phone }),
    });
  },

  // 2. Đăng nhập hệ thống bằng email & password
  login: async ({ email, password }) => {
    return await apiClient('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // 3. Gia hạn Access Token bằng Refresh Token
  refreshToken: async (refreshToken) => {
    return await apiClient('/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },

  // 4. Đăng nhập bằng Google Credential Token (Google OAuth2)
  loginWithGoogle: async (googleCredentialToken) => {
    return await apiClient('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential: googleCredentialToken }),
    });
  },
};

export default authApi;
