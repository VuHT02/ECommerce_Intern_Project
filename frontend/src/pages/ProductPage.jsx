import { useState } from 'react';
import { Search, Filter, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { useProducts, useCategories } from '../hooks/useProducts';
import ProductList from '../components/ProductList';

/**
 * Trang Danh sách Sản phẩm (ProductPage / ProductList Page):
 * - Grid Responsive theo chuẩn: Mobile 1 cột, Tablet 2 cột, PC 4 cột (thông qua ProductList & Tailwind CSS)
 * - Tích hợp hook `useProducts` để fetch dữ liệu từ Spring Boot backend
 * - Hiển thị Skeleton Loading (hiệu ứng tải mờ) trong lúc chờ API trả về
 * - Tìm kiếm, lọc theo danh mục, sắp xếp và phân trang thông minh
 */
export default function ProductPage() {
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortBy, setSortBy] = useState('newest');

  // Fetch danh sách sản phẩm qua TanStack Query
  const { data, isLoading, isError, error, refetch, isFetching } = useProducts({
    page,
    size: 8,
    keyword,
    categoryId: selectedCategory,
  });

  // Fetch danh mục sản phẩm phục vụ Filter Tab
  const { data: categoriesData } = useCategories();
  const categories = Array.isArray(categoriesData) ? categoriesData : [];

  // Trích xuất mảng sản phẩm từ Page Response của Spring Boot
  const rawProducts = data?.content || (Array.isArray(data) ? data : []);

  // Xử lý sắp xếp ở phía Client nếu cần (hoặc truyền param lên backend)
  const products = [...rawProducts].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    return 0; // Mặc định theo thứ tự backend trả về (thường là mới nhất)
  });

  const totalPages = data?.totalPages || 1;
  const totalElements = data?.totalElements ?? products.length;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setKeyword(searchInput.trim());
    setPage(0);
  };

  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    setPage(0);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header trang */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
              <SlidersHorizontal size={13} />
              Cửa Hàng Trực Tuyến
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Danh Sách Sản Phẩm
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Khám phá các thiết bị công nghệ chính hãng, laptop, smartphone với giá ưu đãi nhất.
            </p>
          </div>

          <div className="text-xs sm:text-sm text-slate-500">
            Hiển thị <span className="font-bold text-slate-800">{products.length}</span> /{' '}
            <span className="font-bold text-slate-800">{totalElements}</span> sản phẩm
          </div>
        </div>

        {/* Thanh công cụ: Tìm kiếm, Danh mục, Sắp xếp */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Form Tìm kiếm */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm laptop, smartphone, thương hiệu..."
                className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Tìm
              </button>
            </form>

            {/* Sắp xếp */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <label htmlFor="sortBy" className="text-xs font-medium text-slate-500 whitespace-nowrap">
                Sắp xếp:
              </label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Mới nhất</option>
                <option value="price-asc">Giá tăng dần</option>
                <option value="price-desc">Giá giảm dần</option>
              </select>
            </div>
          </div>

          {/* Bộ lọc danh mục dạng Tabs/Pills */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-2 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1">
                <Filter size={13} /> Danh mục:
              </span>
              <button
                type="button"
                onClick={() => handleCategoryChange(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  selectedCategory === null
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                Tất cả
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Xử lý Error State */}
        {isError && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle size={28} className="text-rose-500 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-rose-900">Không thể tải dữ liệu sản phẩm</h4>
                <p className="text-xs text-rose-600 mt-0.5">
                  {error?.message || 'Vui lòng kiểm tra lại kết nối mạng hoặc máy chủ backend.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors whitespace-nowrap"
            >
              <RefreshCw size={14} /> Thử lại
            </button>
          </div>
        )}

        {/* Danh sách sản phẩm (Grid: Mobile 1 cột, Tablet 2 cột, PC 4 cột) */}
        <ProductList
          products={products}
          isLoading={isLoading || isFetching}
          skeletonCount={8}
        />

        {/* Thanh Phân trang (Pagination) */}
        {totalPages > 1 && !isLoading && (
          <div className="flex items-center justify-center gap-2 pt-6 pb-12">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 0))}
              disabled={page === 0}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Trang trước"
            >
              <ChevronLeft size={18} />
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setPage(idx)}
                className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                  page === idx
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {idx + 1}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
              disabled={page >= totalPages - 1}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Trang tiếp"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
