import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, RotateCcw, DollarSign, Tag, Check, X, ArrowRight } from 'lucide-react';

/**
 * Danh sách thương hiệu công nghệ phổ biến
 */
const AVAILABLE_BRANDS = [
  { id: 'Apple', name: 'Apple' },
  { id: 'Asus', name: 'ASUS' },
  { id: 'Dell', name: 'Dell' },
  { id: 'Lenovo', name: 'Lenovo' },
  { id: 'HP', name: 'HP' },
  { id: 'Samsung', name: 'Samsung' },
];

/**
 * Các khoảng giá gợi ý phổ biến (VND)
 */
const QUICK_PRICE_RANGES = [
  { label: 'Dưới 15 triệu', min: '', max: '15000000' },
  { label: '15 - 25 triệu', min: '15000000', max: '25000000' },
  { label: '25 - 40 triệu', min: '25000000', max: '40000000' },
  { label: 'Trên 40 triệu', min: '40000000', max: '' },
];

/**
 * Component Sidebar Bộ lọc & Tìm kiếm cao cấp (ProductFilterSidebar):
 * - Tìm kiếm theo tên sản phẩm mượt mà
 * - Checkbox thương hiệu phong cách hiện đại
 * - Khoảng giá tự nhập và chọn nhanh linh hoạt
 * - Đồng bộ 2 chiều với URL React Router
 */
export default function ProductFilterSidebar({ onCloseMobile }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlKeyword = searchParams.get('keyword') || '';
  const urlBrand = searchParams.get('brand') || '';
  const urlMinPrice = searchParams.get('minPrice') || '';
  const urlMaxPrice = searchParams.get('maxPrice') || '';

  const [keywordInput, setKeywordInput] = useState(urlKeyword);
  const [minPriceInput, setMinPriceInput] = useState(urlMinPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(urlMaxPrice);

  const selectedBrands = urlBrand ? urlBrand.split(',').filter(Boolean) : [];

  useEffect(() => {
    setKeywordInput(urlKeyword);
    setMinPriceInput(urlMinPrice);
    setMaxPriceInput(urlMaxPrice);
  }, [urlKeyword, urlMinPrice, urlMaxPrice]);

  const updateUrlParams = (updates) => {
    const nextParams = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        nextParams.set(key, value);
      } else {
        nextParams.delete(key);
      }
    });

    nextParams.delete('page');
    setSearchParams(nextParams, { replace: true });
  };

  const handleKeywordSubmit = (e) => {
    e.preventDefault();
    updateUrlParams({ keyword: keywordInput.trim() });
    if (onCloseMobile) onCloseMobile();
  };

  const handleClearKeyword = () => {
    setKeywordInput('');
    updateUrlParams({ keyword: '' });
  };

  const handleBrandToggle = (brandName) => {
    let nextBrands;
    if (selectedBrands.includes(brandName)) {
      nextBrands = selectedBrands.filter((b) => b !== brandName);
    } else {
      nextBrands = [...selectedBrands, brandName];
    }
    updateUrlParams({ brand: nextBrands.join(',') });
  };

  const handlePriceApply = (e) => {
    e.preventDefault();
    updateUrlParams({
      minPrice: minPriceInput.trim(),
      maxPrice: maxPriceInput.trim(),
    });
    if (onCloseMobile) onCloseMobile();
  };

  const handleQuickPriceClick = (min, max) => {
    setMinPriceInput(min);
    setMaxPriceInput(max);
    updateUrlParams({ minPrice: min, maxPrice: max });
    if (onCloseMobile) onCloseMobile();
  };

  const handleResetFilters = () => {
    setKeywordInput('');
    setMinPriceInput('');
    setMaxPriceInput('');
    const nextParams = new URLSearchParams();
    const cat = searchParams.get('categoryId');
    if (cat) nextParams.set('categoryId', cat);
    const sort = searchParams.get('sort');
    if (sort) nextParams.set('sort', sort);

    setSearchParams(nextParams, { replace: true });
    if (onCloseMobile) onCloseMobile();
  };

  const activeFiltersCount =
    (urlKeyword ? 1 : 0) +
    selectedBrands.length +
    (urlMinPrice ? 1 : 0) +
    (urlMaxPrice ? 1 : 0);

  return (
    <aside className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-5">
      {/* ── TIÊU ĐỀ & RESET ── */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Filter size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Bộ lọc tìm kiếm</h3>
            {activeFiltersCount > 0 && (
              <span className="text-[11px] font-medium text-blue-600">
                Đang áp dụng: {activeFiltersCount} bộ lọc
              </span>
            )}
          </div>
        </div>

        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors"
            title="Đặt lại toàn bộ lọc"
          >
            <RotateCcw size={12} />
            <span>Xóa lọc</span>
          </button>
        )}
      </div>

      {/* ── 1. TÌM KIẾM THEO TÊN ── */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <Search size={13} className="text-slate-400" />
          Tìm theo tên sản phẩm
        </label>
        <form onSubmit={handleKeywordSubmit} className="relative flex items-center">
          <input
            type="text"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            placeholder="Nhập tên laptop, điện thoại..."
            className="w-full pl-3 pr-16 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          {keywordInput && (
            <button
              type="button"
              onClick={handleClearKeyword}
              className="absolute right-12 p-1 text-slate-400 hover:text-slate-600"
              title="Xóa từ khóa"
            >
              <X size={13} />
            </button>
          )}
          <button
            type="submit"
            className="absolute right-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
          >
            Tìm
          </button>
        </form>
      </div>

      {/* ── 2. CHỌN THƯƠNG HIỆU ── */}
      <div className="space-y-2.5 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Tag size={13} className="text-slate-400" />
            Thương hiệu
          </label>
          {selectedBrands.length > 0 && (
            <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
              {selectedBrands.length} đã chọn
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {AVAILABLE_BRANDS.map((brand) => {
            const isChecked = selectedBrands.includes(brand.id);
            return (
              <button
                key={brand.id}
                type="button"
                onClick={() => handleBrandToggle(brand.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                  isChecked
                    ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <span>{brand.name}</span>
                {isChecked ? (
                  <Check size={13} className="text-blue-600" strokeWidth={3} />
                ) : (
                  <span className="w-3.5 h-3.5 rounded border border-slate-300 bg-slate-50" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. KHOẢNG GIÁ ── */}
      <div className="space-y-3 pt-3 border-t border-slate-100">
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <DollarSign size={13} className="text-slate-400" />
          Khoảng giá (VNĐ)
        </label>

        {/* Mức giá gợi ý */}
        <div className="grid grid-cols-2 gap-1.5">
          {QUICK_PRICE_RANGES.map((range, idx) => {
            const isRangeActive =
              urlMinPrice === range.min && urlMaxPrice === range.max;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickPriceClick(range.min, range.max)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all text-center truncate ${
                  isRangeActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-semibold'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                {range.label}
              </button>
            );
          })}
        </div>

        {/* Nhập khoảng giá Min - Max */}
        <form onSubmit={handlePriceApply} className="space-y-2 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-slate-500 font-medium block mb-1">Từ (₫)</span>
              <input
                type="number"
                min="0"
                step="500000"
                value={minPriceInput}
                onChange={(e) => setMinPriceInput(e.target.value)}
                placeholder="0"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-medium block mb-1">Đến (₫)</span>
              <input
                type="number"
                min="0"
                step="500000"
                value={maxPriceInput}
                onChange={(e) => setMaxPriceInput(e.target.value)}
                placeholder="50,000,000"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-slate-900 hover:bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 mt-2"
          >
            <span>Áp dụng mức giá</span>
            <ArrowRight size={13} />
          </button>
        </form>
      </div>
    </aside>
  );
}
