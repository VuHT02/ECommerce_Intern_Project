/**
 * Component Skeleton Loading cho thẻ sản phẩm (ProductSkeleton)
 * Giúp tạo trải nghiệm người dùng mượt mà (perceived performance)
 * Sử dụng hiệu ứng animate-pulse chuẩn Tailwind CSS
 */
export default function ProductSkeleton({ count = 8 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm animate-pulse flex flex-col justify-between"
        >
          <div>
            {/* Khung hình ảnh skeleton */}
            <div className="w-full pt-[75%] bg-slate-200 rounded-xl relative overflow-hidden mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
            </div>

            {/* Badge danh mục skeleton */}
            <div className="h-3.5 bg-slate-200 rounded w-1/3 mb-2.5" />

            {/* Tên sản phẩm skeleton (2 dòng) */}
            <div className="h-4 bg-slate-200 rounded w-full mb-2" />
            <div className="h-4 bg-slate-200 rounded w-2/3 mb-3" />

            {/* Thông tin tồn kho skeleton */}
            <div className="h-3 bg-slate-100 rounded w-1/2 mb-4" />
          </div>

          {/* Giá và nút mua skeleton */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 mt-auto">
            <div className="space-y-1.5">
              <div className="h-2.5 bg-slate-100 rounded w-12" />
              <div className="h-5 bg-slate-200 rounded w-24" />
            </div>
            <div className="h-9 w-24 bg-slate-200 rounded-xl" />
          </div>
        </div>
      ))}
    </>
  );
}
