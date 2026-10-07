/**
 * Product Image Utilities
 * Quản lý ảnh sản phẩm: kiểm tra URL hợp lệ, fallback thông minh theo brand/category.
 */

// ── Ảnh fallback theo loại sản phẩm (Unsplash URLs đã được xác minh hoạt động) ──
const IMG_IPHONE =
  'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80';
const IMG_PHONE =
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80';
const IMG_SAMSUNG =
  'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&q=80';
const IMG_MACBOOK =
  'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80';
const IMG_LAPTOP =
  'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80';
const IMG_TABLET =
  'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80';
const IMG_ACCESSORY =
  'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&q=80';

// Các fragment URL Unsplash đã chết hoặc trả 404
const DEAD_FRAGMENTS = [
  'photo-1695048133142',
  'photo-1598327105666-5b89351aff97',
  'photo-1696426045030-e98e8aef3dcf',  // iPhone 15 bị 404
  'photo-1542751110-97427bbecfd7',       // Xiaomi cũ bị 404
];

/**
 * Kiểm tra URL ảnh có hợp lệ không.
 * Trả true nếu URL null/rỗng/thuộc blacklist chết.
 */
export function isUnusableImageUrl(url) {
  if (!url || typeof url !== 'string' || !url.trim()) return true;
  const lower = url.toLowerCase();
  return DEAD_FRAGMENTS.some((fragment) => lower.includes(fragment));
}

/**
 * Lấy URL ảnh sản phẩm — ưu tiên imageUrl gốc, fallback thông minh nếu hỏng.
 */
export function getProductImageUrl(product) {
  if (product?.imageUrl && !isUnusableImageUrl(product.imageUrl)) {
    return product.imageUrl;
  }
  return getFallbackProductImage(product);
}

/**
 * Chọn ảnh fallback phù hợp nhất dựa trên brand, tên SP, slug và category.
 */
export function getFallbackProductImage(product) {
  const brand = (product?.brand || '').toLowerCase();
  const name = `${product?.name || ''} ${product?.slug || ''} ${product?.categoryName || ''}`.toLowerCase();
  const isPhone = /iphone|galaxy|xiaomi|phone|thoại|thoai|dien-thoai/.test(name);
  const isLaptop = /macbook|laptop|thinkpad|xps|zephyrus|máy tính|may tinh|rog|tuf|katana|loq|proart|spectre/.test(name);
  const isTablet = /ipad|tab|tablet|bảng|bang|may-tinh-bang/.test(name);
  const isAccessory = /airpods|buds|pod|tai nghe|phụ kiện|phu-kien|accessory|earphone/.test(name);

  // Accessories
  if (isAccessory) return IMG_ACCESSORY;

  // Tablets
  if (isTablet) {
    if (brand.includes('apple')) return IMG_TABLET;
    return IMG_TABLET;
  }

  // Phones
  if (brand.includes('apple') && (isPhone || name.includes('iphone'))) return IMG_IPHONE;
  if (brand.includes('samsung') && isPhone) return IMG_SAMSUNG;
  if (brand.includes('xiaomi') || (isPhone && !isLaptop)) return IMG_PHONE;
  if (isPhone) return IMG_PHONE;

  // Laptops
  if (brand.includes('apple') && isLaptop) return IMG_MACBOOK;
  if (isLaptop) return IMG_LAPTOP;

  // Default
  return IMG_LAPTOP;
}
