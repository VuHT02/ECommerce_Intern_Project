import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, RotateCcw, DollarSign, Tag, Check, X } from 'lucide-react';

/**
 * Danh sách thương hiệu công nghệ phổ biến
 */
const AVAILABLE_BRANDS = [
  { id: 'Apple', name: 'Apple' },
  { id: 'Asus', name: 'Asus' },
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
 * Component Sidebar Bộ lọc & Tìm kiếm (ProductFilterSidebar):
 * - Tìm kiếm theo tên sản phẩm
 * - Checkbox chọn hãng (Apple, Asus, Dell...)
 * - Nhập khoảng giá (Min - Max) và gợi ý mức giá
 * - Đồng bộ hóa 2 chiều với URL qua `useSearchParams`
 */
export default function ProductFilterSidebar({ onCloseMobile }) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Đọc giá trị từ URL khi component mount hoặc khi URL thay đổi (F5 reload)
  const urlKeyword = searchParams.get('keyword') || '';
  const urlBrand = searchParams.get('brand') || '';
  const urlMinPrice = searchParams.get('minPrice') || '';
  const urlMaxPrice = searchParams.get('maxPrice') || '';

  // Local state cho các input
  const [keywordInput, setKeywordInput] = useState(urlKeyword);
  const [minPriceInput, setMinPriceInput] = useState(urlMinPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(urlMaxPrice);

  // Danh sách các thương hiệu đang chọn (hỗ trợ nhiều hãng cách nhau bằng dấu phẩy)
  const selectedBrands = urlBrand ? urlBrand.split(',').filter(Boolean) : [];

  // Đồng bộ local input khi searchParams trên URL thay đổi (ví dụ user ấn Back/Forward hoặc reload)
  useEffect(() => {
    setKeywordInput(urlKeyword);
    setMinPriceInput(urlMinPrice);
    setMaxPriceInput(urlMaxPrice);
  }, [urlKeyword, urlMinPrice, urlMaxPrice]);

  // Cập nhật tham số lên URL (giữ nguyên các query params khác, reset về page 0)
  const updateUrlParams = (updates) => {
    const nextParams = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        nextParams.set(key, value);
      } else {
        nextParams.delete(key);
      }
    });

    // Mỗi khi thay đổi bộ lọc, luôn đưa về trang đầu tiên (page=0)
    nextParams.delete('page');

    setSearchParams(nextParams, { replace: true });
  };

  // 1. Xử lý tìm kiếm tên
  const handleKeywordSubmit = (e) => {
    e.preventDefault();
    updateUrlParams({ keyword: keywordInput.trim() });
    if (onCloseMobile) onCloseMobile();
  };

  const handleClearKeyword = () => {
    setKeywordInput('');
    updateUrlParams({ keyword: '' });
  };

  // 2. Xử lý checkbox chọn hãng (Apple, Asus, Dell...)
  const handleBrandToggle = (brandName) => {
    let nextBrands;
    if (selectedBrands.includes(brandName)) {
      nextBrands = selectedBrands.filter((b) => b !== brandName);
    } else {
      nextBrands = [...selectedBrands, brandName];
    }

    updateUrlParams({ brand: nextBrands.join(',') });
  };

  // 3. Xử lý khoảng giá
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

  // 4. Xóa tất cả bộ lọc
  const handleResetFilters = () => {
    setKeywordInput('');
    setMinPriceInput('');
    setMaxPriceInput('');
    const nextParams = new URLSearchParams();
    // Giữ lại category nếu có
    const cat = searchParams.get('categoryId') || searchParams.get('categoryName');
    if (cat) {
      if (searchParams.get('categoryId')) nextParams.set('categoryId', searchParams.get('categoryId'));
      if (searchParams.get('categoryName')) nextParams.set('categoryName', searchParams.get('categoryName'));
    }
    const sort = searchParams.get('sort');
    if (sort) nextParams.set('sort', sort);

    setSearchParams(nextParams, { replace: true });
    if (onCloseMobile) onCloseMobile();
  };

  // Đếm số lượng bộ lọc đang kích hoạt
  const activeFiltersCount =
    (urlKeyword ? 1 : 0) +
    selectedBrands.length +
    (urlMinPrice ? 1 : 0) +
    (urlMaxPrice ? 1 : 0);

  return (
    <aside className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
      {/* Tiêu đề & Nút Reset */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <Filter size={18} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Bộ Lọc Tìm Kiếm</h3>
            {activeFiltersCount > 0 && (
              <span className="text-[11px] font-semibold text-blue-600">
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
            title="Đặt lại toàn bộ bộ lọc"
          >
            <RotateCcw size={13} />
            <span>Xóa lọc</span>
          </button>
        )}
      </div>

      {/* 1. Ô TÌM KIẾM TÊN SẢN PHẨM */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Search size={14} className="text-slate-400" />
          Tìm theo tên
        </label>
        <form onSubmit={handleKeywordSubmit} className="relative">
          <input
            type="text"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            placeholder="Nhập tên sản phẩm..."
            className="w-full pl-3.5 pr-16 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          {keywordInput && (
            <button
              type="button"
              onClick={handleClearKeyword}
              className="absolute right-10 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              title="Xóa từ khóa"
            >
              <X size={14} />
            </button>
          )}
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 bottom-1.5 px-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Tìm
          </button>
        </form>
      </div>

      {/* 2. CHECKBOX CHỌN HÃNG (Apple, Asus, Dell...) */}
      <div className="space-y-3 pt-3 border-t border-slate-100">
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Tag size={14} className="text-slate-400" />
            Thương hiệu
          </span>
          {selectedBrands.length > 0 && (
            <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
              {selectedBrands.length} chọn
            </span>
          )}
        </label>

        <div className="space-y-2.5">
          {AVAILABLE_BRANDS.map((brand) => {
            const isChecked = selectedBrands.includes(brand.id);
            return (
              <label
                key={brand.id}
                className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs sm:text-sm cursor-pointer select-none transition-all ${
                  isChecked
                    ? 'bg-blue-50/70 border-blue-500 font-bold text-blue-900 shadow-sm'
                    : 'bg-slate-50/60 border-slate-100 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleBrandToggle(brand.id)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer"
                  />
                  <span>{brand.name}</span>
                </div>
                {isChecked && <Check size={14} className="text-blue-600" strokeWidth={2.5} />}
              </label>
            );
          })}
        </div>
      </div>

      {/* 3. INPUT NHẬP KHOẢNG GIÁ (MIN - MAX) */}
      <div className="space-y-3 pt-3 border-t border-slate-100">
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <DollarSign size={14} className="text-slate-400" />
          Khoảng giá (VNĐ)
        </label>

        {/* Các nút chọn nhanh mức giá */}
        <div className="grid grid-cols-2 gap-2">
          {QUICK_PRICE_RANGES.map((range, idx) => {
            const isRangeActive =
              urlMinPrice === range.min && urlMaxPrice === range.max;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickPriceClick(range.min, range.max)}
                className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition-all truncate text-center ${
                  isRangeActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                {range.label}
              </button>
            );
          })}
        </div>

        {/* Form nhập Min - Max thủ công */}
        <form onSubmit={handlePriceApply} className="space-y-2 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block mb-1">
                Từ (VNĐ)
              </span>
              <input
                type="number"
                min="0"
                step="500000"
                value={minPriceInput}
                onChange={(e) => setMinPriceInput(e.target.value)}
                placeholder="0"
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block mb-1">
                Đến (VNĐ)
              </span>
              <input
                type="number"
                min="0"
                step="500000"
                value={maxPriceInput}
                onChange={(e) => setMaxPriceInput(e.target.value)}
                placeholder="Ví dụ: 30000000"
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-2.5 bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
          >
            <Check size={14} />
            <span>Áp dụng khoảng giá</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
