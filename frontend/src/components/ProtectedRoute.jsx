import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/**
 * Component bảo vệ các tuyến đường riêng tư (Private/Protected Routes):
 * - Nếu người dùng đã đăng nhập (isLoggedIn = true): Cho phép truy cập vào component con
 * - Nếu là khách vãng lai chưa đăng nhập: Tự động chuyển hướng sang /login,
 *   đồng thời lưu đường dẫn hiện tại vào `state.from` để hỗ trợ Smart Redirection sau khi đăng nhập.
 */
export default function ProtectedRoute({ children }) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
