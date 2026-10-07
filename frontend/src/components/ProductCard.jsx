import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Check, Laptop, ShieldCheck } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { formatCurrency } from '../utils/format';
import { getFallbackProductImage, getProductImageUrl } from '../utils/productImage';
import { repairVietnameseLabel } from '../utils/vietnameseText';

/**
 * Thẻ hiển thị sản phẩm (ProductCard) cao cấp chuẩn E-Commerce công nghệ:
 * - Khung hình ảnh cố định h-52 với nền gradient nhẹ, chống vỡ layout
 * - Hiển thị ảnh sắc nét kèm hiệu ứng hover zoom mượt mà
 * - Tên sản phẩm, thương hiệu, danh mục font Inter tiếng Việt chuẩn 100%
 * - Nút "Thêm vào giỏ hàng" thiết kế sang trọng, phản hồi trực quan khi bấm
 */
export default function ProductCard({ product }) {
  const [added, setAdded] = useState(false);
  const imageKey = JSON.stringify([
    product.id,
    product.imageUrl,
    product.brand,
    product.name,
    product.slug,
    product.categoryName,
  ]);
  const [imageState, setImageState] = useState(() => ({
    key: imageKey,
    src: getProductImageUrl(product),
    error: false,
  }));
  const hasCurrentImageState = imageState.key === imageKey;
  const imageSrc = hasCurrentImageState ? imageState.src : getProductImageUrl(product);
  const imageError = hasCurrentImageState && imageState.error;
  const addToCart = useCartStore((state) => state.addToCart);

  const isOutOfStock = product.stockQuantity <= 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden">
      {/* ── KHUNG HÌNH ẢNH SẢN PHẨM ── */}
      <Link
        to={`/products/${product.id}`}
        className="relative w-full h-52 bg-slate-50 flex items-center justify-center overflow-hidden border-b border-slate-100 block"
      >
        {imageSrc && !imageError ? (
          <img
            src={imageSrc}
            alt={product.name}
            referrerPolicy="no-referrer"
            onError={() => {
              const fallback = getFallbackProductImage(product);
              if (imageSrc !== fallback) {
                setImageState({ key: imageKey, src: fallback, error: false });
              } else {
                setImageState({ key: imageKey, src: fallback, error: true });
              }
            }}
            className="w-full h-full object-contain p-5 group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-300">
            <Laptop size={44} strokeWidth={1.5} />
            <span className="text-xs font-medium text-slate-400 mt-1">TechZone</span>
          </div>
        )}

        {/* Badges góc trên */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.brand && (
            <span className="bg-white/95 backdrop-blur-md text-slate-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs border border-slate-200/60">
              {product.brand}
            </span>
          )}
        </div>

        <div className="absolute top-3 right-3 z-10">
          {isOutOfStock ? (
            <span className="bg-rose-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
              Hết hàng
            </span>
          ) : (
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
              <ShieldCheck size={11} /> Chính hãng
            </span>
          )}
        </div>
      </Link>

      {/* ── THÔNG TIN SẢN PHẨM ── */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Tên danh mục */}
          {product.categoryName && (
            <p className="text-xs font-semibold text-blue-600 mb-1.5 truncate">
              {repairVietnameseLabel(product.categoryName)}
            </p>
          )}

          {/* Tên sản phẩm */}
          <Link to={`/products/${product.id}`} className="block group-hover:text-blue-600 transition-colors">
            <h3
              className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug min-h-[2.5rem]"
              title={product.name}
            >
              {repairVietnameseLabel(product.name)}
            </h3>
          </Link>

          {/* Tồn kho & Đánh giá */}
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2.5 mb-4">
            {!isOutOfStock ? (
              <span className="text-slate-500">
                Còn lại: <strong className="text-slate-700 font-semibold">{product.stockQuantity}</strong>
              </span>
            ) : (
              <span className="text-rose-500 font-medium">Tạm hết hàng</span>
            )}
            <span className="text-[11px] text-slate-400">Trả góp 0%</span>
          </div>
        </div>

        {/* ── GIÁ & NÚT THÊM GIỎ HÀNG ── */}
        <div className="pt-3 border-t border-slate-100 flex items-end justify-between gap-2 mt-auto">
          <div className="min-w-0">
            <span className="text-[11px] text-slate-400 block font-medium">Giá ưu đãi</span>
            <span className="text-base sm:text-lg font-black text-blue-600 tracking-tight block truncate">
              {formatCurrency(product.price)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 shadow-xs shrink-0 whitespace-nowrap ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : added
                ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-blue-500/20'
            }`}
            title={isOutOfStock ? 'Sản phẩm tạm thời hết hàng' : 'Thêm sản phẩm vào giỏ'}
          >
            {added ? (
              <>
                <Check size={14} strokeWidth={2.5} />
                <span>Đã thêm</span>
              </>
            ) : (
              <>
                <ShoppingBag size={14} />
                <span>Thêm</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
