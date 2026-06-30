import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../data/useStore';
import { computeReceiptTotal, lineTotals } from '../domain/calc';
import { formatQuantity, formatVnd } from '../domain/format';
import type { CropType, ProductFormulaType, Supplier, TransactionLine } from '../domain/types';
import { ProductIcon } from '../components/CropIcon';
import { CheckIcon } from '../components/icons';

interface DraftLine {
  readonly id: string;
  productId?: string;
  productName: string;
  crop?: CropType;
  unit: string;
  formulaType: ProductFormulaType;
  gross: string;
  tare: string;
  quality: string;
  loss: string;
  price: string;
}

const num = (s: string): number => {
  const n = parseFloat(s.replace(/,/g, '.'));
  return Number.isFinite(n) ? n : 0;
};

const lineId = (): string => `draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

const emptyLine = (unit = 'kg'): DraftLine => ({
  id: lineId(),
  productName: '',
  unit,
  formulaType: 'netAfterTare',
  gross: '',
  tare: '',
  quality: '',
  loss: '',
  price: '',
});

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base text-slate-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100';

const compactInputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100';

const toBaseQty = (value: number, unit: string): number => (unit === 'hg' ? value / 10 : value);
const storeUnit = (unit: string): string => (unit === 'hg' ? 'kg' : unit);

export function NewReceiptPage() {
  const {
    data,
    addTransaction,
    addSupplier,
    addProduct,
    upsertDraft,
    deleteDraft,
  } = useStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draftParam = searchParams.get('draft');
  const defaultUnit = data.settings.defaultWeightUnit;

  const [draftId, setDraftId] = useState<string | undefined>(draftParam ?? undefined);
  const [loadedDraftId, setLoadedDraftId] = useState<string | undefined>();
  const [supplierId, setSupplierId] = useState<string | undefined>();
  const [supplierName, setSupplierName] = useState('');
  const [supplierQuery, setSupplierQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newNote, setNewNote] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([emptyLine(defaultUnit)]);
  const [payFull, setPayFull] = useState(true);
  const [paid, setPaid] = useState('');
  const [note, setNote] = useState('');
  const [saveState, setSaveState] = useState('Chưa lưu');

  const activeProducts = useMemo(() => data.products.filter((p) => p.isActive), [data.products]);
  const suggestedProducts = activeProducts.filter((p) => p.isSuggested).slice(0, 6);

  useEffect(() => {
    if (draftParam) return;
    setDraftId(undefined);
    setSupplierId(undefined);
    setSupplierName('');
    setSupplierQuery('');
    setLines([emptyLine(defaultUnit)]);
    setPaid('');
    setPayFull(true);
    setNote('');
    setSaveState('Chưa lưu');
    setLoadedDraftId(undefined);
  }, [defaultUnit, draftParam]);

  useEffect(() => {
    if (!draftParam) return;
    const draft = data.drafts.find((d) => d.id === draftParam);
    if (loadedDraftId === draftParam) return;
    if (!draft) return;
    setDraftId(draft.id);
    setSupplierId(draft.supplierId);
    setSupplierName(draft.supplierName);
    setSupplierQuery(draft.supplierName);
    setLines(draft.lines.length ? draft.lines.map(fromStoredLine) : [emptyLine(defaultUnit)]);
    setPaid(draft.amountPaid ? String(draft.amountPaid) : '');
    setPayFull(false);
    setNote(draft.note ?? '');
    setSaveState('Đã lưu');
    setLoadedDraftId(draftParam);
  }, [data.drafts, defaultUnit, draftParam, loadedDraftId]);

  const suggestions = useMemo(() => {
    const q = supplierQuery.trim().toLowerCase();
    if (!q) return data.suppliers.slice(0, 8);
    return data.suppliers
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.phone?.toLowerCase().includes(q) ||
          s.location?.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [data.suppliers, supplierQuery]);

  const parsedLines = useMemo(() => lines.map(toStoredLine), [lines]);
  const validLines = parsedLines.filter(isCompleteLine);
  const totals = useMemo(() => computeReceiptTotal(validLines), [validLines]);
  const amountPaid = payFull ? totals.total : Math.min(num(paid), totals.total);
  const hasContent =
    supplierName.trim() !== '' ||
    note.trim() !== '' ||
    lines.some((l) => l.productName.trim() || l.gross || l.tare || l.price || l.quality);
  const canComplete = validLines.length > 0;
  const autosaveRef = useRef({ hasContent, parsedLines, amountPaid, draftId, upsertDraft });

  useEffect(() => {
    autosaveRef.current = { hasContent, parsedLines, amountPaid, draftId, upsertDraft };
  }, [amountPaid, draftId, hasContent, parsedLines, upsertDraft]);

  // ponytail: keep autosave deps on editable fields only; store action deps make this loop on every save.
  useEffect(() => {
    if (!autosaveRef.current.hasContent) return;
    setSaveState('Đang lưu...');
    const timer = window.setTimeout(() => {
      const saved = autosaveRef.current.upsertDraft({
        id: autosaveRef.current.draftId,
        status: 'draft',
        supplierId,
        supplierName,
        lines: autosaveRef.current.parsedLines,
        amountPaid: autosaveRef.current.amountPaid,
        note: note.trim() || undefined,
      });
      setDraftId(saved.id);
      setSaveState('Đã lưu');
    }, 700);
    return () => window.clearTimeout(timer);
  }, [supplierId, supplierName, lines, payFull, paid, note]);

  const pickSupplier = (s: Supplier) => {
    setSupplierId(s.id);
    setSupplierName(s.name);
    setSupplierQuery(s.name);
    setShowSuggestions(false);
  };

  const saveNewCustomer = () => {
    if (!supplierName.trim()) return;
    const s = addSupplier({
      name: supplierName.trim(),
      phone: newPhone.trim() || undefined,
      location: newLocation.trim() || undefined,
      note: newNote.trim() || undefined,
    });
    setSupplierId(s.id);
    setShowNewCustomer(false);
  };

  const updateLine = (id: string, patch: Partial<DraftLine>) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const applyProduct = (lineIdValue: string, productName: string) => {
    const product = activeProducts.find((p) => p.name.toLowerCase() === productName.trim().toLowerCase());
    if (!product) {
      updateLine(lineIdValue, { productName, productId: undefined, crop: undefined });
      return;
    }
    updateLine(lineIdValue, {
      productId: product.id,
      productName: product.name,
      crop: product.crop,
      unit: product.unit,
      formulaType: product.formulaType,
      price: product.lastPricePerUnit ? String(product.lastPricePerUnit) : '',
    });
  };

  const saveLineProduct = (line: DraftLine) => {
    const name = line.productName.trim();
    if (!name) return;
    const product = addProduct({
      name,
      unit: storeUnit(line.unit),
      formulaType: line.formulaType,
      crop: line.crop,
    });
    updateLine(line.id, { productId: product.id, productName: product.name, unit: product.unit });
  };

  const handleSaveDraft = () => {
    const saved = upsertDraft({
      id: draftId,
      status: 'waiting',
      supplierId,
      supplierName,
      lines: parsedLines,
      amountPaid,
      note: note.trim() || undefined,
    });
    setDraftId(saved.id);
    navigate('/drafts');
  };

  const handleComplete = () => {
    if (!canComplete) return;
    const tx = addTransaction({
      date: new Date().toISOString(),
      ...(supplierId ? { supplierId } : {}),
      supplierName: supplierName.trim() || 'Khách lẻ',
      lines: validLines,
      amountPaid,
      note: note.trim() || undefined,
    });
    if (draftId) deleteDraft(draftId);
    navigate(`/receipt/${tx.id}?new=1`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 lg:text-2xl">
            {draftParam ? 'Tiếp tục phiếu nháp' : 'Tạo phiếu thu mua'}
          </h1>
          <p className="text-xs text-slate-400">{saveState}</p>
        </div>
        {draftParam && (
          <button
            type="button"
            onClick={() => navigate('/new')}
            className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200"
          >
            Phiếu mới
          </button>
        )}
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <Label>Người bán / Nông hộ</Label>
        <div className="relative">
          <input
            value={supplierQuery}
            onChange={(e) => {
              setSupplierQuery(e.target.value);
              setSupplierName(e.target.value);
              setSupplierId(undefined);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Tìm, nhập tên khách hàng hoặc để trống Khách lẻ..."
            className={inputCls}
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
              {suggestions.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => pickSupplier(s)}
                    className="flex w-full flex-col px-3 py-2 text-left hover:bg-green-50"
                  >
                    <span className="font-medium text-slate-800">{s.name}</span>
                    {(s.phone || s.location) && (
                      <span className="text-xs text-slate-400">
                        {[s.phone, s.location].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowNewCustomer(true)}
          className="mt-2 text-sm font-medium text-green-700"
        >
          + Thêm khách hàng mới
        </button>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Mặt hàng</Label>
          <span className="text-xs text-slate-400">Cao su/Điều/Cà phê/Hồ tiêu chỉ là gợi ý</span>
        </div>

        {lines.map((line, idx) => {
          const storedLine = toStoredLine(line);
          const lt = lineTotals(storedLine);
          const existingProduct = activeProducts.some(
            (p) => p.name.toLowerCase() === line.productName.trim().toLowerCase(),
          );

          return (
            <div key={line.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-600">Dòng {idx + 1}</span>
                {lines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setLines((prev) => prev.filter((l) => l.id !== line.id))}
                    className="text-xs text-rose-500"
                  >
                    Xóa dòng
                  </button>
                )}
              </div>

              <div className="grid gap-3">
                <Field label="Nhập hoặc chọn mặt hàng">
                  <input
                    list="product-suggestions"
                    value={line.productName}
                    onChange={(e) => applyProduct(line.id, e.target.value)}
                    placeholder="Ví dụ: Mủ nước, Sắn, Bắp..."
                    className={inputCls}
                  />
                </Field>
                <datalist id="product-suggestions">
                  {activeProducts.map((p) => (
                    <option key={p.id} value={p.name} />
                  ))}
                </datalist>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {suggestedProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => applyProduct(line.id, p.name)}
                      className={`flex items-center justify-center gap-1 rounded-xl border-2 px-2 py-2 text-xs font-medium ${
                        line.productName === p.name
                          ? 'border-green-600 bg-green-50 text-green-700'
                          : 'border-slate-200 text-slate-500'
                      }`}
                    >
                      <ProductIcon crop={p.crop} name={p.name} className="text-base" />
                      {p.name}
                    </button>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Cách tính">
                    <select
                      value={line.formulaType}
                      onChange={(e) => updateLine(line.id, { formulaType: e.target.value as ProductFormulaType })}
                      className={compactInputCls}
                    >
                      <option value="standard">Khối lượng x giá</option>
                      <option value="netAfterTare">Cân - bì</option>
                      <option value="rubberLatex">Cao su: hàm lượng</option>
                      <option value="lossPercent">Trừ hao hụt %</option>
                    </select>
                  </Field>
                  <Field label="Đơn vị nhập">
                    <input
                      value={line.unit}
                      onChange={(e) => updateLine(line.id, { unit: e.target.value })}
                      className={compactInputCls}
                    />
                  </Field>
                  {!existingProduct && line.productName.trim() && (
                    <button
                      type="button"
                      onClick={() => saveLineProduct(line)}
                      className="self-end rounded-xl bg-slate-100 px-3 py-2.5 text-sm font-medium text-slate-700"
                    >
                      Lưu mặt hàng
                    </button>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label={`KL/SL cân (${line.unit})`}>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={line.gross}
                      onChange={(e) => updateLine(line.id, { gross: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                  {line.formulaType === 'netAfterTare' && (
                    <Field label={`KL bì/trừ (${line.unit})`}>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={line.tare}
                        onChange={(e) => updateLine(line.id, { tare: e.target.value })}
                        className={inputCls}
                      />
                    </Field>
                  )}
                  {line.formulaType === 'rubberLatex' && (
                    <Field label="Hàm lượng mủ (%)">
                      <input
                        type="number"
                        inputMode="decimal"
                        value={line.quality}
                        onChange={(e) => updateLine(line.id, { quality: e.target.value })}
                        className={inputCls}
                      />
                    </Field>
                  )}
                  {line.formulaType === 'lossPercent' && (
                    <Field label="Hao hụt (%)">
                      <input
                        type="number"
                        inputMode="decimal"
                        value={line.loss}
                        onChange={(e) => updateLine(line.id, { loss: e.target.value })}
                        className={inputCls}
                      />
                    </Field>
                  )}
                  <Field label={`Đơn giá (đ/${storeUnit(line.unit)})`}>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={line.price}
                      onChange={(e) => updateLine(line.id, { price: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                </div>

                <p className="text-sm text-slate-500">
                  KL/SL tính tiền:{' '}
                  <span className="font-semibold text-slate-700">{formatQuantity(lt.netWeight, storeUnit(line.unit))}</span>
                  {' · '}
                  Tạm tính: <span className="font-semibold text-slate-700">{formatVnd(lt.rawTotal)}</span>
                  {' · '}
                  Thành tiền:{' '}
                  <span className="font-semibold text-green-700">{formatVnd(lt.total)}</span>
                </p>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => setLines((prev) => [...prev, emptyLine(defaultUnit)])}
          className="w-full rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-medium text-slate-500"
        >
          + Thêm sản phẩm
        </button>
      </section>

      <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Tổng KL/SL tính tiền</span>
          <span className="font-semibold text-slate-800">{formatQuantity(totals.netWeight)}</span>
        </div>
        <div className="mt-3 flex items-end justify-between border-t border-green-200 pt-3">
          <span className="text-sm font-medium text-green-800">Tổng thành tiền</span>
          <span className="text-2xl font-extrabold text-green-700">{formatVnd(totals.total)}</span>
        </div>
      </div>

      <div>
        <Label>Thanh toán</Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPayFull(true)}
            className={`rounded-xl border-2 py-2.5 text-sm font-medium ${payFull ? 'border-green-600 bg-green-50 text-green-700' : 'border-slate-200 bg-white text-slate-500'}`}
          >
            Trả đủ
          </button>
          <button
            type="button"
            onClick={() => setPayFull(false)}
            className={`rounded-xl border-2 py-2.5 text-sm font-medium ${!payFull ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-500'}`}
          >
            Trả một phần
          </button>
        </div>
        {!payFull && (
          <div className="mt-3 space-y-2">
            <Field label="Số tiền trả ngay (đ)">
              <input type="number" inputMode="numeric" value={paid} onChange={(e) => setPaid(e.target.value)} className={inputCls} />
            </Field>
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Còn nợ: <span className="font-bold">{formatVnd(Math.max(totals.total - num(paid), 0))}</span>
            </p>
          </div>
        )}
      </div>

      <Field label="Ghi chú (tùy chọn)">
        <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
      </Field>

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={!hasContent}
          className="rounded-2xl bg-white py-4 text-base font-semibold text-slate-700 ring-1 ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Lưu nháp / Hàng chờ
        </button>
        <button
          type="button"
          disabled={!canComplete}
          onClick={handleComplete}
          className="flex items-center justify-center gap-2 rounded-2xl bg-green-700 py-4 text-base font-semibold text-white shadow-lg shadow-green-700/30 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        >
          <CheckIcon className="h-5 w-5" />
          Hoàn thành phiếu
        </button>
      </div>

      {showNewCustomer && (
        <Modal title="Thêm khách hàng mới" onClose={() => setShowNewCustomer(false)}>
          <div className="space-y-3">
            <Field label="Họ tên *">
              <input value={supplierName} onChange={(e) => { setSupplierName(e.target.value); setSupplierQuery(e.target.value); }} className={inputCls} />
            </Field>
            <Field label="Số điện thoại">
              <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Địa chỉ">
              <input value={newLocation} onChange={(e) => setNewLocation(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Ghi chú">
              <input value={newNote} onChange={(e) => setNewNote(e.target.value)} className={inputCls} />
            </Field>
            <button onClick={saveNewCustomer} className="w-full rounded-xl bg-green-700 py-3 font-semibold text-white">
              Lưu khách hàng
            </button>
          </div>
        </Modal>
      )}

      {showSuggestions && supplierQuery && (
        <button
          type="button"
          className="fixed inset-0 z-10"
          aria-label="Đóng gợi ý"
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  );
}

function toStoredLine(line: DraftLine): TransactionLine {
  const unit = storeUnit(line.unit);
  const price = num(line.price);
  return {
    id: line.id,
    productId: line.productId,
    productName: line.productName.trim(),
    crop: line.crop,
    unit,
    formulaType: line.formulaType,
    grossWeight: toBaseQty(num(line.gross), line.unit),
    tareWeight: toBaseQty(num(line.tare), line.unit),
    qualityPercent: line.quality ? num(line.quality) : undefined,
    lossPercent: line.loss ? num(line.loss) : undefined,
    pricePerUnit: price,
    pricePerKg: price,
  };
}

function fromStoredLine(line: TransactionLine): DraftLine {
  return {
    id: line.id || lineId(),
    productId: line.productId,
    productName: line.productName,
    crop: line.crop,
    unit: line.unit,
    formulaType: line.formulaType,
    gross: String(line.grossWeight || ''),
    tare: String(line.tareWeight || ''),
    quality: String(line.qualityPercent || ''),
    loss: String(line.lossPercent || ''),
    price: String(line.pricePerUnit || ''),
  };
}

function isCompleteLine(line: TransactionLine): boolean {
  if (!line.productName.trim() || line.grossWeight <= 0 || line.pricePerUnit <= 0) return false;
  if (line.formulaType === 'rubberLatex') return (line.qualityPercent ?? 0) > 0;
  return true;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-1.5 text-sm font-medium text-slate-600">{children}</p>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      {children}
    </label>
  );
}
