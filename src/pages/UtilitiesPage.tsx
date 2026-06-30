import { useMemo, useState } from 'react';
import { useStore } from '../data/useStore';
import { roundToThousand } from '../domain/calc';
import { formatDateTime, formatVnd } from '../domain/format';
import { SearchIcon } from '../components/icons';

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100';

export function UtilitiesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900 lg:text-2xl">Tiện ích</h1>
        <p className="text-sm text-slate-500">Máy tính nhanh và ghi chú trong lúc thu mua.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <CalculatorCard />
        <NotesCard />
      </div>
    </div>
  );
}

function CalculatorCard() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [op, setOp] = useState('*');
  const [kg, setKg] = useState('');
  const [quality, setQuality] = useState('');
  const [price, setPrice] = useState('');
  const result = calc(Number(a), Number(b), op);
  const rounded = roundToThousand(result);
  const rubber = roundToThousand((Number(kg) || 0) * ((Number(quality) || 0) / 100) * (Number(price) || 0));

  const copy = (value: number) => {
    navigator.clipboard?.writeText(String(value));
  };

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="mb-3 font-semibold text-slate-800">Máy tính</h2>
      <div className="grid grid-cols-[1fr_80px_1fr] gap-2">
        <input value={a} onChange={(e) => setA(e.target.value)} type="number" className={inputCls} />
        <select value={op} onChange={(e) => setOp(e.target.value)} className={inputCls}>
          <option value="+">+</option>
          <option value="-">-</option>
          <option value="*">x</option>
          <option value="/">÷</option>
          <option value="%">%</option>
        </select>
        <input value={b} onChange={(e) => setB(e.target.value)} type="number" className={inputCls} />
      </div>
      <div className="mt-3 rounded-xl bg-slate-50 p-3">
        <p className="text-sm text-slate-500">Kết quả</p>
        <p className="text-2xl font-bold text-slate-900">{formatVnd(result)}</p>
        <p className="text-sm text-green-700">Làm tròn 1.000: {formatVnd(rounded)}</p>
        <button onClick={() => copy(rounded)} className="mt-2 rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200">
          Sao chép kết quả
        </button>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <p className="mb-2 text-sm font-semibold text-slate-700">Cao su: khối lượng x hàm lượng x giá</p>
        <div className="grid gap-2 sm:grid-cols-3">
          <input value={kg} onChange={(e) => setKg(e.target.value)} type="number" placeholder="kg" className={inputCls} />
          <input value={quality} onChange={(e) => setQuality(e.target.value)} type="number" placeholder="%" className={inputCls} />
          <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" placeholder="đ/kg" className={inputCls} />
        </div>
        <p className="mt-2 rounded-xl bg-green-50 px-3 py-2 font-semibold text-green-700">{formatVnd(rubber)}</p>
      </div>
    </section>
  );
}

function NotesCard() {
  const { data, addNote, updateNote, deleteNote } = useStore();
  const [body, setBody] = useState('');
  const [query, setQuery] = useState('');
  const notes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.notes
      .filter((n) => !q || n.body.toLowerCase().includes(q))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt));
  }, [data.notes, query]);

  const create = () => {
    addNote(body);
    setBody('');
  };

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="mb-3 font-semibold text-slate-800">Ghi chú</h2>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Giá hôm nay, khách hẹn thanh toán, lịch xe..."
        className={`${inputCls} min-h-24 resize-none`}
      />
      <button onClick={create} className="mt-2 w-full rounded-xl bg-green-700 py-3 font-semibold text-white">
        Lưu ghi chú
      </button>

      <div className="relative mt-4">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm ghi chú..."
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-base outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
        />
      </div>

      <div className="mt-3 space-y-2">
        {notes.map((note) => (
          <article key={note.id} className={`rounded-xl border border-slate-100 p-3 ${note.done ? 'bg-slate-50 opacity-70' : 'bg-white'}`}>
            <textarea
              value={note.body}
              onChange={(e) => updateNote(note.id, { body: e.target.value })}
              className="min-h-16 w-full resize-none bg-transparent text-sm text-slate-700 outline-none"
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <span>{formatDateTime(note.updatedAt)}</span>
              <div className="flex gap-2">
                <button onClick={() => updateNote(note.id, { pinned: !note.pinned })} className="font-medium text-amber-600">
                  {note.pinned ? 'Bỏ ghim' : 'Ghim'}
                </button>
                <button onClick={() => updateNote(note.id, { done: !note.done })} className="font-medium text-green-700">
                  {note.done ? 'Mở lại' : 'Xong'}
                </button>
                <button onClick={() => deleteNote(note.id)} className="font-medium text-rose-600">
                  Xóa
                </button>
              </div>
            </div>
          </article>
        ))}
        {notes.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-400">Chưa có ghi chú.</p>}
      </div>
    </section>
  );
}

function calc(a: number, b: number, op: string): number {
  if (op === '+') return a + b;
  if (op === '-') return a - b;
  if (op === '/') return b ? a / b : 0;
  if (op === '%') return a * (b / 100);
  return a * b;
}
