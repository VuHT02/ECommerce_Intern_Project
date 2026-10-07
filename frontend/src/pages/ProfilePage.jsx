import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  User,
  Mail,
  Shield,
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Eye,
  X,
  CreditCard,
  MapPin,
  Phone,
  FileText,
  Printer,
  Package,
  Calendar,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { orderApi } from '../services/orderApi';
import { formatCurrency, formatDate } from '../utils/format';

/**
 * Helper hàm render Badge màu sắc thể hiện trạng thái đơn hàng:
 * - PENDING: Vàng (Amber)
 * - CONFIRMED: Xanh dương (Blue)
 * - SHIPPING: Tím (Purple)
 * - PAID / DELIVERED: Xanh lá (Emerald)
 * - CANCELLED: Đỏ (Rose)
 */
const renderStatusBadge = (status) => {
  const upper = (status || 'PENDING').toUpperCase();

  switch (upper) {
    case 'PENDING':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock size={13} className="text-amber-500" />
          <span>Chờ xử lý (PENDING)</span>
        </span>
      );
    case 'CONFIRMED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <CheckCircle2 size={13} className="text-blue-500" />
          <span>Đã xác nhận</span>
        </span>
      );
    case 'SHIPPING':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
          <Truck size={13} className="text-purple-500" />
          <span>Đang giao hàng</span>
        </span>
      );
    case 'PAID':
    case 'DELIVERED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={13} className="text-emerald-500" />
          <span>Đã thanh toán (PAID)</span>
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle size={13} className="text-rose-500" />
          <span>Đã hủy (CANCELLED)</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
          {status}
        </span>
      );
  }
};

/**
 * Trang Quản Lý Tài Khoản & Lịch Sử Đơn Hàng (ProfilePage):
 * - Thông tin cá nhân cơ bản của User
 * - Bảng danh sách đơn hàng đã đặt kèm Badge trạng thái chuẩn Tailwind
 * - Xem hóa đơn chi tiết từng đơn hàng thông qua Modal
 */
export default function ProfilePage() {
  const { user } = useAuthStore();
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Fetch lịch sử đơn hàng từ Backend qua TanStack Query
  const {
    data: ordersData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['userOrders', user?.id],
    queryFn: () => orderApi.getUserOrders(user?.id),
    enabled: !!user?.id,
  });

  const orders = ordersData?.content || (Array.isArray(ordersData) ? ordersData : []);

  // Tính tổng chi tiêu
  const totalSpent = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* TIÊU ĐỀ TRANG */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Tài Khoản & Lịch Sử Đơn Hàng
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Quản lý thông tin cá nhân và tra cứu hóa đơn các đơn hàng đã đặt
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
          >
            <ShoppingBag size={15} />
            <span>Tiếp tục mua sắm</span>
          </Link>
        </div>

        {/* 1. KHỐI THÔNG TIN CÁ NHÂN CƠ BẢN CỦA USER */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Avatar & Thông tin tên, email */}
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-black text-2xl sm:text-3xl shadow-lg shadow-blue-500/25 flex-shrink-0">
                {(user?.fullName || user?.email || 'U')[0].toUpperCase()}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">
                    {user?.fullName || 'Khách hàng TechZone'}
                  </h2>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    <Shield size={11} />
                    {user?.role === 'ROLE_ADMIN' ? 'Quản trị viên' : 'Thành viên'}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5">
                  <Mail size={14} className="text-slate-400" />
                  <span>{user?.email || 'Chưa cập nhật email'}</span>
                </p>

                <p className="text-[11px] text-slate-400">
                  Mã tài khoản: <strong className="text-slate-600 font-mono">#{user?.id || '---'}</strong>
                </p>
              </div>
            </div>

            {/* Thống kê nhanh */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full md:w-auto">
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 text-center">
                <span className="text-[11px] text-slate-400 font-medium block">Tổng đơn hàng</span>
                <span className="text-lg font-extrabold text-slate-900 mt-0.5 block">
                  {orders.length}
                </span>
              </div>
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 text-center">
                <span className="text-[11px] text-slate-400 font-medium block">Tổng chi tiêu</span>
                <span className="text-sm sm:text-base font-extrabold text-blue-600 mt-0.5 block truncate">
                  {formatCurrency(totalSpent)}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1 bg-slate-50 rounded-2xl p-3.5 border border-slate-100 text-center flex flex-col justify-center items-center">
                <span className="text-[11px] text-slate-400 font-medium block">Trạng thái</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 mt-0.5">
                  <Sparkles size={12} /> Đã kích hoạt
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. BẢNG (TABLE) LIỆT KÊ CÁC ĐƠN HÀNG USER ĐÃ ĐẶT */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden space-y-4">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Package size={18} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Lịch Sử Đơn Hàng</h3>
                <p className="text-xs text-slate-400">Danh sách các đơn đặt hàng đã thực hiện</p>
              </div>
            </div>

            <button
              onClick={() => refetch()}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
              title="Tải lại đơn hàng"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {/* Trạng thái Loading */}
          {isLoading && (
            <div className="p-8 space-y-4 animate-pulse">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-14 bg-slate-100 rounded-xl" />
              ))}
            </div>
          )}

          {/* Trạng thái Lỗi */}
          {isError && (
            <div className="p-8 text-center text-rose-600 text-sm">
              Không thể tải lịch sử đơn hàng: {error?.message || 'Lỗi kết nối máy chủ.'}
            </div>
          )}

          {/* Trạng thái Trống (Empty State) */}
          {!isLoading && !isError && orders.length === 0 && (
            <div className="py-16 px-4 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
                <ShoppingBag size={28} />
              </div>
              <h4 className="text-base font-bold text-slate-800 mb-1">
                Bạn chưa có đơn đặt hàng nào
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mb-6">
                Các sản phẩm công nghệ đang chờ bạn! Hãy dạo quanh cửa hàng và chọn cho mình sản phẩm ưng ý.
              </p>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all"
              >
                <span>Khám phá sản phẩm</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          )}

          {/* Bảng Dữ Liệu Đơn Hàng */}
          {!isLoading && !isError && orders.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-y border-slate-100 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-6">Mã đơn hàng</th>
                    <th className="py-3.5 px-4">Ngày đặt</th>
                    <th className="py-3.5 px-4">Sản phẩm</th>
                    <th className="py-3.5 px-4">Tổng tiền</th>
                    <th className="py-3.5 px-4">Thanh toán</th>
                    <th className="py-3.5 px-4">Trạng thái</th>
                    <th className="py-3.5 px-6 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {orders.map((order) => {
                    const firstItem = order.items?.[0];
                    const otherItemsCount = (order.items?.length || 1) - 1;

                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-slate-50/70 transition-colors group"
                      >
                        {/* Mã đơn */}
                        <td className="py-4 px-6 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {order.orderNumber || `#ORD-${order.id}`}
                        </td>

                        {/* Ngày đặt */}
                        <td className="py-4 px-4 whitespace-nowrap text-slate-500">
                          {formatDate(order.createdAt)}
                        </td>

                        {/* Tóm tắt sản phẩm */}
                        <td className="py-4 px-4 max-w-xs">
                          {firstItem ? (
                            <div className="truncate">
                              <span className="font-semibold text-slate-800">
                                {firstItem.productName}
                              </span>
                              {otherItemsCount > 0 && (
                                <span className="text-[11px] text-blue-600 font-bold ml-1">
                                  +{otherItemsCount} sản phẩm khác
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">Đơn hàng công nghệ</span>
                          )}
                        </td>

                        {/* Tổng tiền */}
                        <td className="py-4 px-4 font-black text-blue-600 whitespace-nowrap">
                          {formatCurrency(order.totalAmount)}
                        </td>

                        {/* Phương thức thanh toán */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 font-semibold text-[11px] text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                            <CreditCard size={12} className="text-slate-400" />
                            {order.paymentMethod || 'COD'}
                          </span>
                        </td>

                        {/* Badge trạng thái */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {renderStatusBadge(order.status)}
                        </td>

                        {/* Nút Xem chi tiết hóa đơn */}
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white font-bold text-xs transition-all shadow-sm"
                            title="Xem chi tiết hóa đơn"
                          >
                            <Eye size={13} />
                            <span>Xem chi tiết</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 3. MODAL XEM CHI TIẾT HÓA ĐƠN ĐƠN HÀNG */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
              onClick={() => setSelectedOrder(null)}
            />

            {/* Modal Dialog */}
            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Chi Tiết Hóa Đơn Đơn Hàng
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      Mã: {selectedOrder.orderNumber || `#${selectedOrder.id}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                    title="In hóa đơn"
                  >
                    <Printer size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                    title="Đóng"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 text-xs">
                {/* Trạng thái & Ngày đặt */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium">Trạng thái:</span>
                    {renderStatusBadge(selectedOrder.status)}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Calendar size={13} className="text-slate-400" />
                    <span>Thời gian đặt: <strong>{formatDate(selectedOrder.createdAt)}</strong></span>
                  </div>
                </div>

                {/* Thông tin giao hàng */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <MapPin size={13} className="text-blue-600" />
                    Thông tin giao hàng
                  </h4>
                  <div className="p-4 rounded-2xl border border-slate-100 bg-white grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Người nhận</span>
                      <strong className="text-slate-800 text-xs">
                        {selectedOrder.recipientName || user?.fullName || 'Khách hàng'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Số điện thoại</span>
                      <span className="text-slate-800 font-semibold flex items-center gap-1">
                        <Phone size={11} className="text-slate-400" />
                        {selectedOrder.recipientPhone || 'Chưa cập nhật'}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 block text-[10px]">Địa chỉ giao hàng</span>
                      <span className="text-slate-800 font-medium">
                        {selectedOrder.shippingAddress || 'Địa chỉ giao hàng tiêu chuẩn'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Danh sách mặt hàng trong đơn */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Package size={13} className="text-blue-600" />
                    Danh sách sản phẩm ({selectedOrder.items?.length || 0})
                  </h4>

                  <div className="rounded-2xl border border-slate-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100">
                          <th className="py-2.5 px-4">Tên sản phẩm</th>
                          <th className="py-2.5 px-3 text-center">SL</th>
                          <th className="py-2.5 px-4 text-right">Đơn giá</th>
                          <th className="py-2.5 px-4 text-right">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedOrder.items && selectedOrder.items.length > 0 ? (
                          selectedOrder.items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="py-3 px-4">
                                <span className="font-bold text-slate-800 block">
                                  {item.productName}
                                </span>
                                {item.sku && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    SKU: {item.sku}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-center font-bold text-slate-700">
                                {item.quantity}
                              </td>
                              <td className="py-3 px-4 text-right text-slate-600">
                                {formatCurrency(item.unitPrice)}
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-slate-900">
                                {formatCurrency(item.subtotal || Number(item.unitPrice) * item.quantity)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-4 text-center text-slate-400">
                              Chi tiết sản phẩm đang được cập nhật
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tổng kết tiền hóa đơn */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Tạm tính hàng hóa:</span>
                    <span className="font-semibold">
                      {formatCurrency(selectedOrder.subtotal || selectedOrder.totalAmount)}
                    </span>
                  </div>

                  {selectedOrder.shippingFee !== undefined && (
                    <div className="flex justify-between text-slate-600">
                      <span>Phí giao hàng:</span>
                      <span>
                        {Number(selectedOrder.shippingFee) === 0
                          ? 'Miễn phí'
                          : formatCurrency(selectedOrder.shippingFee)}
                      </span>
                    </div>
                  )}

                  {selectedOrder.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Giảm giá Voucher ({selectedOrder.voucherCode}):</span>
                      <span>-{formatCurrency(selectedOrder.discountAmount)}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline text-sm">
                    <span className="font-extrabold text-slate-900">Tổng thanh toán:</span>
                    <span className="text-lg font-black text-blue-600">
                      {formatCurrency(selectedOrder.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
