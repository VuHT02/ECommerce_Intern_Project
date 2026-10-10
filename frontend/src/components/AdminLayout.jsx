import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Boxes, LayoutDashboard, LogOut, PackageCheck, Shield, Users } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const normalizeRole = (role = '') => role.toUpperCase().replace(/^ROLE_/, '');

const navItems = [
  { to: '/admin', label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Sản phẩm', icon: Boxes },
  { to: '/admin/orders', label: 'Đơn hàng', icon: PackageCheck },
];

function Navigation({ isAdmin, onNavigate }) {
  const items = isAdmin ? [...navItems, { to: '/admin/users', label: 'Tài khoản', icon: Users }] : navItems;
  return items.map(({ to, label, icon: Icon, end }) => (
    <NavLink
      key={to}
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) => `flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/20' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
    >
      <Icon size={18} /> {label}
    </NavLink>
  ));
}

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = normalizeRole(user?.role) === 'ADMIN';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col bg-slate-950 px-4 py-6 text-white lg:flex">
        <Link to="/admin" className="mb-10 flex items-center gap-3 px-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600"><Shield size={21} /></span>
          <span className="text-lg font-black tracking-tight">Tech<span className="text-blue-400">Zone</span><small className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Quản trị</small></span>
        </Link>
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Workspace</p>
        <nav className="space-y-1.5"><Navigation isAdmin={isAdmin} /></nav>
        <div className="mt-auto space-y-3 border-t border-slate-800 pt-5">
          <Link to="/" className="flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white">
            Quay lại cửa hàng <ArrowUpRight size={16} />
          </Link>
          <div className="flex items-center gap-3 rounded-xl bg-slate-900 p-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-bold">{(user?.fullName || user?.email || 'A')[0].toUpperCase()}</span>
            <span className="min-w-0 flex-1"><strong className="block truncate text-xs">{user?.fullName || user?.email}</strong><small className="text-slate-400">{isAdmin ? 'Quản trị viên' : 'Nhân viên'}</small></span>
            <button onClick={handleLogout} title="Đăng xuất" className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><LogOut size={16} /></button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div><p className="text-xs font-semibold text-blue-600">TECHZONE / ADMIN</p><p className="mt-0.5 text-sm font-bold text-slate-900">Khu vực quản trị</p></div>
            <Link to="/" className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 lg:hidden">Cửa hàng</Link>
          </div>
          <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden"><Navigation isAdmin={isAdmin} /></nav>
        </header>
        <main className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
