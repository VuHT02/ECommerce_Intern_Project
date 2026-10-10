import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Zustand Store quản lý Trạng thái Xác thực Người dùng (Auth State):
 * - isLoggedIn: boolean xác định trạng thái đăng nhập
 * - user: Thông tin người dùng { userId, email, fullName, role }
 * - token: Access Token (JWT)
 * - refreshToken: Refresh Token dùng để làm mới phiên
 * - setAuth: Lưu phiên đăng nhập thành công
 * - logout: Xóa phiên và đưa về trạng thái khách vãng lai
 * - Middleware persist: Tự động lưu trữ xuống localStorage
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      user: null,
      token: null,
      refreshToken: null,

      // Cập nhật thông tin khi đăng nhập / đăng ký thành công
      setAuth: (data) => {
        const token = data.accessToken;
        const refreshToken = data.refreshToken;
        const user = {
          id: data.userId,
          email: data.email,
          fullName: data.fullName,
          role: data.role,
        };

        // Lưu access_token để apiClient tự động đính kèm Bearer token
        if (token) {
          localStorage.setItem('access_token', token);
        }

        set({
          isLoggedIn: true,
          user,
          token,
          refreshToken,
        });
      },

      // Cập nhật chỉ riêng Access Token khi refresh token thành công
      updateAccessToken: (newAccessToken) => {
        localStorage.setItem('access_token', newAccessToken);
        set({ token: newAccessToken });
      },

      updateProfile: (profile) => set((state) => ({
        user: state.user ? { ...state.user, ...profile } : state.user,
      })),

      // Đăng xuất tài khoản
      logout: () => {
        localStorage.removeItem('access_token');
        set({
          isLoggedIn: false,
          user: null,
          token: null,
          refreshToken: null,
        });
      },
    }),
    {
      name: 'ecommerce-auth-storage', // Khóa lưu trữ Zustand trong localStorage
    }
  )
);

export default useAuthStore;
