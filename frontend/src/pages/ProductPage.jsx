import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  SlidersHorizontal,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Tag,
  DollarSign,
  Search as SearchIcon,
} from 'lucide-react';
import { useProducts, useCategories } from '../hooks/useProducts';
import ProductList from '../components/ProductList';
import ProductFilterSidebar from '../components/ProductFilterSidebar';
import { formatCurrency } from '../utils/format';

/**
 * Trang Danh Sách Sản Phẩm (ProductPage):
 * - Layout 2 cột: Sidebar Bộ Lọc bên trái & Danh sách sản phẩm bên phải
 * - Đồng bộ hóa toàn bộ tham số lọc lên URL qua `useSearchParams` của React Router
 * - Khi reload trang (F5): Giữ nguyên từ khóa, hãng đã chọn, khoảng giá và phân trang
 * - Hỗ trợ thanh Tag các bộ lọc đang kích hoạt (Active Filter Chips)
 * - Tối ưu cho Mobile với Drawer / Toggle Sidebar
 */
export default function ProductPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Đọc tham số lọc trực tiếp từ URL query params
  const keyword = searchParams.get('keyword') || '';
  const brand = searchParams.get('brand') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const categoryId = searchParams.get('categoryId') || null;
  const sortBy = searchParams.get('sort') || 'newest';
  const page = searchParams.get('page') ? Number(searchParams.get('page')) : 0;

  // Danh sách các thương hiệu đang chọn (dạng mảng)
  const selectedBrands = useMemo(() => {
    return brand ? brand.split(',').filter(Boolean) : [];
  }, [brand]);

  // Fetch danh sách sản phẩm qua TanStack Query theo các tham số từ URL
  const { data, isLoading, isError, error, refetch, isFetching } = useProducts({
    page,
    size: 12,
    keyword,
    brand: selectedBrands.length === 1 ? selectedBrands[0] : '', // Gửi lên backend nếu chọn 1 hãng
    categoryId,
    minPrice: minPrice || undefined,
    maxPrice: maxPrice || undefined,
  });

  // Fetch danh mục phục vụ Tab phân loại
  const { data: categoriesData } = useCategories();
  const categories = Array.isArray(categoriesData) ? categoriesData : [];

  // Trích xuất mảng sản phẩm từ Page Response của Spring Boot
  const rawProducts = data?.content || (Array.isArray(data) ? data : []);

  // Lọc an toàn Client-side nếu người dùng chọn cùng lúc nhiều thương hiệu (Apple + Asus...)
  const filteredProducts = useMemo(() => {
    let list = [...rawProducts];

    if (selectedBrands.length > 1) {
      list = list.filter((p) =>
        selectedBrands.some(
          (b) => p.brand?.toLowerCase() === b.toLowerCase()
        )
      );
    }

    // Sắp xếp
    if (sortBy === 'price-asc') {
      list.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => Number(b.price) - Number(a.price));
    }

    return list;
  }, [rawProducts, selectedBrands, sortBy]);

  const totalPages = data?.totalPages || 1;
  const totalElements = data?.totalElements ?? filteredProducts.length;

  // Cập nhật URL helper
  const updateQueryParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value !== undefined && value !== null && value !== '') {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.delete('page'); // Reset về trang 0 khi thay đổi lọc/sắp xếp
    setSearchParams(next, { replace: true });
  };

  // Chuyển trang (giữ nguyên các query params hiện tại trên URL)
  const handlePageChange = (newPage) => {
    const next = new URLSearchParams(searchParams);
    if (newPage > 0) {
      next.set('page', newPage);
    } else {
      next.delete('page');
    }
    setSearchParams(next, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Xóa từng bộ lọc cụ thể (Filter Chips)
  const handleRemoveBrand = (brandToRemove) => {
    const next = selectedBrands.filter((b) => b !== brandToRemove);
    updateQueryParam('brand', next.join(','));
  };

  const handleRemoveKeyword = () => updateQueryParam('keyword', '');
  const handleRemovePrice = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('minPrice');
    next.delete('maxPrice');
    next.delete('page');
    setSearchParams(next, { replace: true });
  };
  const handleRemoveCategory = () => updateQueryParam('categoryId', '');

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER TRANG */}
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
              Khám phá máy tính xách tay, điện thoại và thiết bị công nghệ chính hãng với giá tốt nhất.
            </p>
          </div>

          {/* Nút mở bộ lọc trên Mobile */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <Filter size={15} className="text-blue-600" />
              <span>Bộ lọc & Tìm kiếm</span>
              {(keyword || selectedBrands.length > 0 || minPrice || maxPrice) && (
                <span className="w-2 h-2 rounded-full bg-blue-600" />
              )}
            </button>

            <div className="text-xs sm:text-sm text-slate-500">
              Tìm thấy <strong className="text-slate-800">{filteredProducts.length}</strong> /{' '}
              <strong className="text-slate-800">{totalElements}</strong> sản phẩm
            </div>
          </div>
        </div>

        {/* THANH DANH MỤC NHANH (TABS) */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => updateQueryParam('categoryId', '')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                !categoryId
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              Tất cả danh mục
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => updateQueryParam('categoryId', String(cat.id))}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  categoryId === String(cat.id)
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* LAYOUT CHÍNH: SIDEBAR TRÁI + GRID SẢN PHẨM PHẢI */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* 1. SIDEBAR BỘ LỌC (DESKTOP) */}
          <div className="hidden lg:block w-72 flex-shrink-0 sticky top-24">
            <ProductFilterSidebar />
          </div>

          {/* 1.1. MODAL DRAWER BỘ LỌC CHO MOBILE / TABLET */}
          {mobileFilterOpen && (
            <div className="fixed inset-0 z-50 flex lg:hidden">
              <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={() => setMobileFilterOpen(false)}
              />
              <div className="relative ml-auto w-full max-w-xs h-full bg-white p-6 shadow-2xl overflow-y-auto">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                  <h3 className="font-extrabold text-slate-900 text-base">Bộ Lọc & Tìm Kiếm</h3>
                  <button
                    type="button"
                    onClick={() => setMobileFilterOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                  >
                    <X size={18} />
                  </button>
                </div>
                <ProductFilterSidebar onCloseMobile={() => setMobileFilterOpen(false)} />
              </div>
            </div>
          )}

          {/* 2. CỘT CHÍNH: THANH CÔNG CỤ + FILTER CHIPS + GRID SẢN PHẨM */}
          <div className="flex-1 min-w-0 w-full space-y-4">
            {/* Toolbar: Sắp xếp */}
            <div className="bg-white rounded-2xl border border-slate-100 p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3">
              {/* Chips hiển thị các bộ lọc đang kích hoạt */}
              <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                <span className="text-xs text-slate-400 font-medium mr-1">Bộ lọc:</span>

                {/* Chip Từ khóa */}
                {keyword && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-lg border border-blue-200">
                    <SearchIcon size={11} />
                    <span>"{keyword}"</span>
                    <button
                      type="button"
                      onClick={handleRemoveKeyword}
                      className="hover:text-rose-600 ml-0.5"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}

                {/* Chips Hãng */}
                {selectedBrands.map((b) => (
                  <span
                    key={b}
                    className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-lg border border-indigo-200"
                  >
                    <Tag size={11} />
                    <span>{b}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBrand(b)}
                      className="hover:text-rose-600 ml-0.5"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}

                {/* Chip Khoảng giá */}
                {(minPrice || maxPrice) && (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-lg border border-emerald-200">
                    <DollarSign size={11} />
                    <span>
                      {minPrice ? formatCurrency(minPrice) : '0₫'} -{' '}
                      {maxPrice ? formatCurrency(maxPrice) : 'Không giới hạn'}
                    </span>
                    <button
                      type="button"
                      onClick={handleRemovePrice}
                      className="hover:text-rose-600 ml-0.5"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}

                {/* Không có bộ lọc nào */}
                {!keyword && selectedBrands.length === 0 && !minPrice && !maxPrice && (
                  <span className="text-xs text-slate-400 italic">Mặc định</span>
                )}
              </div>

              {/* Sắp xếp */}
              <div className="flex items-center gap-2">
                <label htmlFor="sortBySelect" className="text-xs font-medium text-slate-500 whitespace-nowrap">
                  Sắp xếp:
                </label>
                <select
                  id="sortBySelect"
                  value={sortBy}
                  onChange={(e) => updateQueryParam('sort', e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="price-asc">Giá tăng dần</option>
                  <option value="price-desc">Giá giảm dần</option>
                </select>
              </div>
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
                  type="button"
                  onClick={() => refetch()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors whitespace-nowrap"
                >
                  <RefreshCw size={14} /> Thử lại
                </button>
              </div>
            )}

            {/* DANH SÁCH SẢN PHẨM (GRID RESPONSIVE 1 CỘT MOBILE, 2 CỘT TABLET, 3-4 CỘT PC) */}
            <ProductList
              products={filteredProducts}
              isLoading={isLoading || isFetching}
              skeletonCount={8}
              gridClassName="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6"
            />

            {/* PHÂN TRANG (PAGINATION) */}
            {totalPages > 1 && !isLoading && (
              <div className="flex items-center justify-center gap-2 pt-8 pb-12">
                <button
                  type="button"
                  onClick={() => handlePageChange(Math.max(page - 1, 0))}
                  disabled={page === 0}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Trang trước"
                >
                  <ChevronLeft size={18} />
                </button>

                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePageChange(idx)}
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
                  type="button"
                  onClick={() => handlePageChange(Math.min(page + 1, totalPages - 1))}
                  disabled={page >= totalPages - 1}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Trang tiếp"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
