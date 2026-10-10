import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { AlertCircle, ImagePlus, LoaderCircle, Pencil, Plus, Search, X } from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import { productApi } from '../../services/productApi';
import { formatCurrency } from '../../utils/format';

const emptyForm = () => ({
  categoryId: '', name: '', sku: '', slug: '', description: '', brand: '',
  price: '', stockQuantity: '0', imageUrl: '', detailImageUrlsText: '', active: true,
  specifications: [{ key: '', value: '' }],
});

const inputClass = 'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100';

export default function AdminProductsPage() {
  const [result, setResult] = useState({ content: [], number: 0, totalPages: 0, totalElements: 0 });
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ keyword: '', categoryId: '', active: '', lowStock: '' });
  const [applied, setApplied] = useState(filters);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getProducts({
        page, size: 10, keyword: applied.keyword,
        categoryId: applied.categoryId,
        active: applied.active,
        lowStock: applied.lowStock,
        sortBy: 'createdAt', sortDir: 'desc',
      });
      setResult(data);
    } catch (err) {
      setError(err.message || 'Không tải được danh sách sản phẩm.');
    } finally {
      setLoading(false);
    }
  }, [page, applied]);

  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => {
    productApi.getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm()); setFormOpen(true); };
  const openEdit = (product) => {
    setEditing(product);
    setFormOpen(true);
    setForm({
      categoryId: String(product.categoryId || ''), name: product.name || '', sku: product.sku || '',
      slug: product.slug || '', description: product.description || '', brand: product.brand || '',
      price: String(product.price ?? ''), stockQuantity: String(product.stockQuantity ?? 0),
      imageUrl: product.imageUrl || '', detailImageUrlsText: (product.detailImageUrls || []).join('\n'),
      active: product.active,
      specifications: Object.entries(product.specifications || {}).map(([key, value]) => ({ key, value })).length
        ? Object.entries(product.specifications || {}).map(([key, value]) => ({ key, value }))
        : [{ key: '', value: '' }],
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    const specifications = Object.fromEntries(form.specifications
      .filter((item) => item.key.trim() && item.value.trim())
      .map((item) => [item.key.trim(), item.value.trim()]));
    const payload = {
      categoryId: Number(form.categoryId), name: form.name.trim(), sku: form.sku.trim(),
      slug: form.slug.trim() || null, description: form.description.trim(), brand: form.brand.trim(),
      price: Number(form.price), stockQuantity: Number(form.stockQuantity), imageUrl: form.imageUrl.trim(),
      detailImageUrls: form.detailImageUrlsText.split('\n').map((url) => url.trim()).filter(Boolean),
      active: form.active, specifications,
    };
    try {
      if (editing) await adminApi.updateProduct(editing.id, payload);
      else await adminApi.createProduct(payload);
      toast.success(editing ? 'Đã cập nhật sản phẩm.' : 'Đã tạo sản phẩm.');
      setForm(emptyForm());
      setEditing(null);
      setFormOpen(false);
      await loadProducts();
    } catch (err) {
      toast.error(err.message || 'Không lưu được sản phẩm.');
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (product) => {
    if (!window.confirm(`Ẩn sản phẩm “${product.name}” khỏi cửa hàng? Lịch sử đơn hàng sẽ được giữ nguyên.`)) return;
    try {
      await adminApi.deactivateProduct(product.id);
      toast.success('Đã ẩn sản phẩm khỏi cửa hàng.');
      await loadProducts();
    } catch (err) {
      toast.error(err.message || 'Không thể ẩn sản phẩm.');
    }
  };

  const updateSpec = (index, field, value) => {
    setForm((current) => ({
      ...current,
      specifications: current.specifications.map((spec, i) => i === index ? { ...spec, [field]: value } : spec),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Danh mục hàng hóa</p><h1 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">Sản phẩm</h1><p className="mt-1 text-sm text-slate-500">Tìm kiếm, cập nhật tồn kho và quản lý thông số theo từng sản phẩm.</p></div>
        <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"><Plus size={17} /> Thêm sản phẩm</button>
      </div>

      <form onSubmit={(event) => { event.preventDefault(); setApplied({ ...filters }); setPage(0); }} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-5">
        <label className="relative sm:col-span-2 xl:col-span-2"><span className="sr-only">Tìm sản phẩm</span><Search size={17} className="absolute left-3 top-3.5 text-slate-400" /><input value={filters.keyword} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })} placeholder="Tìm tên, SKU hoặc thương hiệu" className={`${inputClass} mt-0 pl-9`} /></label>
        <select aria-label="Danh mục" value={filters.categoryId} onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })} className={`${inputClass} mt-0`}><option value="">Tất cả danh mục</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
        <select aria-label="Trạng thái bán" value={filters.active} onChange={(e) => setFilters({ ...filters, active: e.target.value })} className={`${inputClass} mt-0`}><option value="">Mọi trạng thái</option><option value="true">Đang bán</option><option value="false">Đang ẩn</option></select>
        <div className="flex gap-2"><select aria-label="Lọc tồn kho" value={filters.lowStock} onChange={(e) => setFilters({ ...filters, lowStock: e.target.value })} className={`${inputClass} mt-0`}><option value="">Mọi mức kho</option><option value="true">Sắp hết (≤ 5)</option></select><button className="shrink-0 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white hover:bg-slate-700">Lọc</button></div>
      </form>

      {error && <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><AlertCircle size={17} />{error}</div>}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-bold text-slate-900">Danh sách sản phẩm</h2><p className="mt-0.5 text-xs text-slate-500">{Number(result.totalElements || 0).toLocaleString('vi-VN')} sản phẩm</p></div>{loading && <LoaderCircle size={18} className="animate-spin text-blue-600" />}</div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Sản phẩm</th><th className="px-4 py-3">Danh mục</th><th className="px-4 py-3">Giá</th><th className="px-4 py-3">Tồn kho</th><th className="px-4 py-3">Trạng thái</th><th className="px-5 py-3 text-right">Thao tác</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {!loading && result.content?.length === 0 && <tr><td colSpan="6" className="px-5 py-16 text-center text-slate-500">Không tìm thấy sản phẩm phù hợp bộ lọc.</td></tr>}
              {result.content?.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3"><div className="flex items-center gap-3"><div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100">{product.imageUrl ? <img src={product.imageUrl} alt="" className="h-full w-full object-contain p-1" /> : <ImagePlus className="m-3 text-slate-400" size={22} />}</div><div className="min-w-0"><p className="max-w-64 truncate font-bold text-slate-800">{product.name}</p><p className="mt-0.5 text-xs text-slate-500">{product.sku} · {product.brand || 'Chưa có thương hiệu'}</p></div></div></td>
                  <td className="px-4 py-3 text-slate-600">{product.categoryName || '—'}</td>
                  <td className="px-4 py-3 font-bold text-slate-800">{formatCurrency(product.price)}</td>
                  <td className="px-4 py-3"><span className={`font-bold ${product.stockQuantity <= 5 ? 'text-amber-700' : 'text-slate-700'}`}>{product.stockQuantity}</span></td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${product.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{product.active ? 'Đang bán' : 'Đang ẩn'}</span></td>
                  <td className="px-5 py-3"><div className="flex justify-end gap-2"><button onClick={() => openEdit(product)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:border-blue-300 hover:text-blue-700"><Pencil size={14} /> Sửa</button>{product.active && <button onClick={() => deactivate(product)} className="rounded-lg border border-rose-100 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50">Ẩn</button>}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4"><p className="text-xs text-slate-500">Trang {Number(result.number || 0) + 1} / {Math.max(1, result.totalPages || 0)}</p><div className="flex gap-2"><button disabled={page <= 0 || loading} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-40">Trước</button><button disabled={page + 1 >= (result.totalPages || 0) || loading} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-40">Sau</button></div></div>
      </section>

      {formOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) { setEditing(null); setForm(emptyForm()); setFormOpen(false); } }}>
          <form onSubmit={submit} className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7">
            <div className="mb-5 flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Danh mục hàng hóa</p><h2 className="mt-1 text-xl font-black text-slate-900">{editing ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}</h2></div><button type="button" onClick={() => { setEditing(null); setForm(emptyForm()); setFormOpen(false); }} className="rounded-full p-2 text-slate-400 hover:bg-slate-100"><X size={19} /></button></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold text-slate-600">Tên sản phẩm<input required maxLength="200" className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
              <label className="text-xs font-bold text-slate-600">SKU<input required maxLength="50" className={inputClass} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></label>
              <label className="text-xs font-bold text-slate-600">Danh mục<select required className={inputClass} value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}><option value="">Chọn danh mục</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
              <label className="text-xs font-bold text-slate-600">Thương hiệu<input className={inputClass} value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></label>
              <label className="text-xs font-bold text-slate-600">Giá bán (VND)<input required type="number" min="1" step="1" className={inputClass} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label>
              <label className="text-xs font-bold text-slate-600">Tồn kho<input required type="number" min="0" step="1" className={inputClass} value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} /></label>
              <label className="text-xs font-bold text-slate-600 sm:col-span-2">Slug (để trống sẽ tự tạo)<input className={inputClass} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></label>
              <label className="text-xs font-bold text-slate-600 sm:col-span-2">URL ảnh đại diện<input type="url" className={inputClass} value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} /></label>
              <label className="text-xs font-bold text-slate-600 sm:col-span-2">Ảnh chi tiết (mỗi URL một dòng)<textarea rows="3" className={inputClass} value={form.detailImageUrlsText} onChange={(e) => setForm({ ...form, detailImageUrlsText: e.target.value })} /></label>
              <label className="text-xs font-bold text-slate-600 sm:col-span-2">Mô tả<textarea rows="4" className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            </div>
            <section className="mt-6 rounded-2xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between"><div><h3 className="text-sm font-extrabold text-slate-900">Thông số kỹ thuật</h3><p className="mt-0.5 text-xs text-slate-500">Chỉ nhập thông số thực của sản phẩm này; không có thì để trống.</p></div><button type="button" onClick={() => setForm({ ...form, specifications: [...form.specifications, { key: '', value: '' }] })} className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">Thêm dòng</button></div>
              <div className="space-y-2">{form.specifications.map((spec, index) => <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2"><input aria-label="Tên thông số" placeholder="Ví dụ: Màn hình" className={`${inputClass} mt-0`} value={spec.key} onChange={(e) => updateSpec(index, 'key', e.target.value)} /><input aria-label="Giá trị thông số" placeholder="Ví dụ: OLED 120Hz" className={`${inputClass} mt-0`} value={spec.value} onChange={(e) => updateSpec(index, 'value', e.target.value)} /><button type="button" onClick={() => setForm({ ...form, specifications: form.specifications.filter((_, i) => i !== index) })} className="rounded-lg px-3 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><X size={16} /></button></div>)}</div>
            </section>
            <label className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-blue-600" /> Đang kinh doanh</label>
            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={() => { setEditing(null); setForm(emptyForm()); setFormOpen(false); }} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600">Hủy</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">{saving && <LoaderCircle size={16} className="animate-spin" />}{editing ? 'Lưu thay đổi' : 'Tạo sản phẩm'}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
