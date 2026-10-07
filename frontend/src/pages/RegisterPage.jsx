import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, UserPlus, AlertCircle, Laptop } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../services/authApi';

export default function RegisterPage() {
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const passwordValue = watch('password');

  const onSubmit = async (formData) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await authApi.register(formData);
      setAuth(response.data);
      navigate('/', { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Đăng ký tài khoản không thành công!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/30 mb-3">
            <Laptop size={24} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Tạo Tài Khoản Mới
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Gia nhập cộng đồng TechZone để nhận ngập tràn voucher ưu đãi
          </p>
        </div>

        {/* Thông báo lỗi */}
        {errorMessage && (
          <div className="mb-6 flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle size={18} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form đăng ký */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Họ và tên */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Họ và Tên
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User size={18} />
              </div>
              <input
                type="text"
                placeholder="Nguyễn Văn A"
                {...register('fullName', {
                  required: 'Họ và tên không được để trống!',
                  minLength: { value: 2, message: 'Họ và tên tối thiểu 2 ký tự!' },
                })}
                className={`w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border ${
                  errors.fullName ? 'border-red-500' : 'border-slate-200'
                } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all`}
              />
            </div>
            {errors.fullName && (
              <p className="mt-1 text-xs text-red-600 font-medium">{errors.fullName.message}</p>
            )}
          </div>

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

          {/* Số điện thoại */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Số Điện Thoại
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Phone size={18} />
              </div>
              <input
                type="tel"
                placeholder="0912345678"
                {...register('phone')}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>
          </div>

          {/* Mật khẩu */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Mật Khẩu (Tối thiểu 8 ký tự)
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

          {/* Nhập lại mật khẩu */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Xác Nhận Mật Khẩu
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input
                type="password"
                placeholder="••••••••"
                {...register('confirmPassword', {
                  required: 'Vui lòng xác nhận mật khẩu!',
                  validate: (value) =>
                    value === passwordValue || 'Mật khẩu xác nhận không trùng khớp!',
                })}
                className={`w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border ${
                  errors.confirmPassword ? 'border-red-500' : 'border-slate-200'
                } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all`}
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600 font-medium">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Nút Đăng ký */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md shadow-blue-500/20 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 transition-all mt-6"
          >
            <UserPlus size={18} />
            <span>{loading ? 'Đang tạo tài khoản...' : 'Đăng Ký Tài Khoản'}</span>
          </button>
        </form>

        {/* Footer chuyển sang đăng nhập */}
        <div className="text-center mt-6">
          <p className="text-sm text-slate-600">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
