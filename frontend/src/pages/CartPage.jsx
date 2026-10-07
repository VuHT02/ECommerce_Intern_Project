import { Link } from 'react-router-dom';
import { ShoppingCart, ArrowRight } from 'lucide-react';

export default function CartPage() {
  return (
    <div className="cart-page" style={{ padding: '40px 0' }}>
      <div className="container">
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Giỏ Hàng Của Bạn</h1>
          <p style={{ color: 'var(--text-muted)' }}>Quản lý các sản phẩm bạn đã chọn trước khi tiến hành thanh toán.</p>
        </div>

        <div
          style={{
            background: 'white',
            padding: '60px 20px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              background: '#eff6ff',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: 'var(--primary)',
            }}
          >
            <ShoppingCart size={36} />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Giỏ Hàng Đang Trống</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 24px' }}>
            Bạn chưa chọn món đồ công nghệ nào. Hãy dạo quanh cửa hàng để tìm cho mình sản phẩm ưng ý nhé!
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <Link to="/products" className="btn btn-primary" style={{ padding: '12px 24px' }}>
              Mua Sắm Ngay <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
