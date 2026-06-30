import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../data/useStore';
import { computeReceiptTotal } from '../domain/calc';
import { formatVnd, formatWeight } from '../domain/format';
import { CROPS, type CropType, type Supplier } from '../domain/types';
import { toKg, weightUnitLabel } from '../domain/weight';
import { CropIcon } from '../components/CropIcon';
import { CheckIcon } from '../components/icons';

interface DraftLine {
  readonly id: string;
  crop: CropType;
  gross: string;
  tare: string;
  price: string;
}

const num = (s: string): number => {
  const n = parseFloat(s.replace(/,/g, '.'));
  return Number.isFinite(n) ? n : 0;
};

const lineId = (): string => `draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

const emptyLine = (): DraftLine => ({ id: lineId(), crop: 'rubber', gross: '', tare: '', price: '' });

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base text-slate-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100';

export function NewReceiptPage() {
  const { data, addTransaction, addSupplier } = useStore();
  const navigate = useNavigate();
  const unit = data.settings.defaultWeightUnit;

  const [supplierId, setSupplierId] = useState<string | undefined>();
  const [supplierName, setSupplierName] = useState('');
  const [supplierQuery, setSupplierQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newNote, setNewNote] = useState('');

  const [lines, setLines] = useState<DraftLine[]>([emptyLine()]);
  const [payFull, setPayFull] = useState(true);
  const [paid, setPaid] = useState('');
  const [note, setNote] = useState('');

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

  const parsedLines = useMemo(
    () =>
      lines.map((l) => ({
        grossWeight: toKg(num(l.gross), unit),
        tareWeight: toKg(num(l.tare), unit),
        pricePerKg: num(l.price),
        crop: l.crop,
      })),
    [lines, unit],
  );

  const totals = useMemo(() => computeReceiptTotal(parsedLines), [parsedLines]);
  const amountPaid = payFull ? totals.total : Math.min(num(paid), totals.total);

  const canSave =
    supplierName.trim() !== '' &&
    parsedLines.some((l) => l.grossWeight > 0 && l.pricePerKg > 0);

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

  const handleSave = () => {
    if (!canSave) return;
    const validLines = lines
      .filter((l) => toKg(num(l.gross), unit) > 0 && num(l.price) > 0)
      .map((l) => ({
        id: lineId(),
        crop: l.crop,
        grossWeight: toKg(num(l.gross), unit),
        tareWeight: toKg(num(l.tare), unit),
        pricePerKg: num(l.price),
      }));

    const tx = addTransaction({
      date: new Date().toISOString(),
      ...(supplierId ? { supplierId } : {}),
      supplierName: supplierName.trim(),
      lines: validLines,
      amountPaid,
      note: note.trim() || undefined,
    });
    navigate(`/receipt/${tx.id}?new=1`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-4">
      <h1 className="text-xl font-bold text-slate-900 lg:text-2xl">Tạo phiếu thu mua</h1>

      {/* Customer */}
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
            placeholder="Tìm hoặc nhập tên khách hàng…"
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

      {/* Lines */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Sản phẩm ({weightUnitLabel(unit)})</Label>
          <span className="text-xs text-slate-400">KL sản phẩm = cân − bì</span>
        </div>

        {lines.map((line, idx) => {
          const grossKg = toKg(num(line.gross), unit);
          const tareKg = toKg(num(line.tare), unit);
          const netKg = Math.max(grossKg - tareKg, 0);
          const lineTotal = netKg * num(line.price);

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
                    Xoá dòng
                  </button>
                )}
              </div>

              <div className="mb-3 grid grid-cols-4 gap-2">
                {CROPS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => updateLine(line.id, { crop: c.id })}
                    className={`flex flex-col items-center gap-1 rounded-xl border-2 py-2 text-xs font-medium ${
                      line.crop === c.id
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-slate-200 text-slate-500'
                    }`}
                  >
                    <CropIcon crop={c.id} className="text-lg" />
                    {c.label}
                  </button>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Field label={`KL cân (${unit})`}>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={line.gross}
                    onChange={(e) => updateLine(line.id, { gross: e.target.value })}
                    className={inputCls}
                  />
                </Field>
                <Field label={`KL bì (${unit})`}>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={line.tare}
                    onChange={(e) => updateLine(line.id, { tare: e.target.value })}
                    className={inputCls}
                  />
                </Field>
                <Field label="Đơn giá (₫/kg)">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={line.price}
                    onChange={(e) => updateLine(line.id, { price: e.target.value })}
                    className={inputCls}
                  />
                </Field>
              </div>

              <p className="mt-2 text-sm text-slate-500">
                KL thực: <span className="font-semibold text-slate-700">{formatWeight(netKg)}</span>
                {' · '}
                Thành tiền: <span className="font-semibold text-green-700">{formatVnd(lineTotal)}</span>
              </p>
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => setLines((prev) => [...prev, emptyLine()])}
          className="w-full rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-medium text-slate-500"
        >
          + Thêm sản phẩm
        </button>
      </section>

      {/* Totals */}
      <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Tổng khối lượng thực</span>
          <span className="font-semibold text-slate-800">{formatWeight(totals.netWeight)}</span>
        </div>
        <div className="mt-3 flex items-end justify-between border-t border-green-200 pt-3">
          <span className="text-sm font-medium text-green-800">Tổng thành tiền</span>
          <span className="text-2xl font-extrabold text-green-700">{formatVnd(totals.total)}</span>
        </div>
      </div>

      {/* Payment */}
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
            <Field label="Số tiền trả ngay (₫)">
              <input type="number" inputMode="numeric" value={paid} onChange={(e) => setPaid(e.target.value)} className={inputCls} />
            </Field>
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Còn nợ: <span className="font-bold">{formatVnd(Math.max(totals.total - num(paid), 0))}</span>
            </p>
          </div>
        )}
      </div>

      <Field label="Ghi chú (tuỳ chọn)">
        <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
      </Field>

      <button
        type="button"
        disabled={!canSave}
        onClick={handleSave}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-700 py-4 text-base font-semibold text-white shadow-lg shadow-green-700/30 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none lg:max-w-md"
      >
        <CheckIcon className="h-5 w-5" />
        Lưu &amp; xem phiếu
      </button>

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
