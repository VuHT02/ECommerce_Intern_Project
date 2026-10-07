import { Laptop, Search, Filter } from 'lucide-react';

export default function ProductPage() {
  return (
    <div className="product-page" style={{ padding: '40px 0' }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Danh Sách Sản Phẩm</h1>
          <p style={{ color: 'var(--text-muted)' }}>Khám phá các thiết bị công nghệ máy tính, điện thoại chính hãng với giá tốt nhất.</p>
        </div>

        {/* Toolbar */}
        <div
          style={{
            background: 'white',
            padding: '16px 20px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '400px', background: '#f8fafc', padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Tìm kiếm máy tính, điện thoại, SKU..."
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button className="btn btn-outline" style={{ padding: '8px 14px', fontSize: '13px' }}>
              <Filter size={16} /> Bộ lọc
            </button>
            <select
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                background: 'white',
                fontSize: '13px',
                outline: 'none',
              }}
            >
              <option>Mới nhất</option>
              <option>Giá tăng dần</option>
              <option>Giá giảm dần</option>
            </select>
          </div>
        </div>

        {/* Product Grid Placeholder */}
        <div
          style={{
            background: 'white',
            padding: '60px 20px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}
        >
          <Laptop size={48} style={{ color: 'var(--primary)', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
            Sẵn Sàng Hiển Thị Danh Sách Sản Phẩm
          </h3>
          <p style={{ maxWidth: '480px', margin: '0 auto' }}>
            Trang sản phẩm đã sẵn sàng kết nối API <code>/api/products</code> từ Spring Boot backend.
          </p>
        </div>
      </div>
    </div>
  );
}
