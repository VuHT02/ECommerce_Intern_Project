import { apiClient } from './api';

/**
 * Service gọi API liên quan đến Sản phẩm (Product) từ Spring Boot Backend:
 * - getProducts: Lấy danh sách sản phẩm (hỗ trợ phân trang và tìm kiếm)
 * - getProductById: Lấy chi tiết sản phẩm theo ID
 * - getProductBySlug: Lấy chi tiết sản phẩm theo slug SEO
 * - getCategories: Lấy cây danh mục sản phẩm
 */
export const productApi = {
  // 1. Lấy danh sách sản phẩm có phân trang & tìm kiếm
  getProducts: async ({ page = 0, size = 12, keyword = '', categoryId = null, minPrice, maxPrice } = {}) => {
    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('size', size);

    if (keyword) queryParams.append('keyword', keyword);
    if (categoryId) queryParams.append('categoryId', categoryId);
    if (minPrice !== undefined && minPrice !== null) queryParams.append('minPrice', minPrice);
    if (maxPrice !== undefined && maxPrice !== null) queryParams.append('maxPrice', maxPrice);

    const endpoint = keyword || categoryId || minPrice || maxPrice
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

  // 4. Lấy cây danh mục sản phẩm (Menu đa cấp)
  getCategories: async () => {
    const res = await apiClient('/categories');
    return res.data;
  },
};

export default productApi;
