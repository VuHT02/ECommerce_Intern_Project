const LAPTOP_SUBTYPE = /van-phong|van phong|gaming|do-hoa|do hoa|đồ họa/;

function slugOf(cat) {
  return (cat?.slug || '').toLowerCase();
}

function nameOf(cat) {
  return (cat?.name || '').toLowerCase();
}

export function isLaptopSubtypeCategory(cat) {
  const haystack = `${slugOf(cat)} ${nameOf(cat)}`;
  return /laptop/.test(haystack) && LAPTOP_SUBTYPE.test(haystack);
}

export function isElectronicsRootCategory(cat) {
  const slug = slugOf(cat);
  const name = nameOf(cat);
  return slug === 'dien-tu' || slug.includes('electronic') || name.includes('thiết bị điện tử');
}

function shopOrder(cat) {
  const slug = slugOf(cat);
  const name = nameOf(cat);
  if (slug === 'laptop' || slug === 'may-tinh-laptop' || slug === 'may-tinh' || name === 'laptop') return 1;
  if (slug.includes('dien-thoai') || slug.includes('phone') || name.includes('điện thoại') || name.includes('dien thoai')) return 2;
  if (slug.includes('may-tinh-bang') || slug.includes('tablet') || name.includes('máy tính bảng') || name.includes('tablet')) return 3;
  if (slug.includes('phu-kien') || slug.includes('accessor') || name.includes('phụ kiện') || name.includes('phu kien')) return 4;
  return 90;
}

/**
 * Tab lọc cửa hàng: Laptop, Điện thoại, Máy tính bảng, Phụ kiện.
 * Ẩn các nhánh con laptop văn phòng / gaming / đồ họa.
 */
export function getShopFilterCategories(categories) {
  const all = Array.isArray(categories) ? categories : [];
  const seen = new Set();
  const mains = all
    .filter((cat) => !isLaptopSubtypeCategory(cat) && !isElectronicsRootCategory(cat) && shopOrder(cat) < 90)
    .sort((a, b) => shopOrder(a) - shopOrder(b))
    .filter((cat) => {
      const order = shopOrder(cat);
      if (seen.has(order)) return false;
      seen.add(order);
      return true;
    });

  if (mains.length >= 3) return mains;

  return all.filter((cat) => !isLaptopSubtypeCategory(cat) && !isElectronicsRootCategory(cat));
}
