import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Truck,
  RotateCcw,
  Laptop,
  LoaderCircle,
  RotateCw,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { cartApi } from '../services/cartApi';
import { formatCurrency } from '../utils/format';

/**
 * Trang Giỏ Hàng (CartPage):
 * - Đọc dữ liệu từ Zustand store `useCartStore`
 * - Hiển thị danh sách sản phẩm, cho phép tăng/giảm số lượng & xóa món
 * - Tính tổng tiền động (Dynamic Total Price) kèm chính sách miễn phí vận chuyển
 * - Hiển thị Empty Cart State sinh động khi giỏ hàng trống
 */
export default function CartPage() {
  const user = useAuthStore((state) => state.user);
  const {
    items,
    ownerUserId,
    isReady,
    isLoading,
    loadError,
    beginUserSession,
    setUserCart,
    failUserCartLoad,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalPrice,
    getTotalItems,
  } = useCartStore();

  const cartBelongsToCurrentUser = user?.id != null
    && String(ownerUserId) === String(user.id);
  const cartIsReady = cartBelongsToCurrentUser && isReady;

  const retryCartLoad = async () => {
    if (!user?.id) return;
    beginUserSession(user.id);
    try {
      setUserCart(user.id, await cartApi.getCart(user.id));
    } catch (error) {
      failUserCartLoad(user.id, error);
    }
  };

  const runCartAction = async (action) => {
    try {
      await action();
    } catch (error) {
      toast.error(error?.message || 'Không thể cập nhật giỏ hàng. Vui lòng thử lại.');
    }
  };

  if (!cartIsReady) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center px-4 py-12 bg-slate-50/50">
        <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-xl">
          {loadError ? (
            <>
              <h1 className="text-xl font-extrabold text-slate-900">Không thể tải giỏ hàng</h1>
              <p className="mt-3 text-sm text-slate-500">{loadError}</p>
              <button type="button" onClick={retryCartLoad} className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700">
                <RotateCw size={16} /> Thử tải lại
              </button>
            </>
          ) : (
            <div className="flex items-center justify-center gap-3 text-sm font-semibold text-slate-600" role="status">
              <LoaderCircle className="animate-spin text-blue-600" size={22} />
              {isLoading ? 'Đang tải giỏ hàng của tài khoản...' : 'Đang đồng bộ giỏ hàng...'}
            </div>
          )}
        </div>
      </div>
    );
  }

  const totalItems = getTotalItems();
  const subtotal = getTotalPrice();

  // Chính sách vận chuyển: Đơn hàng từ 1.000.000đ được Free Ship
  const freeShipThreshold = 1000000;
  const isFreeShip = subtotal >= freeShipThreshold;
  const shippingFee = subtotal > 0 ? (isFreeShip ? 0 : 30000) : 0;
  const remainingForFreeShip = Math.max(0, freeShipThreshold - subtotal);
  const freeShipProgress = Math.min(100, Math.round((subtotal / freeShipThreshold) * 100));

  const finalTotal = subtotal + shippingFee;

  // 1. GIAO DIỆN KHI GIỎ HÀNG TRỐNG
  if (items.length === 0) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center py-16 px-4 bg-slate-50/50">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-100 shadow-xl p-8 sm:p-12 text-center">
          {/* Hình ảnh minh họa Empty Cart */}
          <div className="relative w-28 h-28 mx-auto mb-6 flex items-center justify-center">
            <div className="absolute inset-0 bg-blue-50 rounded-full animate-ping opacity-30" />
            <div className="w-24 h-24 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
              <ShoppingCart size={46} strokeWidth={1.8} />
            </div>
          </div>

          <h2 className="text-2xl font-black text-slate-900 mb-2">
            Giỏ Hàng Đang Trống
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed mb-8">
            Bạn chưa thêm sản phẩm công nghệ nào vào giỏ. Hãy dạo quanh cửa hàng để chọn cho mình thiết bị ưng ý nhé!
          </p>

          <Link
            to="/products"
            className="inline-flex items-center justify-center gap-2.5 w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <ShoppingBag size={18} />
            <span>Quay lại mua sắm</span>
          </Link>
        </div>
      </div>
    );
  }

  // 2. GIAO DIỆN KHI CÓ SẢN PHẨM TRONG GIỎ
  return (
    <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Tiêu đề & Nút xóa toàn bộ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Giỏ Hàng Của Bạn
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Bạn đang có <strong className="text-slate-800">{totalItems}</strong> sản phẩm trong giỏ hàng
            </p>
          </div>

          <button
            type="button"
            onClick={() => runCartAction(clearCart)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl transition-colors self-start sm:self-auto"
            title="Xóa tất cả mặt hàng khỏi giỏ"
          >
            <Trash2 size={14} />
            <span>Xóa toàn bộ giỏ hàng</span>
          </button>
        </div>

        {/* Thanh thông báo Ưu đãi Free Ship */}
        <div className="bg-white rounded-2xl border border-blue-100 p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-1.5 text-blue-700">
              <Truck size={16} />
              {isFreeShip ? (
                <span>Chúc mừng! Đơn hàng của bạn được <strong>Miễn phí giao hàng</strong> toàn quốc!</span>
              ) : (
                <span>Mua thêm <strong>{formatCurrency(remainingForFreeShip)}</strong> để nhận <strong>Freeship 0đ</strong>!</span>
              )}
            </span>
            <span className="text-slate-400 font-semibold">{freeShipProgress}%</span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${freeShipProgress}%` }}
            />
          </div>
        </div>

        {/* Layout 2 cột: Danh sách sản phẩm bên trái & Tóm tắt tổng tiền bên phải */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* CỘT TRÁI: DANH SÁCH MẶT HÀNG TRONG GIỎ (2 CỘT) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm divide-y divide-slate-100 overflow-hidden">
              {items.map((item) => {
                const maxStock = item.stockQuantity ?? 999;
                const itemTotal = Number(item.price) * item.quantity;

                return (
                  <div
                    key={item.id}
                    className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                  >
                    {/* Ảnh sản phẩm + Tên */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-20 h-20 bg-slate-50 rounded-2xl border border-slate-100 p-2 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Laptop size={32} className="text-slate-300" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        {item.brand && (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                            {item.brand}
                          </span>
                        )}
                        <Link
                          to={`/products/${item.id}`}
                          className="font-bold text-sm text-slate-800 hover:text-blue-600 transition-colors line-clamp-2 block leading-snug"
                        >
                          {item.name}
                        </Link>
                        <p className="text-xs font-semibold text-slate-400">
                          Đơn giá: <span className="text-slate-700">{formatCurrency(item.price)}</span>
                        </p>
                      </div>
                    </div>

                    {/* Bộ tăng/giảm số lượng + Thành tiền + Nút xóa */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {/* Bộ chọn số lượng */}
                      <div className="inline-flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => runCartAction(() => updateQuantity(item.id, item.quantity - 1))}
                          disabled={item.quantity <= 1}
                          className="p-2 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          title="Giảm số lượng"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-10 text-center text-xs font-bold text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => runCartAction(() => updateQuantity(item.id, item.quantity + 1))}
                          disabled={item.quantity >= maxStock}
                          className="p-2 text-slate-600 hover:bg-slate-200 disabled:opacity-40 transition-colors"
                          title="Tăng số lượng"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      {/* Thành tiền */}
                      <div className="text-right min-w-[100px]">
                        <span className="text-sm sm:text-base font-extrabold text-blue-600 block">
                          {formatCurrency(itemTotal)}
                        </span>
                      </div>

                      {/* Nút xóa mặt hàng */}
                      <button
                        type="button"
                        onClick={() => runCartAction(() => removeFromCart(item.id))}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Xóa mặt hàng này"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline pt-2"
            >
              <ArrowRight size={14} className="rotate-180" />
              <span>Tiếp tục chọn thêm sản phẩm khác</span>
            </Link>
          </div>

          {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG (ORDER SUMMARY) */}
          <div className="sticky top-24 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
              <h3 className="text-base font-extrabold text-slate-900 pb-3 border-b border-slate-100">
                Tóm Tắt Đơn Hàng
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Tổng tiền hàng ({totalItems} món):</span>
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
                  <div className="text-right">
                    <span className="text-xl sm:text-2xl font-black text-blue-600 block tracking-tight">
                      {formatCurrency(finalTotal)}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      (Đã bao gồm thuế VAT)
                    </span>
                  </div>
                </div>
              </div>

              {/* Nút tiến hành thanh toán */}
              <Link
                to="/checkout"
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Tiến hành thanh toán</span>
                <ArrowRight size={16} />
              </Link>

              {/* Các cam kết mua hàng */}
              <div className="space-y-2.5 pt-4 border-t border-slate-100 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={15} className="text-blue-600 flex-shrink-0" />
                  <span>Cam kết chính hãng 100%, bảo hành 24 tháng</span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw size={15} className="text-emerald-600 flex-shrink-0" />
                  <span>Đổi mới miễn phí trong 30 ngày nếu có lỗi</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck size={15} className="text-amber-600 flex-shrink-0" />
                  <span>Giao hàng hỏa tốc trong 2 giờ nội thành</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
