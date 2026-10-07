import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  ShoppingCart,
  Check,
  Plus,
  Minus,
  ShieldCheck,
  Truck,
  RotateCcw,
  Cpu,
  Layers,
  Monitor,
  HardDrive,
  AlertCircle,
  PackageX,
  ArrowLeft,
  Sparkles,
  Laptop,
  CheckCircle2
} from 'lucide-react';
import { useProductDetail } from '../hooks/useProducts';
import { useCartStore } from '../store/cartStore';
import { formatCurrency } from '../utils/format';

/**
 * Trang Chi tiết Sản phẩm (ProductDetailPage):
 * - Image Gallery bên trái (ảnh phóng to + hàng thumbnail chọn ảnh)
 * - Thông tin bên phải: Tên, Giá, Thương hiệu, Mô tả ngắn, Tồn kho
 * - Chọn số lượng (Quantity) & Nút 'Thêm vào giỏ hàng' kết nối Zustand
 * - Khối 'Bảng thông số kỹ thuật': RAM, CPU, Màn hình, v.v.
 * - Xử lý lỗi 404 (Sản phẩm không tồn tại) chuyên nghiệp, tránh trắng trang
 */
export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: product, isLoading, isError, error, refetch } = useProductDetail(id);
  const addToCart = useCartStore((state) => state.addToCart);

  const [selectedImage, setSelectedImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);

  // Cập nhật ảnh chính khi dữ liệu sản phẩm tải xong
  useEffect(() => {
    if (product?.imageUrl) {
      setSelectedImage(product.imageUrl);
    }
  }, [product]);

  // Gom danh sách ảnh (ảnh chính + các ảnh chi tiết nếu có)
  const images = [];
  if (product?.imageUrl) images.push(product.imageUrl);
  if (Array.isArray(product?.detailImageUrls)) {
    product.detailImageUrls.forEach((img) => {
      if (img && !images.includes(img)) images.push(img);
    });
  }

  // Trạng thái tồn kho
  const stock = product?.stockQuantity ?? 0;
  const isOutOfStock = stock <= 0;

  // Xử lý tăng/giảm số lượng
  const handleIncrease = () => {
    if (quantity < stock) setQuantity((prev) => prev + 1);
  };

  const handleDecrease = () => {
    if (quantity > 1) setQuantity((prev) => prev - 1);
  };

  // Thêm vào giỏ hàng
  const handleAddToCart = (e) => {
    e?.preventDefault();
    if (isOutOfStock || !product) return;

    addToCart(product, quantity);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  // Mua ngay (thêm vào giỏ và chuyển đến trang giỏ hàng)
  const handleBuyNow = () => {
    if (isOutOfStock || !product) return;
    addToCart(product, quantity);
    navigate('/cart');
  };

  // 1. GIAO DIỆN SKELETON LOADING KHI ĐANG TẢI DỮ LIỆU
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
          {/* Breadcrumb skeleton */}
          <div className="h-4 bg-slate-200 rounded w-48 mb-6" />

          {/* Layout chính 2 cột */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-white p-6 sm:p-10 rounded-3xl border border-slate-100 shadow-sm">
            {/* Cột trái: Gallery Skeleton */}
            <div className="space-y-4">
              <div className="w-full pt-[80%] bg-slate-200 rounded-2xl" />
              <div className="flex gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="w-20 h-20 bg-slate-200 rounded-xl" />
                ))}
              </div>
            </div>

            {/* Cột phải: Info Skeleton */}
            <div className="space-y-6">
              <div className="h-4 bg-slate-200 rounded w-1/4" />
              <div className="h-8 bg-slate-200 rounded w-3/4" />
              <div className="h-10 bg-slate-200 rounded w-1/2" />
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 rounded w-full" />
                <div className="h-4 bg-slate-200 rounded w-5/6" />
                <div className="h-4 bg-slate-200 rounded w-2/3" />
              </div>
              <div className="h-12 bg-slate-200 rounded-xl w-full" />
            </div>
          </div>

          {/* Specs Skeleton */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100">
            <div className="h-6 bg-slate-200 rounded w-48 mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 bg-slate-100 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. GIAO DIỆN LỖI 404 KHI SẢN PHẨM KHÔNG TỒN TẠI
  const is404Error =
    isError &&
    (error?.status === 404 ||
      error?.message?.includes('404') ||
      error?.message?.toLowerCase().includes('not found') ||
      !product);

  if (is404Error) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center py-16 px-4 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-100 shadow-xl p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-500 mb-6">
            <PackageX size={40} strokeWidth={1.8} />
          </div>
          <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-100 uppercase tracking-wider">
            Lỗi 404
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-3 mb-2">
            Sản Phẩm Không Tồn Tại
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            Rất tiếc, sản phẩm với mã ID <strong>#{id}</strong> không tìm thấy trong hệ thống, hoặc có thể đã bị ngừng kinh doanh.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/products"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all shadow-md shadow-blue-500/20"
            >
              <ArrowLeft size={16} /> Xem sản phẩm khác
            </Link>
            <Link
              to="/"
              className="px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. GIAO DIỆN LỖI KHÁC TỪ SERVER
  if (isError) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-rose-200 p-8 text-center shadow-lg">
          <AlertCircle size={44} className="text-rose-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">Có lỗi khi kết nối máy chủ</h3>
          <p className="text-sm text-slate-500 mb-6">{error?.message || 'Không thể tải chi tiết sản phẩm.'}</p>
          <button
            onClick={() => refetch()}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Thử tải lại
          </button>
        </div>
      </div>
    );
  }

  // 4. BẢNG THÔNG SỐ KỸ THUẬT (Mặc định cho Laptop / Smartphone công nghệ)
  const isPhone = product.categoryName?.toLowerCase().includes('thoại') || product.name?.toLowerCase().includes('phone');
  
  const specifications = [
    {
      label: 'Vi xử lý (CPU)',
      value: isPhone ? 'Apple A17 Pro / Snapdragon 8 Gen 3' : 'Intel Core i7 / Apple M3 Series',
      icon: Cpu,
      color: 'text-indigo-600 bg-indigo-50',
    },
    {
      label: 'Bộ nhớ RAM',
      value: isPhone ? '8 GB / 12 GB LPDDR5X' : '16 GB / 32 GB DDR5 5600MHz',
      icon: Layers,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Màn hình hiển thị',
      value: isPhone ? '6.7 inch Super Retina XDR OLED, 120Hz' : '15.6 inch Retina 2.8K, 120Hz DCI-P3 100%',
      icon: Monitor,
      color: 'text-cyan-600 bg-cyan-50',
    },
    {
      label: 'Ổ cứng / Lưu trữ',
      value: '512 GB PCIe 4.0 NVMe SSD tốc độ cao',
      icon: HardDrive,
      color: 'text-emerald-600 bg-emerald-50',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Breadcrumb điều hướng */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link to="/" className="hover:text-blue-600 transition-colors">Trang chủ</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-blue-600 transition-colors">Sản phẩm</Link>
          <span>/</span>
          {product.categoryName && (
            <>
              <span className="text-slate-400">{product.categoryName}</span>
              <span>/</span>
            </>
          )}
          <span className="text-slate-800 font-bold truncate max-w-xs">{product.name}</span>
        </nav>

        {/* Thông báo Toast khi Thêm Giỏ Hàng thành công */}
        {addedToast && (
          <div className="fixed top-20 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-300">
            <CheckCircle2 size={22} className="text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-100">Đã thêm vào giỏ hàng!</p>
              <p className="text-[11px] text-slate-400">Số lượng: {quantity} chiếc ({product.name})</p>
            </div>
            <Link
              to="/cart"
              className="ml-3 text-xs font-bold text-blue-400 hover:text-blue-300 underline"
            >
              Xem giỏ
            </Link>
          </div>
        )}

        {/* MAIN LAYOUT: CHIA 2 CỘT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-white p-6 sm:p-10 rounded-3xl border border-slate-100 shadow-sm">
          {/* CỘT TRÁI: IMAGE GALLERY */}
          <div className="space-y-4">
            {/* Ảnh lớn chính */}
            <div className="relative w-full pt-[85%] bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden flex items-center justify-center group">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-500 ease-out"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                  <Laptop size={64} strokeWidth={1.5} />
                  <span className="text-xs font-medium mt-2">Chưa có ảnh đại diện</span>
                </div>
              )}

              {/* Badge thương hiệu & bảo hành */}
              <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                {product.brand && (
                  <span className="bg-white/95 backdrop-blur-md text-slate-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm border border-slate-200">
                    {product.brand}
                  </span>
                )}
                <span className="bg-emerald-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                  <Sparkles size={11} /> Chính hãng 100%
                </span>
              </div>
            </div>

            {/* Hàng ảnh thumbnail nhỏ */}
            {images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                {images.map((img, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedImage(img)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden bg-slate-50 border-2 transition-all flex-shrink-0 ${
                      selectedImage === img
                        ? 'border-blue-600 ring-2 ring-blue-600/20'
                        : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${index + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain p-1.5"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CỘT PHẢI: TÊN, GIÁ, MÔ TẢ, TỒN KHO & HÀNH ĐỘNG */}
          <div className="flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Danh mục & SKU */}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-blue-600 uppercase tracking-wider">
                  {product.categoryName || 'Thiết bị công nghệ'}
                </span>
                {product.sku && <span>Mã SKU: <strong className="text-slate-600">{product.sku}</strong></span>}
              </div>

              {/* Tên sản phẩm */}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                {product.name}
              </h1>

              {/* Khối giá tiền */}
              <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-blue-600 tracking-tight">
                  {formatCurrency(product.price)}
                </span>
                <span className="text-xs text-slate-400 line-through">
                  {formatCurrency(Number(product.price) * 1.15)}
                </span>
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                  -15% Tiết kiệm
                </span>
              </div>

              {/* Trạng thái tồn kho */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">Trạng thái:</span>
                {isOutOfStock ? (
                  <span className="inline-flex items-center gap-1 font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                    Hết hàng
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Còn hàng ({stock} sản phẩm sẵn sàng giao)
                  </span>
                )}
              </div>

              {/* Mô tả ngắn */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Mô tả sản phẩm
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed line-clamp-4">
                  {product.description ||
                    'Sản phẩm công nghệ hiện đại với hiệu năng vượt trội, kiểu dáng tinh tế đẳng cấp, bảo hành chính hãng và nhiều ưu đãi hấp dẫn.'}
                </p>
              </div>
            </div>

            {/* Khối chọn số lượng & nút mua hàng */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              {/* Chọn số lượng */}
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-700">Số lượng:</span>
                <div className="inline-flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                  <button
                    type="button"
                    onClick={handleDecrease}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="p-2.5 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Giảm số lượng"
                  >
                    <Minus size={15} />
                  </button>
                  <span className="w-12 text-center text-sm font-bold text-slate-800">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={handleIncrease}
                    disabled={quantity >= stock || isOutOfStock}
                    className="p-2.5 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Tăng số lượng"
                  >
                    <Plus size={15} />
                  </button>
                </div>
                {!isOutOfStock && (
                  <span className="text-xs text-slate-400">
                    Tối đa: {stock} sản phẩm
                  </span>
                )}
              </div>

              {/* Nhóm 2 nút: Thêm giỏ hàng & Mua ngay */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl text-sm font-bold transition-all duration-200 border ${
                    isOutOfStock
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : addedToast
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white hover:bg-blue-50 text-blue-600 border-blue-600 hover:border-blue-700 shadow-sm'
                  }`}
                >
                  {addedToast ? (
                    <>
                      <Check size={18} strokeWidth={2.5} />
                      <span>Đã thêm</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={18} />
                      <span>{isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ hàng'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  className={`flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl text-sm font-bold transition-all duration-200 ${
                    isOutOfStock
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  <ShoppingCart size={18} />
                  <span>Mua ngay</span>
                </button>
              </div>

              {/* Cam kết mua hàng */}
              <div className="grid grid-cols-3 gap-2 pt-3 text-center border-t border-slate-100">
                <div className="flex flex-col items-center gap-1 p-2">
                  <ShieldCheck size={20} className="text-blue-600" />
                  <span className="text-[11px] font-semibold text-slate-700">Chính Hãng 100%</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2">
                  <Truck size={20} className="text-emerald-600" />
                  <span className="text-[11px] font-semibold text-slate-700">Giao Toàn Quốc</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2">
                  <RotateCcw size={20} className="text-amber-600" />
                  <span className="text-[11px] font-semibold text-slate-700">Đổi Trả 30 Ngày</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KHỐI BẢNG THÔNG SỐ KỸ THUẬT (RAM, CPU, MÀN HÌNH, Ổ CỨNG) */}
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Cpu className="text-blue-600" size={24} />
              Bảng Thông Số Kỹ Thuật
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Chi tiết cấu hình phần cứng tiêu chuẩn của thiết bị
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {specifications.map((spec, index) => {
              const Icon = spec.icon;
              return (
                <div
                  key={index}
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors flex flex-col justify-between"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2.5 rounded-xl ${spec.color}`}>
                      <Icon size={20} />
                    </div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {spec.label}
                    </span>
                  </div>
                  <p className="text-sm font-extrabold text-slate-900 leading-snug">
                    {spec.value}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Chi tiết mô tả đầy đủ */}
          <div className="pt-6 border-t border-slate-100">
            <h4 className="text-sm font-bold text-slate-900 mb-2">Đặc điểm nổi bật & Trải nghiệm</h4>
            <div className="text-sm text-slate-600 leading-relaxed space-y-2">
              <p>
                {product.description ||
                  'Thiết bị được trang bị cấu hình tiên tiến với vi xử lý thế hệ mới, đáp ứng trọn vẹn từ các tác vụ đồ họa, xử lý đa nhiệm đến giải trí đỉnh cao. Màn hình sắc nét với tần số quét mượt mà cùng thời lượng pin ấn tượng giúp tối ưu hóa hiệu suất làm việc cả ngày dài.'}
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-600 text-xs pt-1">
                <li>Thiết kế cao cấp nguyên khối, tản nhiệt buồng hơi tân tiến.</li>
                <li>Công nghệ sạc nhanh thông minh, bảo vệ tuổi thọ pin tối đa.</li>
                <li>Hệ thống âm thanh vòm sống động, micro lọc ồn AI chuẩn phòng thu.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
