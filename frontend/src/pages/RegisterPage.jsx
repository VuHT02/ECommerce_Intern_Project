import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Phone,
  UserPlus,
  AlertCircle,
  Eye,
  EyeOff,
  Laptop,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { authApi } from '../services/authApi';

export default function RegisterPage() {
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const navigate = useNavigate();

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
      await authApi.register(formData);
      navigate('/login', {
        replace: true,
        state: { registrationSuccess: true, email: formData.email },
      });
    } catch (err) {
      setErrorMessage(err.message || 'Đăng ký tài khoản không thành công!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-slate-50/70">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden grid grid-cols-1 md:grid-cols-12">

        {/* ── CỘT TRÁI: BANNER THƯƠNG HIỆU & QUYỀN LỢI ── */}
        <div
          className="md:col-span-5 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden"
          style={{ background: 'linear-gradient(145deg, #1e3a8a 0%, #1e1b4b 60%, #0f172a 100%)' }}
        >
          {/* Vòng trang trí */}
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
              <span>Thành viên công nghệ</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              Gia nhập cộng đồng TechZone
            </h2>
            <p className="text-slate-300 text-sm mt-3 leading-relaxed">
              Tạo tài khoản để nhận ưu đãi thành viên, voucher mua sắm và quản lý đơn hàng thiết bị công nghệ dễ dàng.
            </p>

            {/* Danh sách lợi ích */}
            <div className="space-y-3.5 mt-8">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs sm:text-sm text-slate-200 font-medium">
                  Voucher 10% giảm giá đơn hàng công nghệ đầu tiên
                </span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs sm:text-sm text-slate-200 font-medium">
                  Bảo hành điện tử chính hãng và bảo dưỡng định kỳ
                </span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs sm:text-sm text-slate-200 font-medium">
                  Tích điểm thưởng nâng hạng VIP trọn đời
                </span>
              </div>
            </div>
          </div>

          <div className="pt-8 mt-8 border-t border-slate-700/60 flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck size={16} className="text-blue-400" />
            <span>Cam kết bảo mật dữ liệu tuyệt đối</span>
          </div>
        </div>

        {/* ── CỘT PHẢI: FORM ĐĂNG KÝ ── */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Tạo tài khoản mới
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Điền các thông tin bên dưới để hoàn tất đăng ký
            </p>
          </div>

          {/* Alert lỗi */}
          {errorMessage && (
            <div className="mb-5 flex items-start gap-3 p-3.5 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              <AlertCircle size={17} className="shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Họ và tên */}
            <div>
              <label className="form-label">Họ và tên</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn A"
                  autoComplete="name"
                  {...register('fullName', {
                    required: 'Vui lòng nhập họ và tên',
                    minLength: { value: 2, message: 'Họ tên tối thiểu 2 ký tự' },
                  })}
                  className={`form-input input-with-left-icon ${errors.fullName ? 'input-error' : ''}`}
                />
              </div>
              {errors.fullName && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{errors.fullName.message}</p>
              )}
            </div>

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

            {/* Số điện thoại */}
            <div>
              <label className="form-label">
                Số điện thoại <span className="text-slate-400 font-normal text-xs">(không bắt buộc)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone size={16} />
                </div>
                <input
                  type="tel"
                  placeholder="0912 345 678"
                  autoComplete="tel"
                  {...register('phone', {
                    pattern: {
                      value: /^[0-9]{9,11}$/,
                      message: 'Số điện thoại từ 9 đến 11 chữ số',
                    },
                  })}
                  className={`form-input input-with-left-icon ${errors.phone ? 'input-error' : ''}`}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{errors.phone.message}</p>
              )}
            </div>

            {/* Mật khẩu */}
            <div>
              <label className="form-label">Mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tối thiểu 6 ký tự"
                  autoComplete="new-password"
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

            {/* Xác nhận mật khẩu */}
            <div>
              <label className="form-label">Xác nhận mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Nhập lại mật khẩu"
                  autoComplete="new-password"
                  {...register('confirmPassword', {
                    required: 'Vui lòng xác nhận mật khẩu',
                    validate: (val) => val === passwordValue || 'Mật khẩu xác nhận không khớp',
                  })}
                  className={`form-input input-with-left-icon input-with-right-icon ${
                    errors.confirmPassword ? 'input-error' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{errors.confirmPassword.message}</p>
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
                    <span>Đang tạo tài khoản...</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={17} />
                    <span>Đăng Ký Tài Khoản</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Đã có tài khoản */}
          <p className="text-center text-sm text-slate-500 mt-6">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
