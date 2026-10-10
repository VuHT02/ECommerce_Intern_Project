import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ArrowRight, Boxes, CircleDollarSign, ClipboardList, LoaderCircle, PackageCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import { formatCurrency } from '../../utils/format';

const cards = [
  { key: 'totalProducts', title: 'Tổng sản phẩm', icon: Boxes, color: 'blue' },
  { key: 'activeProducts', title: 'Đang kinh doanh', icon: PackageCheck, color: 'emerald' },
  { key: 'lowStockProducts', title: 'Sắp hết hàng', icon: AlertTriangle, color: 'amber' },
  { key: 'totalOrders', title: 'Tổng đơn hàng', icon: ClipboardList, color: 'violet' },
  { key: 'pendingOrders', title: 'Đơn chờ xử lý', icon: PackageCheck, color: 'rose' },
  { key: 'totalUsers', title: 'Tài khoản', icon: Users, color: 'cyan' },
];

const iconStyles = {
  blue: 'bg-blue-50 text-blue-600', emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600', violet: 'bg-violet-50 text-violet-600',
  rose: 'bg-rose-50 text-rose-600', cyan: 'bg-cyan-50 text-cyan-700',
};

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setSummary(await adminApi.getDashboard());
    } catch (err) {
      setError(err.message || 'Không tải được số liệu tổng quan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Bảng điều khiển</p><h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Tổng quan cửa hàng</h1><p className="mt-1 text-sm text-slate-500">Số liệu được tổng hợp trực tiếp từ cơ sở dữ liệu.</p></div>
        <button onClick={load} className="self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 sm:self-auto">Làm mới</button>
      </div>

      {error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</div>}

      {loading && !summary ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500"><LoaderCircle className="mr-2 animate-spin" size={20} />Đang tải số liệu…</div>
      ) : summary ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map(({ key, title, icon: Icon, color }) => (
              <article key={key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between"><span className="text-sm font-semibold text-slate-500">{title}</span><span className={`rounded-xl p-2.5 ${iconStyles[color]}`}><Icon size={19} /></span></div>
                <p className="mt-5 text-3xl font-black tracking-tight text-slate-900">{Number(summary[key] || 0).toLocaleString('vi-VN')}</p>
              </article>
            ))}
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
              <div className="flex items-center gap-3"><span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600"><CircleDollarSign size={21} /></span><div><p className="text-sm font-semibold text-slate-500">Doanh thu đã thanh toán</p><p className="mt-1 text-2xl font-black text-slate-900">{formatCurrency(summary.paidRevenue || 0)}</p></div></div>
              <p className="mt-4 text-xs text-slate-500">Chỉ tính {Number(summary.paidOrderCount || 0).toLocaleString('vi-VN')} đơn có trạng thái thanh toán PAID.</p>
            </article>
            <article className="rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-800 p-6 text-white shadow-lg shadow-blue-900/10">
              <p className="text-sm font-semibold text-blue-100">Thao tác nhanh</p>
              <div className="mt-4 space-y-2">
                <Link to="/admin/products" className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 text-sm font-bold hover:bg-white/20">Quản lý sản phẩm <ArrowRight size={16} /></Link>
                <Link to="/admin/orders" className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 text-sm font-bold hover:bg-white/20">Xử lý đơn hàng <ArrowRight size={16} /></Link>
              </div>
            </article>
          </section>
        </>
      ) : null}
    </div>
  );
}
