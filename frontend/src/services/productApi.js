import { apiClient } from './api';

/**
 * Service gọi API liên quan đến Sản phẩm (Product) từ Spring Boot Backend:
 * - getProducts: Lấy danh sách sản phẩm (hỗ trợ phân trang và tìm kiếm)
 * - getProductById: Lấy chi tiết sản phẩm theo ID
 * - getProductBySlug: Lấy chi tiết sản phẩm theo slug SEO
 * - getCategories: Lấy cây danh mục sản phẩm
 */
export const productApi = {
  // 1. Lấy danh sách sản phẩm có phân trang, tìm kiếm & sắp xếp
  getProducts: async ({
    page = 0,
    size = 12,
    keyword = '',
    brand = '',
    categoryName = '',
    categoryId = null,
    minPrice,
    maxPrice,
    sortBy = 'createdAt',
    sortDir = 'desc',
  } = {}) => {
    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('size', size);

    if (keyword) queryParams.append('keyword', keyword);
    if (brand) queryParams.append('brand', brand);
    if (categoryName) queryParams.append('categoryName', categoryName);
    if (categoryId) queryParams.append('categoryId', categoryId);
    if (minPrice !== undefined && minPrice !== null && minPrice !== '') queryParams.append('minPrice', minPrice);
    if (maxPrice !== undefined && maxPrice !== null && maxPrice !== '') queryParams.append('maxPrice', maxPrice);
    if (sortBy) queryParams.append('sortBy', sortBy);
    if (sortDir) queryParams.append('sortDir', sortDir);

    const hasFilters = keyword || brand || categoryName || categoryId || (minPrice !== undefined && minPrice !== null && minPrice !== '') || (maxPrice !== undefined && maxPrice !== null && maxPrice !== '');
    const endpoint = hasFilters
      ? `/products/search?${queryParams.toString()}`
      : `/products?${queryParams.toString()}`;

    const res = await apiClient(endpoint);
    return res.data; // Page<ProductResponse> từ Spring Boot
  },

  // 2. Lấy thông tin chi tiết sản phẩm theo ID
  getProductById: async (id) => {
    const res = await apiClient(`/products/${id}`);
    return res.data;
  },

  // 3. Lấy thông tin chi tiết sản phẩm theo Slug SEO
  getProductBySlug: async (slug) => {
    const res = await apiClient(`/products/slug/${slug}`);
    return res.data;
  },

  // 4. Lấy danh mục lọc cửa hàng: Laptop, Điện thoại, Máy tính bảng, Phụ kiện
  getCategories: async () => {
    try {
      const shop = await apiClient('/categories/shop');
      if (Array.isArray(shop.data) && shop.data.length > 0) {
        return shop.data;
      }
    } catch {
      // Fallback danh sách phẳng nếu backend chưa có /shop
    }
    const res = await apiClient('/categories/all');
    return res.data;
  },

  // 5. Lấy cây danh mục đa cấp (menu)
  getCategoryTree: async () => {
    const res = await apiClient('/categories');
    return res.data;
  },
};

export default productApi;
