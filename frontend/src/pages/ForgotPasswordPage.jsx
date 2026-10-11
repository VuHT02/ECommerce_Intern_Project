import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Laptop,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { authApi } from '../services/authApi';

const initialEmail = (locationState) =>
  typeof locationState?.email === 'string' ? locationState.email : '';

export default function ForgotPasswordPage() {
  const location = useLocation();
  const [email, setEmail] = useState(() => initialEmail(location.state));
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState('email');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (resendSeconds <= 0) return undefined;
    const timer = window.setTimeout(() => setResendSeconds((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  const handleRequestOtp = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setNotice('');
    setLoading(true);

    try {
      const response = await authApi.forgotPassword(email.trim());
      setEmail(email.trim());
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setStep('reset');
      setResendSeconds(60);
      setNotice(response?.message || 'Mã OTP đã được gửi đến email của bạn.');
    } catch (error) {
      setErrorMessage(error.message || 'Không thể gửi mã OTP. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setNotice('');

    if (otp.length !== 6) {
      setErrorMessage('Vui lòng nhập đủ 6 chữ số OTP.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (new TextEncoder().encode(newPassword).length > 72) {
      setErrorMessage('Mật khẩu mới vượt quá giới hạn hỗ trợ.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận chưa khớp.');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.resetPassword({
        email,
        otp,
        newPassword,
      });
      setStep('complete');
      setNotice(response?.message || 'Đặt lại mật khẩu thành công.');
    } catch (error) {
      setErrorMessage(error.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setErrorMessage('');
    setNotice('');
    setLoading(true);
    try {
      const response = await authApi.forgotPassword(email);
      setOtp('');
      setResendSeconds(60);
      setNotice(response?.message || 'Mã OTP mới đã được gửi.');
    } catch (error) {
      setErrorMessage(error.message || 'Không thể gửi lại mã OTP.');
    } finally {
      setLoading(false);
    }
  };

  const titles = {
    email: {
      title: 'Quên mật khẩu?',
      description: 'Nhập email tài khoản LOCAL để nhận mã xác minh đặt lại mật khẩu.',
    },
    reset: {
      title: 'Xác minh và tạo mật khẩu mới',
      description: `Nhập mã OTP được gửi đến ${email}. Mã có hiệu lực trong 15 phút.`,
    },
    complete: {
      title: 'Đã đổi mật khẩu',
      description: 'Mật khẩu mới đã được lưu. Bạn có thể đăng nhập bằng mật khẩu vừa tạo.',
    },
  }[step];
  const activeStep = step === 'email' ? 0 : step === 'reset' ? 1 : 2;
  const progressSteps = ['Email', 'Xác minh OTP', 'Hoàn tất'];

  return (
    <main className="forgot-password-page flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-100/80 px-4 py-8 sm:px-6 lg:px-8">
      <div className="forgot-password-shell grid w-full overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10 md:grid-cols-12">
        <aside className="forgot-password-brand-panel relative flex flex-col justify-between overflow-hidden bg-[#101a36] p-7 text-white sm:p-9 md:col-span-5 md:p-10">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="relative">
            <Link to="/" className="inline-flex items-center gap-2.5 text-xl font-black tracking-tight text-white">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-950/30">
                <Laptop size={21} strokeWidth={2.5} />
              </span>
              <span>Tech<span className="text-blue-400">Zone</span></span>
            </Link>

            <div className="mt-12 inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-xs font-semibold text-blue-200">
              <ShieldCheck size={14} />
              Hỗ trợ tài khoản an toàn
            </div>
            <h2 className="mt-5 max-w-sm text-3xl font-extrabold leading-tight tracking-tight sm:text-[2.1rem]">
              Lấy lại quyền truy cập của bạn
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-300">
              Chỉ mất vài bước để tạo mật khẩu mới và tiếp tục mua sắm tại TechZone.
            </p>

            <div className="mt-9 space-y-5">
              {[
                ['01', 'Xác nhận email', 'Nhận mã bảo mật gửi đến hộp thư của bạn.'],
                ['02', 'Nhập mã OTP', 'Mã gồm 6 chữ số, chỉ sử dụng một lần.'],
                ['03', 'Tạo mật khẩu mới', 'Đăng nhập lại bằng thông tin vừa cập nhật.'],
              ].map(([number, title, description], index) => {
                const complete = index < activeStep;
                const active = index === activeStep;
                return (
                  <div key={number} className="flex items-start gap-3.5">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-xs font-bold transition ${
                      complete
                        ? 'border-emerald-300/30 bg-emerald-400/15 text-emerald-300'
                        : active
                          ? 'border-blue-300/40 bg-blue-500 text-white shadow-lg shadow-blue-950/40'
                          : 'border-white/10 bg-white/5 text-slate-400'
                    }`}>
                      {complete ? <CheckCircle2 size={17} /> : number}
                    </span>
                    <div className="pt-0.5">
                      <p className={`text-sm font-bold ${active || complete ? 'text-white' : 'text-slate-400'}`}>{title}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative mt-9 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-300/10 text-amber-300">
                <KeyRound size={16} />
              </span>
              <p className="text-xs leading-5 text-slate-300">
                Mã OTP có hiệu lực 15 phút. Không chia sẻ mã này với bất kỳ ai.
                {' '}
                <span className="text-white">Tài khoản Google?</span> Hãy đăng nhập bằng Google.
              </p>
            </div>
          </div>
        </aside>

        <section className="forgot-password-form-panel flex flex-col justify-center p-6 sm:p-10 md:col-span-7 md:p-12">
          <Link
            to="/login"
            className="mb-8 inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft size={16} />
            Quay lại đăng nhập
          </Link>

          <div className="mb-8">
            <div className="mb-5 flex items-center gap-2.5">
              {progressSteps.map((label, index) => (
                <div key={label} className="flex min-w-0 flex-1 items-center gap-2">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    index < activeStep
                      ? 'bg-emerald-500 text-white'
                      : index === activeStep
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                        : 'bg-slate-100 text-slate-400'
                  }`}>
                    {index < activeStep ? <CheckCircle2 size={15} /> : index + 1}
                  </span>
                  <span className={`truncate text-[11px] font-semibold sm:text-xs ${
                    index === activeStep ? 'text-slate-800' : 'text-slate-400'
                  }`}>{label}</span>
                  {index < progressSteps.length - 1 && (
                    <span className={`h-px min-w-2 flex-1 ${index < activeStep ? 'bg-emerald-300' : 'bg-slate-200'}`} />
                  )}
                </div>
              ))}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.75rem]">{titles.title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">{titles.description}</p>
          </div>

          {errorMessage && (
            <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {notice && (
            <div role="status" className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800">
              <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
              <span>{notice}</span>
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <div>
                <label htmlFor="reset-email" className="mb-2 block text-sm font-semibold text-slate-700">
                  Email tài khoản
                </label>
                <div className="relative">
                  <Mail size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={320}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-blue-600/30 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <LoaderCircle size={17} className="animate-spin" /> : <Mail size={17} />}
                {loading ? 'Đang gửi mã...' : 'Gửi mã xác minh'}
              </button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label htmlFor="reset-otp" className="mb-2 block text-sm font-semibold text-slate-700">
                  Mã OTP 6 chữ số
                </label>
                <input
                  id="reset-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3.5 text-center font-mono text-xl tracking-[0.6em] text-slate-900 outline-none transition placeholder:text-slate-300 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label htmlFor="new-password" className="mb-2 block text-sm font-semibold text-slate-700">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <LockKeyhole size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    maxLength={72}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="Ít nhất 6 ký tự"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3.5 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className="mb-2 block text-sm font-semibold text-slate-700">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  maxLength={72}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-blue-600/30 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <LoaderCircle size={17} className="animate-spin" /> : <ShieldCheck size={17} />}
                {loading ? 'Đang cập nhật...' : 'Lưu mật khẩu mới'}
              </button>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setOtp('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setErrorMessage('');
                    setNotice('');
                  }}
                  className="font-semibold text-slate-500 transition hover:text-blue-600"
                >
                  Đổi email
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading || resendSeconds > 0}
                  className="font-semibold text-blue-600 transition hover:text-blue-700 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  {resendSeconds > 0 ? `Gửi lại mã sau ${resendSeconds}s` : 'Gửi lại mã OTP'}
                </button>
              </div>
            </form>
          )}

          {step === 'complete' && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 size={21} />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">Mật khẩu đã được cập nhật</p>
                  <p className="mt-0.5 text-xs text-slate-500">Các phiên đăng nhập cũ đã được đăng xuất.</p>
                </div>
              </div>
              <Link
                to="/login"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700"
              >
                <LockKeyhole size={17} />
                Đăng nhập bằng mật khẩu mới
              </Link>
            </div>
          )}

          <p className="mt-7 text-center text-xs text-slate-400">
            Cần hỗ trợ thêm?{' '}
            <Link to="/login" className="font-semibold text-slate-600 transition hover:text-blue-600">Liên hệ đăng nhập</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
