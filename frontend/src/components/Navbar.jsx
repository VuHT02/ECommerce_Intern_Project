import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingCart, Laptop, User, LogOut, LogIn } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';

export default function Navbar() {
  const totalItems = useCartStore((state) => state.getTotalItems());
  const { isLoggedIn, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '72px',
          gap: '32px',
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '22px',
            fontWeight: 800,
            color: 'var(--text-main)',
            letterSpacing: '-0.5px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)',
            }}
          >
            <Laptop size={22} />
          </div>
          <span>Tech<span style={{ color: 'var(--primary)' }}>Zone</span></span>
        </Link>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
          <NavLink
            to="/"
            style={({ isActive }) => ({
              fontWeight: 600,
              fontSize: '15px',
              color: isActive ? 'var(--primary)' : 'var(--text-main)',
            })}
          >
            Trang Chủ
          </NavLink>
          <NavLink
            to="/products"
            style={({ isActive }) => ({
              fontWeight: 600,
              fontSize: '15px',
              color: isActive ? 'var(--primary)' : 'var(--text-main)',
            })}
          >
            Sản Phẩm
          </NavLink>
        </nav>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Cart Icon */}
          <Link
            to="/cart"
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              background: 'white',
              color: 'var(--text-main)',
            }}
          >
            <ShoppingCart size={20} />
            {totalItems > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: 'var(--danger)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {totalItems}
              </span>
            )}
          </Link>

          {/* User Profile / Login */}
          {isLoggedIn ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <User size={16} color="var(--primary)" />
                {user?.fullName || user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="btn btn-outline"
                style={{ padding: '8px 12px', fontSize: '13px', gap: '6px' }}
                title="Đăng xuất"
              >
                <LogOut size={16} /> Đăng xuất
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="btn btn-primary"
              style={{ padding: '8px 18px', fontSize: '14px', gap: '6px' }}
            >
              <LogIn size={16} /> Đăng Nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
