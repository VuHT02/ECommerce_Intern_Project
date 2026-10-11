import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import {
  Mail,
  Lock,
  LogIn,
  AlertCircle,
  Eye,
  EyeOff,
  Laptop,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../services/authApi';

export default function LoginPage() {
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);

  const from = location.state?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const onSubmit = async (formData) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await authApi.login(formData);
      setAuth(response.data);
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Email hoặc mật khẩu không chính xác!');
    } finally {
      setLoading(false);
    }
  };

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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-slate-50/70">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden grid grid-cols-1 md:grid-cols-12">

        {/* ── CỘT TRÁI: BANNER THƯƠNG HIỆU & GIỚI THIỆU ── */}
        <div
          className="md:col-span-5 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden"
          style={{ background: 'linear-gradient(145deg, #1e3a8a 0%, #1e1b4b 60%, #0f172a 100%)' }}
        >
          {/* Vòng trang trí blur */}
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-blue-500/20 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />

          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-xl font-black text-white tracking-tight mb-8">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                <Laptop size={20} strokeWidth={2.5} />
              </div>
              <span>Tech<span className="text-blue-400">Zone</span></span>
            </Link>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold mb-4">
              <Sparkles size={13} />
              <span>Cửa hàng công nghệ tin cậy</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              Chào mừng bạn quay trở lại!
            </h2>
            <p className="text-slate-300 text-sm mt-3 leading-relaxed">
              Khám phá hàng nghìn thiết bị công nghệ đỉnh cao, theo dõi đơn hàng và tận hưởng những ưu đãi đặc quyền.
            </p>

            <div className="space-y-3.5 mt-8">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs sm:text-sm text-slate-200 font-medium">
                  Sản phẩm cam kết 100% chính hãng
                </span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs sm:text-sm text-slate-200 font-medium">
                  Miễn phí vận chuyển toàn quốc đơn từ 500k
                </span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs sm:text-sm text-slate-200 font-medium">
                  Đổi mới trong 30 ngày nếu phát sinh lỗi
                </span>
              </div>
            </div>
          </div>

          <div className="pt-8 mt-8 border-t border-slate-700/60 flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck size={16} className="text-blue-400" />
            <span>Đăng nhập an toàn với mã hóa SSL</span>
          </div>
        </div>

        {/* ── CỘT PHẢI: FORM ĐĂNG NHẬP ── */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Đăng nhập tài khoản
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Nhập email và mật khẩu của bạn để tiếp tục
            </p>

            {location.state?.from && (
              <div className="mt-3 text-xs bg-amber-50 text-amber-700 px-3.5 py-2 rounded-xl border border-amber-200">
                Vui lòng đăng nhập để tiếp tục truy cập trang này.
              </div>
            )}
          </div>

          {/* Alert lỗi */}
          {errorMessage && (
            <div className="mb-5 flex items-start gap-3 p-3.5 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              <AlertCircle size={17} className="shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label className="form-label">Địa chỉ Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  {...register('email', {
                    required: 'Vui lòng nhập email',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email không đúng định dạng',
                    },
                  })}
                  className={`form-input input-with-left-icon ${errors.email ? 'input-error' : ''}`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Mật khẩu */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="form-label mb-0">Mật khẩu</label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password', {
                    state: { email: watch('email') || '' },
                  })}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu của bạn"
                  autoComplete="current-password"
                  {...register('password', {
                    required: 'Vui lòng nhập mật khẩu',
                    minLength: { value: 6, message: 'Mật khẩu tối thiểu 6 ký tự' },
                  })}
                  className={`form-input input-with-left-icon input-with-right-icon ${
                    errors.password ? 'input-error' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Nút Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Đang đăng nhập...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={17} />
                    <span>Đăng Nhập</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Phân cách Google */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-slate-400 font-medium">
                Hoặc tiếp tục với
              </span>
            </div>
          </div>

          {/* Google Login */}
          <div className="flex justify-center w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setErrorMessage('Đăng nhập Google thất bại!')}
              shape="rectangular"
              text="signin_with"
              locale="vi"
              width="100%"
            />
          </div>

          {/* Chuyển sang Đăng ký */}
          <p className="text-center text-sm text-slate-500 mt-6">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="font-bold text-blue-600 hover:text-blue-700">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
