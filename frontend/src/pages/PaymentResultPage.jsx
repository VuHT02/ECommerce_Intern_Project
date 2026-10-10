import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, LoaderCircle, RotateCw, ShieldCheck } from 'lucide-react';
import { paymentApi } from '../services/paymentApi';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { formatCurrency } from '../utils/format';

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState({ status: 'loading', order: null, message: '' });
  const refreshUserCart = useCartStore((store) => store.refreshUserCart);
  const userId = useAuthStore((store) => store.user?.id);
  const queryString = searchParams.toString();

  useEffect(() => {
    let active = true;

    const verifyPayment = async () => {
      if (!queryString || !searchParams.get('vnp_SecureHash')) {
        setState({ status: 'error', order: null, message: 'Thiếu dữ liệu xác minh từ VNPAY.' });
        return;
      }

      setState({ status: 'loading', order: null, message: '' });
      try {
        const order = await paymentApi.verifyVnPayReturn(queryString);
        if (!active) return;

        if (order?.paymentStatus === 'PAID') {
          // The backend removes the purchased quantities after verifying payment.
          // Reload so items added in another tab during payment remain visible.
          if (userId != null) await refreshUserCart(userId).catch(() => {});
          setState({ status: 'success', order, message: '' });
        } else {
          setState({
            status: 'failed',
            order,
            message: 'Giao dịch chưa hoàn tất. Đơn hàng chưa được xác nhận thanh toán.',
          });
        }
      } catch (error) {
        if (!active) return;
        setState({
          status: 'error',
          order: null,
          message: error?.message || 'Không thể xác minh kết quả thanh toán. Vui lòng tải lại trang.',
        });
      }
    };

    verifyPayment();
    return () => { active = false; };
  }, [queryString, searchParams, refreshUserCart, userId]);

  const isSuccess = state.status === 'success';
  const isLoading = state.status === 'loading';

  return (
    <section className="min-h-[65vh] bg-slate-50 px-4 py-14 flex items-center justify-center">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
        <div className={`h-2 ${isSuccess ? 'bg-emerald-500' : state.status === 'failed' || state.status === 'error' ? 'bg-rose-500' : 'bg-blue-500'}`} />
        <div className="px-6 py-10 text-center sm:px-10">
          <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${isSuccess ? 'bg-emerald-100 text-emerald-600' : state.status === 'failed' || state.status === 'error' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
            {isLoading ? <LoaderCircle className="animate-spin" size={32} /> : isSuccess ? <CheckCircle2 size={34} /> : <AlertCircle size={32} />}
          </div>

          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Thanh toán VNPAY</p>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {isLoading ? 'Đang xác minh giao dịch' : isSuccess ? 'Thanh toán thành công' : state.status === 'failed' ? 'Giao dịch chưa thành công' : 'Chưa xác minh được giao dịch'}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
            {isLoading ? 'Đang kiểm tra chữ ký và trạng thái đơn hàng với máy chủ.' : isSuccess ? 'VNPAY đã xác nhận thanh toán. Đơn hàng của bạn đang được xử lý.' : state.message}
          </p>

          {state.order && (
            <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left">
              <div className="flex justify-between gap-4 border-b border-slate-200 pb-3 text-sm">
                <span className="text-slate-500">Mã đơn hàng</span>
                <strong className="text-right text-slate-800">{state.order.orderNumber}</strong>
              </div>
              <div className="flex justify-between gap-4 pt-3 text-sm">
                <span className="text-slate-500">Tổng thanh toán</span>
                <strong className="text-blue-700">{formatCurrency(state.order.totalAmount)}</strong>
              </div>
            </div>
          )}

          {isSuccess && (
            <div className="mt-5 flex items-center justify-center gap-2 text-xs font-medium text-emerald-700">
              <ShieldCheck size={15} /> Kết quả đã được máy chủ xác minh
            </div>
          )}

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {state.status === 'error' && (
              <button onClick={() => window.location.reload()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700">
                <RotateCw size={16} /> Thử xác minh lại
              </button>
            )}
            <Link to={isSuccess ? '/orders' : '/cart'} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700">
              {isSuccess ? 'Xem đơn hàng' : <><ArrowLeft size={16} /> Quay lại giỏ hàng</>}
            </Link>
            {!isSuccess && <Link to="/products" className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Tiếp tục mua sắm</Link>}
          </div>
        </div>
      </div>
    </section>
  );
}
