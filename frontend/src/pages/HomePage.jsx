import { Link } from 'react-router-dom';
import { ShoppingBag, Sparkles, Laptop, Smartphone, ShieldCheck, Truck } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="home-page" style={{ padding: '40px 0' }}>
      <div className="container">
        {/* Hero Banner */}
        <section
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%)',
            color: 'white',
            borderRadius: '24px',
            padding: '60px 40px',
            boxShadow: 'var(--shadow-lg)',
            marginBottom: '48px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '20px',
          }}
        >
          <span
            className="badge"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              color: '#93c5fd',
              padding: '6px 14px',
              fontSize: '13px',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Sparkles size={14} style={{ marginRight: '6px' }} /> Siêu Ưu Đãi Công Nghệ 2026
          </span>
          <h1 style={{ fontSize: '42px', fontWeight: 800, lineHeight: 1.2, margin: 0, maxWidth: '700px' }}>
            Trải Nghiệm Đẳng Cấp Laptop & Smartphone Hàng Đầu
          </h1>
          <p style={{ fontSize: '18px', color: '#cbd5e1', maxWidth: '600px', margin: 0 }}>
            Hàng chính hãng 100%, bảo hành 24 tháng, hỗ trợ trả góp 0% và giao hàng hỏa tốc trong 2 giờ.
          </p>
          <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
            <Link to="/products" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '16px' }}>
              <ShoppingBag size={18} /> Khám Phá Sản Phẩm
            </Link>
          </div>
        </section>

        {/* Feature Highlights */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '24px',
            marginBottom: '48px',
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div style={{ background: '#eff6ff', color: 'var(--primary)', padding: '12px', borderRadius: '12px' }}>
              <Truck size={24} />
            </div>
            <div>
              <h4 style={{ fontWeight: 700, margin: 0 }}>Giao Hàng Miễn Phí</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>Cho đơn hàng từ 1.000.000 đ</p>
            </div>
          </div>

          <div
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div style={{ background: '#ecfdf5', color: 'var(--success)', padding: '12px', borderRadius: '12px' }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 style={{ fontWeight: 700, margin: 0 }}>Chính Hãng 100%</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>Cam kết bảo hành tại hãng</p>
            </div>
          </div>

          <div
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div style={{ background: '#fffbeb', color: 'var(--accent)', padding: '12px', borderRadius: '12px' }}>
              <Laptop size={24} />
            </div>
            <div>
              <h4 style={{ fontWeight: 700, margin: 0 }}>Laptop Cấu Hình Khủng</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>Phục vụ học tập, đồ họa & gaming</p>
            </div>
          </div>

          <div
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div style={{ background: '#fdf2f8', color: '#db2777', padding: '12px', borderRadius: '12px' }}>
              <Smartphone size={24} />
            </div>
            <div>
              <h4 style={{ fontWeight: 700, margin: 0 }}>Điện Thoại Flagship</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>iPhone, Samsung, Xiaomi mới nhất</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
