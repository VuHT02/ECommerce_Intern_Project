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
  CreditCard,
} from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useOnClickOutside } from '../hooks/useOnClickOutside';

/**
 * Thanh điều hướng chính (Navbar):
 * - Sử dụng hoàn toàn Tailwind CSS hiện đại, responsive
 * - Icon Giỏ hàng độc lập có badge số lượng sản phẩm
 * - Nếu chưa đăng nhập: Hiển thị 2 nút 'Đăng nhập' và 'Đăng ký'
 * - Nếu đã đăng nhập: Hiển thị Avatar tròn + Dropdown menu chuyên nghiệp
 * - Tự động đóng Dropdown khi click chuột ra ngoài qua custom hook `useOnClickOutside`
 */
export default function Navbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const totalItems = useCartStore((state) => state.getTotalItems());
  const { isLoggedIn, user, logout } = useAuthStore();
  const navigate = useNavigate();

  // Đóng dropdown khi click ra ngoài vùng menu
  useOnClickOutside(dropdownRef, () => setIsDropdownOpen(false));

  // Xử lý đăng xuất
  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    navigate('/');
  };

  // Ký tự viết tắt đại diện cho Avatar
  const avatarLetter = (user?.fullName || user?.email || 'U')[0].toUpperCase();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-6">
        {/* 1. LOGO THƯƠNG HIỆU */}
        <Link
          to="/"
          className="flex items-center gap-2.5 text-xl sm:text-2xl font-black text-slate-900 tracking-tight group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
            <Laptop size={22} strokeWidth={2.2} />
          </div>
          <span>
            Tech<span className="text-blue-600">Zone</span>
          </span>
        </Link>

        {/* 2. MENU ĐIỀU HƯỚNG CHÍNH */}
        <nav className="hidden md:flex items-center gap-8">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `text-sm font-bold transition-colors ${
                isActive
                  ? 'text-blue-600 font-extrabold'
                  : 'text-slate-600 hover:text-blue-600'
              }`
            }
          >
            Trang Chủ
          </NavLink>
          <NavLink
            to="/products"
            className={({ isActive }) =>
              `text-sm font-bold transition-colors ${
                isActive
                  ? 'text-blue-600 font-extrabold'
                  : 'text-slate-600 hover:text-blue-600'
              }`
            }
          >
            Sản Phẩm
          </NavLink>
        </nav>

        {/* 3. KHU VỰC HÀNH ĐỘNG (GIỎ HÀNG & USER AUTH) */}
        <div className="flex items-center gap-3.5">
          {/* ICON GIỎ HÀNG ĐỘC LẬP NẰM NGOÀI NAVBAR */}
          <Link
            to="/cart"
            className="relative flex items-center justify-center w-11 h-11 rounded-2xl border border-slate-200/80 bg-slate-50/70 hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-blue-600 transition-all shadow-sm"
            title="Giỏ hàng của bạn"
          >
            <ShoppingCart size={20} />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full min-w-[20px] h-5 px-1 text-[11px] font-black flex items-center justify-center shadow-md shadow-rose-500/30 animate-in zoom-in-75 duration-200">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </Link>

          {/* KHU VỰC USER: CHƯA ĐĂNG NHẬP VS ĐÃ ĐĂNG NHẬP */}
          {isLoggedIn ? (
            /* ĐÃ ĐĂNG NHẬP: AVATAR TRÒN & DROPDOWN MENU */
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 p-1 pl-1.5 rounded-full hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200 focus:outline-none"
                aria-expanded={isDropdownOpen}
                title="Tài khoản của bạn"
              >
                {/* Avatar tròn với chữ cái viết hoa */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 text-white flex items-center justify-center font-black text-sm shadow-md shadow-blue-500/25 ring-2 ring-white">
                  {avatarLetter}
                </div>

                {/* Tên ngắn & icon mũi tên (ẩn trên mobile nhỏ) */}
                <span className="hidden sm:inline-block text-xs font-bold text-slate-800 max-w-[120px] truncate">
                  {user?.fullName || user?.email}
                </span>
                <ChevronDown
                  size={14}
                  className={`text-slate-400 transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180 text-blue-600' : ''
                  }`}
                />
              </button>

              {/* DROPDOWN MENU */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150 divide-y divide-slate-100">
                  {/* Header Dropdown: Thông tin user */}
                  <div className="px-4 py-3 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {avatarLetter}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-extrabold text-slate-900 truncate">
                          {user?.fullName || 'Khách hàng'}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {user?.email}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        <Shield size={10} />
                        {user?.role === 'ROLE_ADMIN' ? 'Quản trị viên' : 'Thành viên'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        #{user?.id}
                      </span>
                    </div>
                  </div>

                  {/* Danh sách các Menu Items */}
                  <div className="py-1 text-xs">
                    {/* 1. Thông tin tài khoản */}
                    <Link
                      to="/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:text-blue-600 hover:bg-slate-50 font-semibold transition-colors"
                    >
                      <User size={16} className="text-slate-400 group-hover:text-blue-600" />
                      <span>Thông tin tài khoản</span>
                    </Link>

                    {/* 2. Đơn hàng của tôi / Lịch sử mua hàng */}
                    <Link
                      to="/orders"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:text-blue-600 hover:bg-slate-50 font-semibold transition-colors"
                    >
                      <Package size={16} className="text-slate-400" />
                      <span>Đơn hàng của tôi</span>
                    </Link>

                    {/* 3. Giỏ hàng */}
                    <Link
                      to="/cart"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center justify-between px-4 py-2.5 text-slate-700 hover:text-blue-600 hover:bg-slate-50 font-semibold transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <ShoppingCart size={16} className="text-slate-400" />
                        <span>Giỏ hàng</span>
                      </div>
                      {totalItems > 0 && (
                        <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {totalItems} món
                        </span>
                      )}
                    </Link>
                  </div>

                  {/* Chức năng Đăng xuất (màu đỏ) */}
                  <div className="p-1.5">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                    >
                      <LogOut size={15} />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* CHƯA ĐĂNG NHẬP: 2 NÚT 'ĐĂNG NHẬP' VÀ 'ĐĂNG KÝ' */
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-slate-100 border border-slate-200 transition-colors shadow-sm"
              >
                <LogIn size={14} />
                <span>Đăng nhập</span>
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/25 transition-all hover:scale-102 active:scale-98"
              >
                <UserPlus size={14} />
                <span>Đăng ký</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
