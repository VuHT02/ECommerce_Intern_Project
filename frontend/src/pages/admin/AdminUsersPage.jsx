import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { AlertCircle, LoaderCircle, Search, ShieldCheck, UserRoundCog } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { adminApi } from '../../services/adminApi';
import { formatDate } from '../../utils/format';

const normalizeRole = (role = '') => role.toUpperCase().replace(/^ROLE_/, '');
const roles = ['CUSTOMER', 'STAFF', 'ADMIN'];
const inputClass = 'rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100';

export default function AdminUsersPage() {
  const actor = useAuthStore((state) => state.user);
  const [result, setResult] = useState({ content: [], number: 0, totalPages: 0, totalElements: 0 });
  const [filters, setFilters] = useState({ keyword: '', role: '', active: '' });
  const [applied, setApplied] = useState(filters);
  const [roleDraft, setRoleDraft] = useState({});
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getUsers({ ...applied, page, size: 10, sortBy: 'createdAt', sortDir: 'desc' });
      setResult(data);
      setRoleDraft(Object.fromEntries((data.content || []).map((user) => [user.id, normalizeRole(user.role)])));
    } catch (err) {
      setError(err.message || 'Không tải được danh sách tài khoản.');
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

  const saveRole = async (user) => {
    const role = roleDraft[user.id];
    if (role === normalizeRole(user.role)) return;
    setBusyId(user.id);
    try {
      await adminApi.updateUserRole(user.id, role);
      toast.success(`Đã cập nhật vai trò của ${user.email}.`);
      await load();
    } catch (err) {
      toast.error(err.message || 'Không cập nhật được vai trò.');
    } finally {
      setBusyId(null);
    }
  };

  const toggleActive = async (user) => {
    const next = !user.active;
    const action = next ? 'kích hoạt' : 'vô hiệu hóa';
    if (!window.confirm(`Bạn muốn ${action} tài khoản ${user.email}?`)) return;
    setBusyId(user.id);
    try {
      await adminApi.updateUserActive(user.id, next);
      toast.success(`Đã ${action} tài khoản.`);
      await load();
    } catch (err) {
      toast.error(err.message || `Không thể ${action} tài khoản.`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Bảo mật & quyền truy cập</p><h1 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">Tài khoản và vai trò</h1><p className="mt-1 text-sm text-slate-500">Quản lý Customer, Staff và Admin. Mật khẩu không được hiển thị hoặc trả về từ API.</p></div>

      <form onSubmit={applyFilters} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-4">
        <label className="relative sm:col-span-2"><span className="sr-only">Tìm tài khoản</span><Search size={16} className="absolute left-3 top-3.5 text-slate-400" /><input value={filters.keyword} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })} placeholder="Tìm theo email, họ tên hoặc điện thoại" className={`${inputClass} w-full pl-9`} /></label>
        <select aria-label="Lọc vai trò" value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })} className={inputClass}><option value="">Mọi vai trò</option>{roles.map((role) => <option key={role}>{role}</option>)}</select>
        <div className="flex gap-2"><select aria-label="Lọc trạng thái tài khoản" value={filters.active} onChange={(e) => setFilters({ ...filters, active: e.target.value })} className={`${inputClass} min-w-0 flex-1`}><option value="">Mọi trạng thái</option><option value="true">Đang hoạt động</option><option value="false">Đã vô hiệu hóa</option></select><button className="rounded-xl bg-slate-900 px-4 text-sm font-bold text-white hover:bg-slate-700">Lọc</button></div>
      </form>

      {error && <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><AlertCircle size={17} />{error}</div>}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-bold text-slate-900">Tất cả tài khoản</h2><p className="mt-0.5 text-xs text-slate-500">{Number(result.totalElements || 0).toLocaleString('vi-VN')} tài khoản</p></div>{loading && <LoaderCircle size={18} className="animate-spin text-blue-600" />}</div>
        <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Tài khoản</th><th className="px-4 py-3">Điện thoại</th><th className="px-4 py-3">Ngày tạo</th><th className="px-4 py-3">Vai trò</th><th className="px-4 py-3">Trạng thái</th><th className="px-5 py-3 text-right">Thao tác</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {!loading && result.content?.length === 0 && <tr><td colSpan="6" className="px-5 py-16 text-center text-slate-500">Không tìm thấy tài khoản phù hợp.</td></tr>}
            {result.content?.map((user) => {
              const isSelf = user.id === actor?.id;
              const changed = roleDraft[user.id] !== normalizeRole(user.role);
              return <tr key={user.id} className="hover:bg-slate-50/70">
                <td className="px-5 py-3"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-700">{(user.fullName || user.email || 'U')[0].toUpperCase()}</span><div><p className="font-bold text-slate-800">{user.fullName || 'Chưa cập nhật tên'}</p><p className="mt-0.5 text-xs text-slate-500">{user.email}</p>{isSelf && <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-blue-700"><ShieldCheck size={11} />Tài khoản hiện tại</span>}</div></div></td>
                <td className="px-4 py-3 text-slate-600">{user.phone || '—'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-slate-600">{formatDate(user.createdAt)}</td>
                <td className="px-4 py-3"><select disabled={isSelf || busyId === user.id} value={roleDraft[user.id] || normalizeRole(user.role)} onChange={(e) => setRoleDraft({ ...roleDraft, [user.id]: e.target.value })} className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold disabled:bg-slate-100">{roles.map((role) => <option key={role}>{role}</option>)}</select></td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${user.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{user.active ? 'Hoạt động' : 'Đã khóa'}</span></td>
                <td className="px-5 py-3"><div className="flex items-center justify-end gap-2">{changed && <button disabled={busyId === user.id} onClick={() => saveRole(user)} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Lưu quyền</button>}<button disabled={isSelf || busyId === user.id} onClick={() => toggleActive(user)} className={`rounded-lg border px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 ${user.active ? 'border-rose-100 text-rose-600 hover:bg-rose-50' : 'border-emerald-100 text-emerald-700 hover:bg-emerald-50'}`}>{busyId === user.id ? 'Đang lưu' : user.active ? 'Vô hiệu hóa' : 'Kích hoạt'}</button></div></td>
              </tr>;
            })}
          </tbody>
        </table></div>
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4"><p className="text-xs text-slate-500">Trang {Number(result.number || 0) + 1} / {Math.max(1, result.totalPages || 0)}</p><div className="flex gap-2"><button disabled={page <= 0 || loading} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold disabled:opacity-40">Trước</button><button disabled={page + 1 >= (result.totalPages || 0) || loading} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold disabled:opacity-40">Sau</button></div></div>
      </section>
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900"><UserRoundCog size={17} className="mt-0.5 shrink-0" /><p>Thay đổi vai trò có hiệu lực ở request kế tiếp vì backend nạp lại authority từ database trên mỗi request. Không thể tự đổi vai trò hoặc vô hiệu hóa tài khoản đang đăng nhập; backend cũng giữ lại Admin hoạt động cuối cùng.</p></div>
    </div>
  );
}
