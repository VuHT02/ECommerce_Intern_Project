import { useState, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Laptop,
  User,
  LogOut,
  LogIn,
  UserPlus,
  Package,
  ChevronDown,
  Shield,
  LayoutDashboard,
} from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useOnClickOutside } from '../hooks/useOnClickOutside';

export default function Navbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const totalItems = useCartStore((state) => state.getTotalItems());
  const { isLoggedIn, user, logout } = useAuthStore();
  const navigate = useNavigate();

  useOnClickOutside(dropdownRef, () => setIsDropdownOpen(false));

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    navigate('/');
  };

  const avatarLetter = (user?.fullName || user?.email || 'U')[0].toUpperCase();
  const role = String(user?.role || '').toUpperCase().replace(/^ROLE_/, '');

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

        {/* ── LOGO ── */}
        <Link
          to="/"
          className="flex items-center gap-2 text-xl font-black text-slate-900 tracking-tight shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
            <Laptop size={20} strokeWidth={2.5} />
          </div>
          <span>
            Tech<span className="text-blue-600">Zone</span>
          </span>
        </Link>

        {/* ── NAV LINKS ── */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `text-sm font-semibold transition-colors ${
                isActive ? 'text-blue-600' : 'text-slate-600 hover:text-blue-600'
              }`
            }
          >
            Trang Chủ
          </NavLink>
          <NavLink
            to="/products"
            className={({ isActive }) =>
              `text-sm font-semibold transition-colors ${
                isActive ? 'text-blue-600' : 'text-slate-600 hover:text-blue-600'
              }`
            }
          >
            Sản Phẩm
          </NavLink>
        </nav>

        {/* ── ACTIONS ── */}
        <div className="flex items-center gap-3">

          {/* Icon Giỏ hàng */}
          <Link
            to="/cart"
            className="relative flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-600 hover:text-blue-600 transition-all"
            title="Giỏ hàng"
          >
            <ShoppingCart size={19} />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full min-w-[18px] h-[18px] px-1 text-[10px] font-bold flex items-center justify-center shadow-sm">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </Link>

          {/* User area */}
          {isLoggedIn ? (
            /* ── ĐÃ ĐĂNG NHẬP: Avatar + Dropdown ── */
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200 focus:outline-none"
                aria-expanded={isDropdownOpen}
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                  {avatarLetter}
                </div>
                <span className="hidden sm:block text-sm font-semibold text-slate-700 max-w-[100px] truncate">
                  {user?.fullName || user?.email}
                </span>
                <ChevronDown
                  size={14}
                  className={`text-slate-400 transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="dropdown-animate absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 divide-y divide-slate-100">
                  {/* User info header */}
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {avatarLetter}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {user?.fullName || 'Khách hàng'}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                      </div>
                    </div>
                    <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      <Shield size={10} />
                      {role === 'ADMIN' ? 'Quản trị viên' : role === 'STAFF' ? 'Nhân viên' : 'Thành viên'}
                    </span>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    {(role === 'ADMIN' || role === 'STAFF') && (
                      <Link
                        to="/admin"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition-colors"
                      >
                        <LayoutDashboard size={16} /> Khu vực quản trị
                      </Link>
                    )}
                    <Link
                      to="/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:text-blue-600 hover:bg-slate-50 font-medium transition-colors"
                    >
                      <User size={16} className="text-slate-400" />
                      Thông tin tài khoản
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:text-blue-600 hover:bg-slate-50 font-medium transition-colors"
                    >
                      <Package size={16} className="text-slate-400" />
                      Đơn hàng của tôi
                    </Link>
                    <Link
                      to="/cart"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center justify-between px-4 py-2.5 text-sm text-slate-700 hover:text-blue-600 hover:bg-slate-50 font-medium transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        <ShoppingCart size={16} className="text-slate-400" />
                        Giỏ hàng
                      </span>
                      {totalItems > 0 && (
                        <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {totalItems}
                        </span>
                      )}
                    </Link>
                  </div>

                  {/* Logout */}
                  <div className="py-1 px-2">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                    >
                      <LogOut size={15} />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── CHƯA ĐĂNG NHẬP: 2 nút Login + Register ── */
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                <LogIn size={15} />
                <span>Đăng nhập</span>
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
              >
                <UserPlus size={15} />
                <span>Đăng ký</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
