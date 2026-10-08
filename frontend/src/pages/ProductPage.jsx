import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Tag,
  DollarSign,
  Search as SearchIcon,
  Sparkles,
} from 'lucide-react';
import { useProducts, useCategories } from '../hooks/useProducts';
import ProductList from '../components/ProductList';
import ProductFilterSidebar from '../components/ProductFilterSidebar';
import { formatCurrency } from '../utils/format';
import { repairVietnameseLabel } from '../utils/vietnameseText';
import { getShopFilterCategories } from '../utils/categoryTabs';

/**
 * Trang Danh Sách Sản Phẩm (ProductPage) đẳng cấp:
 * - Layout 2 cột: Sidebar Bộ Lọc bên trái & Danh sách sản phẩm bên phải
 * - Đồng bộ hóa toàn bộ tham số lọc lên URL qua `useSearchParams` của React Router
 * - Khi reload trang (F5): Giữ nguyên từ khóa, hãng đã chọn, khoảng giá và phân trang
 * - Hỗ trợ thanh Tag các bộ lọc đang kích hoạt (Active Filter Chips)
 * - Tối ưu cho Mobile với Drawer Bộ Lọc
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

  // Chuẩn hóa tham số sắp xếp gửi lên Server API
  const apiSortBy = sortBy === 'price-asc' || sortBy === 'price-desc' ? 'price' : 'createdAt';
  const apiSortDir = sortBy === 'price-asc' ? 'asc' : 'desc';

  // Fetch danh sách sản phẩm qua TanStack Query theo các tham số từ URL
  const { data, isLoading, isError, error, refetch, isFetching } = useProducts({
    page,
    size: 12,
    keyword,
    brand: selectedBrands.length === 1 ? selectedBrands[0] : '',
    categoryId: categoryId ? Number(categoryId) : null,
    minPrice: minPrice || undefined,
    maxPrice: maxPrice || undefined,
    sortBy: apiSortBy,
    sortDir: apiSortDir,
  });

  // Tab lọc: Laptop, Điện thoại, Máy tính bảng, Phụ kiện (không dùng nhánh laptop con)
  const { data: categoriesData } = useCategories();
  const categories = useMemo(
    () => getShopFilterCategories(categoriesData),
    [categoriesData]
  );

  // Trích xuất mảng sản phẩm từ Page Response của Spring Boot
  const rawProducts = useMemo(
    () => data?.content || (Array.isArray(data) ? data : []),
    [data]
  );

  // Lọc an toàn Client-side nếu người dùng chọn cùng lúc nhiều thương hiệu (Apple + Asus...)
  // Thứ tự sắp xếp giữ nguyên 100% từ Server để đảm bảo tính đồng bộ qua tất cả các trang
  const filteredProducts = useMemo(() => {
    let list = [...rawProducts];

    if (selectedBrands.length > 1) {
      list = list.filter((p) =>
        selectedBrands.some(
          (b) => p.brand?.toLowerCase() === b.toLowerCase()
        )
      );
    }

    return list;
  }, [rawProducts, selectedBrands]);

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
    next.delete('page'); // Reset về trang 0 khi thay đổi lọc
    setSearchParams(next, { replace: true });
  };

  // Chuyển trang
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

  useEffect(() => {
    if (categories.length === 0 || !categoryId) return;
    const visible = categories.some((cat) => String(cat.id) === String(categoryId));
    if (!visible) {
      updateQueryParam('categoryId', '');
    }
  }, [categories, categoryId]);

  useEffect(() => {
    if (!data || isLoading) return;
    const loadedPages = data.totalPages ?? 1;
    if (page > 0 && page >= loadedPages) {
      handlePageChange(0);
    }
  }, [data, isLoading, page]);

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

  return (
    <div className="min-h-screen bg-slate-50/60 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── HEADER KHÔNG GIAN SẢN PHẨM ── */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-3">
              <Sparkles size={13} />
              <span>Sản phẩm chính hãng</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Khám Phá Thiết Bị Công Nghệ
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 max-w-2xl">
              Danh mục máy tính xách tay, điện thoại và phụ kiện chính hãng kèm bảo hành 24 tháng toàn quốc.
            </p>
          </div>

          {/* Nút lọc Mobile + Đếm số lượng */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              <Filter size={14} />
              <span>Bộ lọc</span>
              {(keyword || selectedBrands.length > 0 || minPrice || maxPrice) && (
                <span className="w-2 h-2 rounded-full bg-blue-400" />
              )}
            </button>

            <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-600">
              Hiển thị <strong className="text-slate-900">{filteredProducts.length}</strong> /{' '}
              <strong className="text-slate-900">{totalElements}</strong> sản phẩm
            </div>
          </div>
        </div>

        {/* ── TABS DANH MỤC NHANH ── */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => updateQueryParam('categoryId', '')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                !categoryId
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              Tất cả danh mục
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => updateQueryParam('categoryId', String(cat.id))}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  categoryId === String(cat.id)
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {repairVietnameseLabel(cat.name)}
              </button>
            ))}
          </div>
        )}

        {/* ── BỐ CỤC CHÍNH: 2 CỘT ── */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Cột 1: Sidebar lọc Desktop */}
          <div className="hidden lg:block w-72 shrink-0 sticky top-24">
            <ProductFilterSidebar />
          </div>

          {/* Drawer Lọc Mobile */}
          {mobileFilterOpen && (
            <div className="fixed inset-0 z-50 flex lg:hidden">
              <div
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
                onClick={() => setMobileFilterOpen(false)}
              />
              <div className="relative ml-auto w-full max-w-xs h-full bg-white p-5 shadow-2xl overflow-y-auto">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
                  <h3 className="font-bold text-slate-900 text-base">Bộ Lọc Tìm Kiếm</h3>
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

          {/* Cột 2: Danh sách sản phẩm & Toolbar */}
          <div className="flex-1 min-w-0 w-full space-y-4">
            {/* Toolbar: Filter chips & Sắp xếp */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
              {/* Chips bộ lọc kích hoạt */}
              <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                <span className="text-xs text-slate-400 font-medium mr-1">Bộ lọc:</span>

                {keyword && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-lg border border-blue-200">
                    <SearchIcon size={11} />
                    <span>"{keyword}"</span>
                    <button
                      type="button"
                      onClick={handleRemoveKeyword}
                      className="hover:text-rose-600 ml-1"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}

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
                      className="hover:text-rose-600 ml-1"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}

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
                      className="hover:text-rose-600 ml-1"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}

                {!keyword && selectedBrands.length === 0 && !minPrice && !maxPrice && (
                  <span className="text-xs text-slate-400 italic">Tất cả sản phẩm</span>
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

            {/* Thông báo lỗi */}
            {isError && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertCircle size={24} className="text-rose-500 shrink-0" />
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
                  <RefreshCw size={13} /> Thử lại
                </button>
              </div>
            )}

            {/* Danh sách sản phẩm dạng Grid */}
            <ProductList
              products={filteredProducts}
              isLoading={isLoading || isFetching}
              skeletonCount={8}
              gridClassName="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5"
            />

            {/* Phân trang */}
            {totalPages > 1 && !isLoading && (
              <div className="flex items-center justify-center gap-1.5 pt-6 pb-10">
                <button
                  type="button"
                  onClick={() => handlePageChange(Math.max(page - 1, 0))}
                  disabled={page === 0}
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Trang trước"
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePageChange(idx)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                      page === idx
                        ? 'bg-blue-600 text-white shadow-sm'
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
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Trang tiếp"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
