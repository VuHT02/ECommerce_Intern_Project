import { useState } from 'react';
import { ShoppingBag, Check, Laptop, Sparkles } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { formatCurrency } from '../utils/format';

/**
 * Thẻ hiển thị sản phẩm (ProductCard) chuẩn E-Commerce công nghệ:
 * - Hiển thị hình ảnh với hiệu ứng zoom mượt mà khi hover
 * - Tên sản phẩm, thương hiệu, danh mục và giá tiền định dạng VNĐ
 * - Nút "Thêm vào giỏ hàng" kết nối với Zustand useCartStore kèm feedback visual
 */
export default function ProductCard({ product }) {
  const [added, setAdded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const addToCart = useCartStore((state) => state.addToCart);

  const isOutOfStock = product.stockQuantity <= 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (isOutOfStock) return;

    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col overflow-hidden">
      {/* Khung hình ảnh */}
      <div className="relative w-full pt-[75%] bg-slate-50 overflow-hidden flex items-center justify-center">
        {product.imageUrl && !imageError ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            onError={() => setImageError(true)}
            className="absolute inset-0 w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
            <Laptop size={48} strokeWidth={1.5} />
            <span className="text-[11px] font-medium mt-1">Chưa có ảnh</span>
          </div>
        )}

        {/* Badges trên ảnh */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.brand && (
            <span className="bg-white/90 backdrop-blur-md text-slate-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm border border-slate-200/50">
              {product.brand}
            </span>
          )}
          {isOutOfStock ? (
            <span className="bg-rose-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-sm">
              Hết hàng
            </span>
          ) : (
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
              <Sparkles size={10} /> Chính hãng
            </span>
          )}
        </div>
      </div>

      {/* Nội dung thông tin */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Tên danh mục */}
          {product.categoryName && (
            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">
              {product.categoryName}
            </p>
          )}

          {/* Tên sản phẩm */}
          <h3
            className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug mb-2"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Tồn kho */}
          <div className="text-[12px] text-slate-400 mb-3">
            {!isOutOfStock ? (
              <span>Còn lại: <strong className="text-slate-600 font-semibold">{product.stockQuantity}</strong> chiếc</span>
            ) : (
              <span className="text-rose-500 font-medium">Tạm thời hết hàng</span>
            )}
          </div>
        </div>

        {/* Giá & Nút hành động */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
          <div>
            <span className="text-xs text-slate-400 block">Giá niêm yết</span>
            <span className="text-base sm:text-lg font-extrabold text-blue-600 tracking-tight">
              {formatCurrency(product.price)}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 shadow-sm ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : added
                ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 hover:scale-105 active:scale-95'
            }`}
            title={isOutOfStock ? 'Sản phẩm tạm thời hết hàng' : 'Thêm sản phẩm vào giỏ'}
          >
            {added ? (
              <>
                <Check size={15} strokeWidth={2.5} />
                <span>Đã thêm</span>
              </>
            ) : (
              <>
                <ShoppingBag size={15} />
                <span>{isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ hàng'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
