import { Laptop, Phone, Mail, MapPin, ShieldCheck, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: '#0f172a',
        color: '#94a3b8',
        borderTop: '1px solid #1e293b',
        paddingTop: '60px',
        paddingBottom: '30px',
        marginTop: 'auto',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '40px',
            marginBottom: '48px',
          }}
        >
          {/* Cột 1: Thương hiệu */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white', marginBottom: '16px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Laptop size={20} />
              </div>
              <span style={{ fontSize: '20px', fontWeight: 800 }}>TechZone</span>
            </div>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#94a3b8' }}>
              Hệ thống bán lẻ thiết bị công nghệ hàng đầu. Chuyên cung cấp Laptop, Điện Thoại chính hãng với trải nghiệm mua sắm tuyệt vời.
            </p>
          </div>

          {/* Cột 2: Danh mục */}
          <div>
            <h4 style={{ color: 'white', fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Danh Mục</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
              <li><Link to="/products" style={{ color: '#94a3b8' }}>Laptop Gaming & Văn Phòng</Link></li>
              <li><Link to="/products" style={{ color: '#94a3b8' }}>Điện Thoại Thông Minh</Link></li>
              <li><Link to="/products" style={{ color: '#94a3b8' }}>Phụ Kiện Chính Hãng</Link></li>
            </ul>
          </div>

          {/* Cột 3: Chính sách */}
          <div>
            <h4 style={{ color: 'white', fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Chính Sách & Hỗ Trợ</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
              <li>Chính sách bảo hành 24 tháng</li>
              <li>Đổi trả miễn phí trong 30 ngày</li>
              <li>Thanh toán an toàn qua VNPAY</li>
            </ul>
          </div>

          {/* Cột 4: Liên hệ */}
          <div>
            <h4 style={{ color: 'white', fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Liên Hệ</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={16} color="var(--primary)" /> Hotline: 1900 6868
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={16} color="var(--primary)" /> support@techzone.vn
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={16} color="var(--primary)" /> Hà Nội & TP. Hồ Chí Minh
              </div>
            </div>
          </div>
        </div>

        {/* Dòng bản quyền */}
        <div
          style={{
            borderTop: '1px solid #1e293b',
            paddingTop: '24px',
            textAlign: 'center',
            fontSize: '13px',
            color: '#64748b',
          }}
        >
          © 2026 TechZone E-Commerce. Dự án thực tập Spring Boot & React Vite.
        </div>
      </div>
    </footer>
  );
}
