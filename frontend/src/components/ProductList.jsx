import ProductCard from './ProductCard';
import ProductSkeleton from './ProductSkeleton';
import { PackageSearch } from 'lucide-react';

/**
 * Component ProductList:
 * - Hiển thị danh sách sản phẩm dạng Grid Responsive:
 *   + Mobile (<640px): 1 cột
 *   + Tablet (>=640px): 2 cột
 *   + PC (>=1024px): 4 cột
 * - Tự động hiển thị Skeleton Loading khi isLoading = true
 * - Hiển thị Empty State khi không có sản phẩm nào
 */
export default function ProductList({ products = [], isLoading = false, skeletonCount = 8 }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <ProductSkeleton count={skeletonCount} />
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center my-6 flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4">
          <PackageSearch size={32} />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-1">
          Không tìm thấy sản phẩm nào
        </h3>
        <p className="text-sm text-slate-500 max-w-md">
          Rất tiếc, hiện tại không có sản phẩm nào phù hợp với bộ lọc hoặc từ khóa tìm kiếm của bạn. Vui lòng thử từ khóa khác.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
