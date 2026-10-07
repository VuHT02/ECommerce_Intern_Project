import { useQuery } from '@tanstack/react-query';
import { productApi } from '../services/productApi';

/**
 * Custom Hook useProducts bọc TanStack Query:
 * - Tự động quản lý Loading State, Error State, Caching dữ liệu
 * - Giảm thiểu việc gọi lại API thừa khi chuyển tab hoặc re-render
 * - Trả về dữ liệu chuẩn hóa dễ dàng sử dụng trong Component
 */
export const useProducts = (params = {}) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productApi.getProducts(params),
    placeholderData: (previousData) => previousData, // Giữ dữ liệu cũ khi đổi trang (tránh giật layout)
  });
};

/**
 * Custom Hook lấy chi tiết sản phẩm theo ID
 */
export const useProductDetail = (productId) => {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: () => productApi.getProductById(productId),
    enabled: !!productId, // Chỉ fetch khi có productId hợp lệ
  });
};

/**
 * Custom Hook lấy danh mục sản phẩm phục vụ Navbar / Filter Sidebar
 */
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => productApi.getCategories(),
    staleTime: 1000 * 60 * 30, // Danh mục ít thay đổi -> Cache 30 phút
  });
};

export default useProducts;
