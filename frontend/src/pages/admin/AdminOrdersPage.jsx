import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { AlertCircle, Eye, LoaderCircle, PackageCheck, Search, X } from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import { formatCurrency, formatDate } from '../../utils/format';

const transitions = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PAID: ['PROCESSING'],
  PROCESSING: ['SHIPPING'],
  SHIPPING: ['DELIVERED'],
};

const statusLabel = {
  PENDING: 'Chờ xử lý', CONFIRMED: 'Đã xác nhận', PAID: 'Đã thanh toán',
  PROCESSING: 'Đang chuẩn bị', SHIPPING: 'Đang giao', DELIVERED: 'Đã giao', CANCELLED: 'Đã hủy',
};

const pill = (value, paid = false) => {
  const color = value === 'PAID' || value === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700'
    : value === 'CANCELLED' || value === 'FAILED' ? 'bg-rose-50 text-rose-700'
      : value === 'SHIPPING' || value === 'PROCESSING' ? 'bg-blue-50 text-blue-700'
        : 'bg-amber-50 text-amber-700';
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${color}`}>{paid ? value : statusLabel[value] || value}</span>;
};

const inputClass = 'rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100';

export default function AdminOrdersPage() {
  const [result, setResult] = useState({ content: [], number: 0, totalPages: 0, totalElements: 0 });
  const [filters, setFilters] = useState({ keyword: '', status: '', paymentStatus: '', fromDate: '', toDate: '' });
  const [applied, setApplied] = useState(filters);
  const [page, setPage] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [details, setDetails] = useState(null);
  const [busyOrder, setBusyOrder] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getOrders({ ...applied, page, size: 10, sortBy: 'createdAt', sortDir: 'desc' });
      setResult(data);
    } catch (err) {
      setError(err.message || 'Không tải được đơn hàng.');
    } finally {
      setLoading(false);
    }
  }, [applied, page]);

  useEffect(() => { load(); }, [load]);

  const applyFilters = (event) => {
    event.preventDefault();
    setApplied({ ...filters });
    setPage(0);
  };

  const changeStatus = async (order) => {
    const next = selectedStatus[order.id];
    if (!next) return;
    if (next === 'CANCELLED' && !window.confirm(`Xác nhận hủy đơn ${order.orderNumber}? Tồn kho và voucher sẽ được hoàn lại nếu đủ điều kiện.`)) return;
    setBusyOrder(order.id);
    try {
      await adminApi.updateOrderStatus(order.id, next);
      toast.success(`Đã chuyển đơn ${order.orderNumber} sang ${statusLabel[next]}.`);
      await load();
      if (details?.id === order.id) setDetails(await adminApi.getOrder(order.id));
    } catch (err) {
      toast.error(err.message || 'Không thể cập nhật trạng thái đơn.');
    } finally {
      setBusyOrder(null);
    }
  };

  return (
    <div className="space-y-6">
      <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Bán hàng</p><h1 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">Đơn hàng</h1><p className="mt-1 text-sm text-slate-500">Theo dõi giao dịch và chuyển đơn qua các bước xử lý hợp lệ.</p></div>

      <form onSubmit={applyFilters} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-6">
        <label className="relative sm:col-span-2"><span className="sr-only">Tìm đơn</span><Search size={16} className="absolute left-3 top-3.5 text-slate-400" /><input value={filters.keyword} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })} placeholder="Mã đơn, email, người nhận" className={`${inputClass} w-full pl-9`} /></label>
        <select aria-label="Trạng thái đơn" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className={inputClass}><option value="">Mọi trạng thái đơn</option>{Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <select aria-label="Trạng thái thanh toán" value={filters.paymentStatus} onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })} className={inputClass}><option value="">Mọi thanh toán</option>{['UNPAID', 'PAID', 'FAILED', 'EXPIRED', 'CANCELLED'].map((value) => <option key={value}>{value}</option>)}</select>
        <input aria-label="Từ ngày" type="date" value={filters.fromDate} onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })} className={inputClass} />
        <div className="flex gap-2"><input aria-label="Đến ngày" type="date" value={filters.toDate} onChange={(e) => setFilters({ ...filters, toDate: e.target.value })} className={`${inputClass} min-w-0 flex-1`} /><button className="rounded-xl bg-slate-900 px-4 text-sm font-bold text-white hover:bg-slate-700">Lọc</button></div>
      </form>

      {error && <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><AlertCircle size={17} />{error}</div>}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-bold text-slate-900">Tất cả đơn hàng</h2><p className="mt-0.5 text-xs text-slate-500">{Number(result.totalElements || 0).toLocaleString('vi-VN')} đơn</p></div>{loading && <LoaderCircle size={18} className="animate-spin text-blue-600" />}</div>
        <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Đơn hàng</th><th className="px-4 py-3">Khách hàng</th><th className="px-4 py-3">Ngày đặt</th><th className="px-4 py-3">Tổng tiền</th><th className="px-4 py-3">Trạng thái đơn</th><th className="px-4 py-3">Thanh toán</th><th className="px-5 py-3 text-right">Xử lý</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {!loading && result.content?.length === 0 && <tr><td colSpan="7" className="px-5 py-16 text-center text-slate-500">Không tìm thấy đơn hàng phù hợp.</td></tr>}
            {result.content?.map((order) => {
              const options = transitions[order.status] || [];
              return <tr key={order.id} className="hover:bg-slate-50/70">
                <td className="px-5 py-3"><button onClick={() => setDetails(order)} className="font-extrabold text-blue-700 hover:underline">{order.orderNumber}</button><p className="mt-1 text-xs text-slate-500">{order.items?.length || 0} loại sản phẩm</p></td>
                <td className="px-4 py-3"><p className="font-semibold text-slate-800">{order.customerName || order.recipientName}</p><p className="mt-0.5 text-xs text-slate-500">{order.customerEmail}</p></td>
                <td className="px-4 py-3 whitespace-nowrap text-slate-600">{formatDate(order.createdAt)}</td>
                <td className="px-4 py-3 whitespace-nowrap font-bold text-slate-800">{formatCurrency(order.totalAmount)}</td>
                <td className="px-4 py-3">{pill(order.status)}</td>
                <td className="px-4 py-3"><div className="space-y-1">{pill(order.paymentStatus, true)}<p className="text-[10px] uppercase text-slate-400">{order.paymentMethod}</p></div></td>
                <td className="px-5 py-3"><div className="flex items-center justify-end gap-2"><button title="Chi tiết" onClick={() => setDetails(order)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:text-blue-700"><Eye size={16} /></button>{options.length > 0 && <><select aria-label={`Trạng thái tiếp theo ${order.orderNumber}`} value={selectedStatus[order.id] || ''} onChange={(e) => setSelectedStatus({ ...selectedStatus, [order.id]: e.target.value })} className="max-w-36 rounded-lg border border-slate-200 px-2 py-2 text-xs"><option value="">Chuyển trạng thái</option>{options.map((value) => <option key={value} value={value}>{statusLabel[value]}</option>)}</select><button disabled={!selectedStatus[order.id] || busyOrder === order.id} onClick={() => changeStatus(order)} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">{busyOrder === order.id ? 'Đang lưu' : 'Lưu'}</button></>}</div></td>
              </tr>;
            })}
          </tbody>
        </table></div>
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4"><p className="text-xs text-slate-500">Trang {Number(result.number || 0) + 1} / {Math.max(1, result.totalPages || 0)}</p><div className="flex gap-2"><button disabled={page <= 0 || loading} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold disabled:opacity-40">Trước</button><button disabled={page + 1 >= (result.totalPages || 0) || loading} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold disabled:opacity-40">Sau</button></div></div>
      </section>

      {details && <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setDetails(null); }}><div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7">
        <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Chi tiết đơn hàng</p><h2 className="mt-1 text-xl font-black text-slate-900">{details.orderNumber}</h2></div><button onClick={() => setDetails(null)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100"><X size={19} /></button></div>
        <div className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm sm:grid-cols-2"><div><p className="text-xs text-slate-500">Người nhận</p><p className="mt-1 font-bold text-slate-800">{details.recipientName}</p></div><div><p className="text-xs text-slate-500">Khách hàng</p><p className="mt-1 font-semibold text-slate-800">{details.customerEmail}</p></div><div><p className="text-xs text-slate-500">Điện thoại</p><p className="mt-1 font-semibold text-slate-800">{details.recipientPhone}</p></div><div><p className="text-xs text-slate-500">Địa chỉ</p><p className="mt-1 font-semibold text-slate-800">{details.shippingAddress}</p></div></div>
        <div className="mt-5 divide-y divide-slate-100 rounded-2xl border border-slate-200">{details.items?.map((item) => <div key={item.id} className="flex justify-between gap-3 p-4"><div><p className="font-bold text-slate-800">{item.productName}</p><p className="mt-1 text-xs text-slate-500">SKU {item.sku} · SL {item.quantity}</p></div><p className="shrink-0 font-bold text-slate-800">{formatCurrency(item.subtotal)}</p></div>)}</div>
        <div className="mt-4 space-y-2 text-sm"><div className="flex justify-between text-slate-500"><span>Tạm tính</span><span>{formatCurrency(details.subtotal)}</span></div><div className="flex justify-between text-slate-500"><span>Phí giao hàng</span><span>{formatCurrency(details.shippingFee)}</span></div><div className="flex justify-between text-slate-500"><span>Giảm giá</span><span>-{formatCurrency(details.discountAmount)}</span></div><div className="flex justify-between border-t border-slate-100 pt-3 text-base font-black text-slate-900"><span>Tổng thanh toán</span><span>{formatCurrency(details.totalAmount)}</span></div></div>
        <div className="mt-5 flex flex-wrap items-center gap-2"><PackageCheck className="text-blue-600" size={18} />{pill(details.status)}{pill(details.paymentStatus, true)}</div>
      </div></div>}
    </div>
  );
}
