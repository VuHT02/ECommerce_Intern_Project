import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  MapPin,
  Phone,
  User,
  CreditCard,
  Truck,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  ShoppingBag,
  ArrowLeft,
  Laptop,
  QrCode,
  Tag,
} from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { orderApi } from '../services/orderApi';
import { paymentApi } from '../services/paymentApi';
import { formatCurrency } from '../utils/format';

/**
 * Trang Thanh Toán & Đặt Hàng (CheckoutPage):
 * - Dùng react-hook-form để validate: Tên bắt buộc, SĐT đúng định dạng, Địa chỉ bắt buộc
 * - Cổng thanh toán: COD (Khi nhận hàng) hoặc VNPAY Sandbox
 * - Trực quan hóa quá trình đặt hàng: Loading Spinner trên nút submit
 * - Popup thông báo thành công bằng `react-toastify` trước khi chuyển hướng về trang chủ
 */
export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    items,
    ownerUserId,
    isReady: cartIsReady,
    isLoading: cartIsLoading,
    loadError: cartLoadError,
    getTotalPrice,
    clearCart,
  } = useCartStore();
  const cartBelongsToCurrentUser = user?.id != null
    && String(ownerUserId) === String(user.id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('COD');

  // Khởi tạo react-hook-form với giá trị mặc định từ tài khoản người dùng
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      recipientName: user?.fullName || '',
      recipientPhone: '',
      shippingAddress: '',
      voucherCode: '',
      notes: '',
    },
  });

  const subtotal = getTotalPrice();
  const shippingFee = subtotal >= 1000000 ? 0 : 30000;
  const finalTotal = subtotal + shippingFee;

  // Xử lý gửi đơn hàng (Gọi API POST lên Spring Boot)
  const onSubmit = async (formData) => {
    if (!cartBelongsToCurrentUser || !cartIsReady) {
      toast.error('Giỏ hàng chưa được đồng bộ với tài khoản. Vui lòng tải lại trang giỏ hàng.');
      return;
    }

    if (items.length === 0) {
      toast.warning('Giỏ hàng của bạn đang trống! Vui lòng chọn sản phẩm trước.');
      return;
    }

    try {
      setIsSubmitting(true);

      // Giỏ hàng đã được lưu trên server theo tài khoản sau từng thao tác.
      // Không xóa và chép lại giỏ tại đây vì có thể ghi đè dữ liệu giỏ của user.
      const orderPayload = {
        userId: user?.id,
        recipientName: formData.recipientName.trim(),
        recipientPhone: formData.recipientPhone.trim(),
        shippingAddress: formData.shippingAddress.trim(),
        voucherCode: formData.voucherCode?.trim() || null,
        paymentMethod: selectedPayment,
      };

      if (selectedPayment === 'VNPAY') {
        const payment = await paymentApi.createVnPayCheckout(orderPayload);
        if (!payment?.paymentUrl) {
          throw new Error('Máy chủ chưa tạo được liên kết thanh toán VNPAY.');
        }
        // Keep the local cart until the signed VNPAY return confirms payment.
        window.location.assign(payment.paymentUrl);
        return;
      }

      const createdOrder = await orderApi.createOrder(orderPayload);
      await clearCart();

      // 4. Hiển thị popup thông báo thành công qua react-toastify
      toast.success(
        `🎉 Đặt hàng thành công! Mã đơn: ${createdOrder?.orderNumber || 'ORD-' + Date.now()}`,
        {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );

      // 5. Chuyển hướng về trang chủ sau khi popup hiển thị
      setTimeout(() => {
        navigate('/orders');
      }, 2000);
    } catch (err) {
      toast.error(
        err?.message || 'Có lỗi xảy ra khi tạo đơn hàng. Vui lòng kiểm tra lại!',
        { position: 'top-right', autoClose: 4000 }
      );
      setIsSubmitting(false);
    }
  };

  if (!cartBelongsToCurrentUser || !cartIsReady) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center px-4 py-12 bg-slate-50/50">
        <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-xl">
          {cartLoadError ? (
            <>
              <h2 className="text-xl font-extrabold text-slate-900">Không thể tải giỏ hàng</h2>
              <p className="mt-3 text-sm text-slate-500">{cartLoadError}</p>
              <Link to="/cart" className="mt-6 inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700">
                Mở giỏ hàng để thử lại
              </Link>
            </>
          ) : (
            <div className="flex items-center justify-center gap-3 text-sm font-semibold text-slate-600" role="status">
              <Loader2 className="animate-spin text-blue-600" size={22} />
              {cartIsLoading ? 'Đang tải giỏ hàng của tài khoản...' : 'Đang đồng bộ giỏ hàng...'}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Nếu giỏ hàng trống, hướng dẫn quay lại
  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-16 px-4 bg-slate-50/50">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-100 shadow-xl p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 mx-auto flex items-center justify-center">
            <ShoppingBag size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Chưa có sản phẩm để thanh toán</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Giỏ hàng của bạn đang trống. Vui lòng quay lại chọn sản phẩm trước khi vào trang thanh toán.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20"
          >
            <ArrowLeft size={15} />
            <span>Xem danh sách sản phẩm</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header trang */}
        <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Thanh Toán Đơn Hàng
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Vui lòng điền thông tin người nhận và chọn phương thức thanh toán phù hợp
            </p>
          </div>
          <Link
            to="/cart"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 self-start sm:self-auto"
          >
            <ArrowLeft size={14} />
            <span>Quay lại giỏ hàng</span>
          </Link>
        </div>

        {/* Layout 2 cột: Form giao hàng bên trái & Tóm tắt đơn hàng bên phải */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* CỘT TRÁI (2 CỘT): FORM THÔNG TIN GIAO HÀNG & PHƯƠNG THỨC THANH TOÁN */}
            <div className="lg:col-span-2 space-y-6">
              {/* 1. THÔNG TIN NGƯỜI NHẬN */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Thông Tin Nhận Hàng
                    </h3>
                    <p className="text-xs text-slate-400">
                      Địa chỉ nhận máy tính, điện thoại chính hãng
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Họ và tên */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <User size={13} className="text-slate-400" />
                      Họ và tên người nhận <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Nguyễn Văn A"
                      className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                        errors.recipientName
                          ? 'border-rose-400 focus:ring-rose-400'
                          : 'border-slate-200 focus:ring-blue-500'
                      }`}
                      {...register('recipientName', {
                        required: 'Họ và tên người nhận là bắt buộc!',
                        minLength: {
                          value: 2,
                          message: 'Tên người nhận phải từ 2 ký tự trở lên',
                        },
                      })}
                    />
                    {errors.recipientName && (
                      <p className="text-[11px] font-semibold text-rose-500">
                        {errors.recipientName.message}
                      </p>
                    )}
                  </div>

                  {/* Số điện thoại */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Phone size={13} className="text-slate-400" />
                      Số điện thoại liên hệ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="Ví dụ: 0912345678"
                      className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                        errors.recipientPhone
                          ? 'border-rose-400 focus:ring-rose-400'
                          : 'border-slate-200 focus:ring-blue-500'
                      }`}
                      {...register('recipientPhone', {
                        required: 'Số điện thoại nhận hàng là bắt buộc!',
                        pattern: {
                          value: /^(0|\+84)[3|5|7|8|9][0-9]{8}$/,
                          message: 'Số điện thoại không hợp lệ (10 chữ số, đầu số VN: 03, 05, 07, 08, 09)',
                        },
                      })}
                    />
                    {errors.recipientPhone && (
                      <p className="text-[11px] font-semibold text-rose-500">
                        {errors.recipientPhone.message}
                      </p>
                    )}
                  </div>

                  {/* Địa chỉ giao hàng chi tiết */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <MapPin size={13} className="text-slate-400" />
                      Địa chỉ nhận hàng chi tiết <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Số nhà, tên đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố..."
                      className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                        errors.shippingAddress
                          ? 'border-rose-400 focus:ring-rose-400'
                          : 'border-slate-200 focus:ring-blue-500'
                      }`}
                      {...register('shippingAddress', {
                        required: 'Địa chỉ nhận hàng là bắt buộc!',
                        minLength: {
                          value: 6,
                          message: 'Địa chỉ nhận hàng cần chi tiết hơn (tối thiểu 6 ký tự)',
                        },
                      })}
                    />
                    {errors.shippingAddress && (
                      <p className="text-[11px] font-semibold text-rose-500">
                        {errors.shippingAddress.message}
                      </p>
                    )}
                  </div>

                  {/* Mã giảm giá Voucher */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Tag size={13} className="text-slate-400" />
                      Mã Voucher giảm giá (nếu có)
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: TECHZONE2026"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                      {...register('voucherCode')}
                    />
                  </div>

                  {/* Ghi chú đơn hàng */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Ghi chú đơn hàng
                    </label>
                    <input
                      type="text"
                      placeholder="Giao giờ hành chính, gọi trước khi đến..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      {...register('notes')}
                    />
                  </div>
                </div>
              </div>

              {/* 2. CHỌN PHƯƠNG THỨC THANH TOÁN */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Phương Thức Thanh Toán
                    </h3>
                    <p className="text-xs text-slate-400">
                      Lựa chọn hình thức thanh toán thuận tiện nhất cho bạn
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* COD */}
                  <label
                    className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedPayment === 'COD'
                        ? 'border-blue-600 bg-blue-50/40 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="COD"
                      checked={selectedPayment === 'COD'}
                      onChange={() => setSelectedPayment('COD')}
                      className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <strong className="text-xs sm:text-sm font-bold text-slate-900 block flex items-center gap-1.5">
                        <Truck size={15} className="text-blue-600" />
                        Thanh toán khi nhận hàng (COD)
                      </strong>
                      <span className="text-[11px] text-slate-500 mt-0.5 block leading-relaxed">
                        Kiểm tra hàng trước khi thanh toán tiền mặt cho shipper.
                      </span>
                    </div>
                  </label>

                  {/* VNPAY */}
                  <label
                    className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedPayment === 'VNPAY'
                        ? 'border-blue-600 bg-blue-50/40 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="VNPAY"
                      checked={selectedPayment === 'VNPAY'}
                      onChange={() => setSelectedPayment('VNPAY')}
                      className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <strong className="text-xs sm:text-sm font-bold text-slate-900 block flex items-center gap-1.5">
                        <QrCode size={15} className="text-emerald-600" />
                        VNPAY (Quét mã QR / Thẻ ATM)
                      </strong>
                      <span className="text-[11px] text-slate-500 mt-0.5 block leading-relaxed">
                        Cổng thanh toán điện tử VNPAY Sandbox bảo mật chuẩn quốc tế.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* CỘT PHẢI (1 CỘT): TÓM TẮT ĐƠN HÀNG & NÚT ĐẶT HÀNG */}
            <div className="sticky top-24 space-y-4">
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base font-extrabold text-slate-900">
                    Đơn Hàng ({items.length} món)
                  </h3>
                  <Link
                    to="/cart"
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    Sửa
                  </Link>
                </div>

                {/* Danh sách sản phẩm thu nhỏ */}
                <div className="max-h-60 overflow-y-auto space-y-3 pr-1 divide-y divide-slate-100">
                  {items.map((item) => (
                    <div key={item.id} className="pt-2 first:pt-0 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 p-1 flex-shrink-0 flex items-center justify-center">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Laptop size={18} className="text-slate-300" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 truncate" title={item.name}>
                          {item.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          SL: <strong className="text-slate-700">{item.quantity}</strong> x {formatCurrency(item.price)}
                        </p>
                      </div>
                      <span className="text-xs font-extrabold text-slate-900 flex-shrink-0">
                        {formatCurrency(Number(item.price) * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Chi tiết chi phí */}
                <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Tạm tính:</span>
                    <span className="font-bold text-slate-800">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Phí vận chuyển:</span>
                    <span className="font-bold">
                      {shippingFee === 0 ? (
                        <span className="text-emerald-600 uppercase text-[11px]">Miễn phí</span>
                      ) : (
                        formatCurrency(shippingFee)
                      )}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                    <span className="text-sm font-extrabold text-slate-900">Tổng thanh toán:</span>
                    <span className="text-xl sm:text-2xl font-black text-blue-600">
                      {formatCurrency(finalTotal)}
                    </span>
                  </div>
                </div>

                {/* NÚT ĐẶT HÀNG KÈM LOADING SPINNER */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-4 px-6 rounded-2xl text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/25 ${
                    isSubmitting
                      ? 'bg-blue-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>{selectedPayment === 'VNPAY' ? 'Đang chuyển đến VNPAY...' : 'Đang xử lý đơn hàng...'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      <span>{selectedPayment === 'VNPAY' ? 'Thanh toán qua VNPAY' : `Đặt hàng ngay (${formatCurrency(finalTotal)})`}</span>
                    </>
                  )}
                </button>

                {/* Cam kết bảo mật */}
                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-2">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>Giao dịch an toàn & bảo mật thông tin 100%</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
