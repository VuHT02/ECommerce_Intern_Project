import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Mail, Lock, LogIn, AlertCircle, Laptop } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../services/authApi';

export default function LoginPage() {
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);

  // Lấy đường dẫn ban đầu user muốn đến trước khi bị chặn sang /login (mặc định là '/')
  const from = location.state?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  // Xử lý đăng nhập thông thường bằng email/mật khẩu
  const onSubmit = async (formData) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await authApi.login(formData);
      setAuth(response.data);

      // Smart Redirection: Điều hướng về trang gốc hoặc trang chủ
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Email hoặc mật khẩu không chính xác!');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý đăng nhập bằng Google OAuth2
  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await authApi.loginWithGoogle(credentialResponse.credential);
      setAuth(response.data);
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Đăng nhập với Google không thành công!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/30 mb-3">
            <Laptop size={24} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Đăng Nhập Tài Khoản
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Chào mừng bạn quay lại với thế giới công nghệ TechZone
          </p>
          {location.state?.from && (
            <div className="mt-3 text-xs bg-amber-50 text-amber-700 p-2 rounded-lg border border-amber-200">
              Vui lòng đăng nhập để tiếp tục truy cập trang bạn vừa chọn.
            </div>
          )}
        </div>

        {/* Thông báo lỗi */}
        {errorMessage && (
          <div className="mb-6 flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle size={18} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form đăng nhập */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail size={18} />
              </div>
              <input
                type="email"
                placeholder="name@example.com"
                {...register('email', {
                  required: 'Email không được để trống!',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email không đúng định dạng!',
                  },
                })}
                className={`w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border ${
                  errors.email ? 'border-red-500' : 'border-slate-200'
                } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all`}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-600 font-medium">{errors.email.message}</p>
            )}
          </div>

          {/* Mật khẩu */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Mật Khẩu
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input
                type="password"
                placeholder="••••••••"
                {...register('password', {
                  required: 'Mật khẩu không được để trống!',
                  minLength: {
                    value: 8,
                    message: 'Mật khẩu tối thiểu phải từ 8 ký tự trở lên!',
                  },
                })}
                className={`w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border ${
                  errors.password ? 'border-red-500' : 'border-slate-200'
                } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all`}
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-600 font-medium">{errors.password.message}</p>
            )}
          </div>

          {/* Nút Đăng nhập */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md shadow-blue-500/20 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 transition-all"
          >
            <LogIn size={18} />
            <span>{loading ? 'Đang xác thực...' : 'Đăng Nhập'}</span>
          </button>
        </form>

        {/* Phân cách Google */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-slate-400 font-medium">Hoặc tiếp tục với</span>
          </div>
        </div>

        {/* Google Login Button */}
        <div className="flex justify-center w-full">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setErrorMessage('Đăng nhập Google thất bại!')}
            shape="pill"
            text="signin_with"
            locale="vi"
            width="100%"
          />
        </div>

        {/* Footer chuyển sang đăng ký */}
        <div className="text-center mt-6">
          <p className="text-sm text-slate-600">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
