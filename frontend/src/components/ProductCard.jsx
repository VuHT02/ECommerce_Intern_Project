import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, CheckCircle2, Laptop, ShoppingBag, XCircle } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { getFallbackProductImage, getProductImageUrl } from '../utils/productImage';
import { repairVietnameseLabel } from '../utils/vietnameseText';

const formatVnd = (price) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);

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
  const rawStock = Number(product.stockQuantity ?? 0);
  const stock = Number.isFinite(rawStock) ? rawStock : 0;
  const isOutOfStock = stock <= 0;
  const showLowStock = stock > 0 && stock <= 10;
  const addToCart = useCartStore((state) => state.addToCart);
  const mediaFrameStyle = {
    position: 'relative',
    height: 192,
    minHeight: 192,
    flex: '0 0 192px',
    overflow: 'hidden',
    backgroundColor: '#f9fafb',
  };
  const imageLinkStyle = {
    position: 'absolute',
    inset: '36px 0 0',
    display: 'block',
    overflow: 'hidden',
  };
  const imageStyle = {
    display: 'block',
    width: '100%',
    height: '100%',
    padding: 12,
    boxSizing: 'border-box',
    objectFit: 'contain',
  };
  const statusStripStyle = {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    zIndex: 2,
    display: 'flex',
    height: 36,
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '0 12px',
    borderBottom: '1px solid #e5e7eb',
    background: 'linear-gradient(180deg, #ffffff, #f9fafb)',
    pointerEvents: 'none',
  };
  const statusBadgeStyle = isOutOfStock
    ? {
        display: 'inline-flex',
        height: 26,
        alignItems: 'center',
        gap: 6,
        padding: '0 10px',
        border: '1px solid #d1d5db',
        borderRadius: 9999,
        background: 'linear-gradient(135deg, #f9fafb, #e5e7eb)',
        color: '#4b5563',
        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.10)',
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1,
      }
    : {
        display: 'inline-flex',
        height: 26,
        alignItems: 'center',
        gap: 6,
        padding: '0 10px',
        border: '1px solid #86efac',
        borderRadius: 9999,
        background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
        color: '#15803d',
        boxShadow: '0 2px 8px rgba(22, 163, 74, 0.16)',
        fontSize: 12,
        fontWeight: 700,
        lineHeight: 1,
      };

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  const handleImageError = () => {
    const fallback = getFallbackProductImage(product);
    if (imageSrc !== fallback) {
      setImageState({ key: imageKey, src: fallback, error: false });
    } else {
      setImageState({ key: imageKey, src: fallback, error: true });
    }
  };

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative w-full shrink-0 overflow-hidden bg-gray-50" style={mediaFrameStyle}>
        <Link
          to={`/products/${product.id}`}
          className="absolute block overflow-hidden"
          style={imageLinkStyle}
          aria-label={`Xem chi tiết ${repairVietnameseLabel(product.name)}`}
        >
          {imageSrc && !imageError ? (
            <img
              src={imageSrc}
              alt={repairVietnameseLabel(product.name)}
              referrerPolicy="no-referrer"
              onError={handleImageError}
              className="h-full w-full object-contain"
              style={imageStyle}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-300">
              <Laptop size={40} strokeWidth={1.5} />
              <span className="text-xs font-medium text-gray-400">TechZone</span>
            </div>
          )}
        </Link>

        <div className="pointer-events-none" style={statusStripStyle}>
          {isOutOfStock ? (
            <span className="transition-transform duration-200 hover:scale-105" style={statusBadgeStyle}>
              <XCircle size={14} strokeWidth={2.2} />
              Hết hàng
            </span>
          ) : (
            <span className="transition-transform duration-200 hover:scale-105" style={statusBadgeStyle}>
              <CheckCircle2 className="animate-pulse" size={14} strokeWidth={2.4} />
              Còn hàng
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex min-h-4 items-center gap-1.5 overflow-hidden text-xs font-medium text-gray-400">
          {product.brand && <span className="shrink-0 truncate">{repairVietnameseLabel(product.brand)}</span>}
          {product.brand && product.categoryName && <span aria-hidden="true">·</span>}
          {product.categoryName && (
            <span className="truncate">{repairVietnameseLabel(product.categoryName)}</span>
          )}
        </div>

        <Link to={`/products/${product.id}`} className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
          <h3
            className="line-clamp-2 min-h-[40px] text-sm font-semibold leading-5 text-gray-800 transition-colors group-hover:text-blue-600"
            title={repairVietnameseLabel(product.name)}
          >
            {repairVietnameseLabel(product.name)}
          </h3>
        </Link>

        {showLowStock && (
          <p className="mt-2 text-xs font-medium text-red-500">
            Chỉ còn {stock} sản phẩm
          </p>
        )}

        <div className="mt-auto pt-4">
          <p className="text-lg font-bold leading-7 text-blue-600">
            {formatVnd(product.price)}
          </p>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${
              isOutOfStock
                ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                : added
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            title={isOutOfStock ? 'Sản phẩm đã hết hàng' : 'Thêm sản phẩm vào giỏ hàng'}
          >
            {added ? <Check size={16} /> : <ShoppingBag size={16} />}
            <span>{added ? 'Đã thêm vào giỏ' : 'Thêm vào giỏ'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
