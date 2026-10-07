import { CreditCard, CheckCircle2 } from 'lucide-react';

export default function CheckoutPage() {
  return (
    <div className="checkout-page" style={{ padding: '40px 0' }}>
      <div className="container">
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Xác Nhận Đơn Hàng & Thanh Toán</h1>
          <p style={{ color: 'var(--text-muted)' }}>Vui lòng kiểm tra lại thông tin nhận hàng và phương thức thanh toán.</p>
        </div>

        <div
          style={{
            background: 'white',
            padding: '40px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            maxWidth: '680px',
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              background: '#ecfdf5',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'var(--success)',
            }}
          >
            <CreditCard size={32} />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Cổng Thanh Toán VNPAY & COD</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
            Hệ thống hỗ trợ thanh toán khi nhận hàng (COD) hoặc quét mã VNPAY-QR bảo mật cao.
          </p>

          <div
            style={{
              background: '#f8fafc',
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'left',
            }}
          >
            <CheckCircle2 size={20} color="var(--primary)" />
            <span style={{ fontSize: '14px', color: 'var(--text-main)' }}>
              Đã tích hợp sẵn sàng kết nối API <code>/api/orders</code> và <code>/api/payment/create-vnpay</code>.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
