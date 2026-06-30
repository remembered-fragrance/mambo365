import { useMemo, useState } from 'react';
import { useStore } from '../data/useStore';
import type { ProductFormulaType } from '../domain/types';
import { ProductIcon } from '../components/CropIcon';
import { SearchIcon } from '../components/icons';

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100';

export function ProductsPage() {
  const { data, addProduct, updateProduct } = useStore();
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('kg');
  const [formulaType, setFormulaType] = useState<ProductFormulaType>('netAfterTare');

  const products = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data.products;
    return data.products.filter((p) => p.name.toLowerCase().includes(q));
  }, [data.products, query]);

  const create = () => {
    if (!name.trim()) return;
    addProduct({ name, unit, formulaType });
    setName('');
    setUnit('kg');
    setFormulaType('netAfterTare');
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900 lg:text-2xl">Mặt hàng</h1>
        <p className="text-sm text-slate-500">Bốn mặt hàng mặc định chỉ là gợi ý, bạn có thể thêm mặt hàng riêng.</p>
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-800">Thêm mặt hàng</h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_100px_180px_auto]">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên mặt hàng" className={inputCls} />
          <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Đơn vị" className={inputCls} />
          <FormulaSelect value={formulaType} onChange={setFormulaType} />
          <button onClick={create} className="rounded-xl bg-green-700 px-4 py-2.5 text-sm font-semibold text-white">
            Thêm
          </button>
        </div>
      </section>

      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm mặt hàng..."
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-base outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {products.map((p) => (
          <article key={p.id} className={`rounded-2xl bg-white p-4 shadow-sm ${p.isActive ? '' : 'opacity-60'}`}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                  <ProductIcon crop={p.crop} name={p.name} className="text-xl" />
                </span>
                <div>
                  <p className="font-semibold text-slate-900">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.isSuggested ? 'Gợi ý nhanh' : 'Mặt hàng riêng'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => updateProduct(p.id, { isActive: !p.isActive })}
                className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600"
              >
                {p.isActive ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr_90px_1fr]">
              <input value={p.name} onChange={(e) => updateProduct(p.id, { name: e.target.value })} className={inputCls} />
              <input value={p.unit} onChange={(e) => updateProduct(p.id, { unit: e.target.value })} className={inputCls} />
              <FormulaSelect value={p.formulaType} onChange={(value) => updateProduct(p.id, { formulaType: value })} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function FormulaSelect({
  value,
  onChange,
}: {
  value: ProductFormulaType;
  onChange: (value: ProductFormulaType) => void;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as ProductFormulaType)} className={inputCls}>
      <option value="standard">Khối lượng x giá</option>
      <option value="netAfterTare">Cân - bì</option>
      <option value="rubberLatex">Cao su: hàm lượng</option>
      <option value="lossPercent">Trừ hao hụt %</option>
    </select>
  );
}
