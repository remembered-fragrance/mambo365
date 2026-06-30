import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../data/useStore';
import { formatDate, formatVnd, formatVndShort, formatWeight } from '../domain/format';
import { supplierSummaries } from '../domain/supplierSelectors';
import { SearchIcon } from '../components/icons';

export function SuppliersPage() {
  const { data } = useStore();
  const [query, setQuery] = useState('');
  const suppliers = useMemo(() => supplierSummaries(data), [data]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.phone?.toLowerCase().includes(q) ||
        s.location?.toLowerCase().includes(q),
    );
  }, [suppliers, query]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Người bán</h1>
        <p className="text-sm text-slate-500">Danh sách nông hộ &amp; đối tác thu mua</p>
      </div>

      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo tên, SĐT, địa chỉ…"
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-base outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
        />
      </div>

      <p className="text-sm text-slate-500">{results.length} người bán</p>

      <div className="space-y-2">
        {results.map((s) => (
          <Link
            key={s.id}
            to={`/history?supplier=${s.id}`}
            className="block rounded-xl bg-white p-4 shadow-sm active:bg-slate-50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-100 text-lg font-semibold text-green-700">
                  {s.name.charAt(0)}
                </span>
                <div>
                  <p className="font-medium text-slate-800">{s.name}</p>
                  {(s.location || s.phone) && (
                    <p className="text-xs text-slate-400">
                      {[s.location, s.phone].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {s.lastDate && (
                    <p className="mt-0.5 text-xs text-slate-400">
                      Giao dịch gần nhất: {formatDate(s.lastDate)}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-800">{formatVndShort(s.totalSpent)}</p>
                <p className="text-xs text-slate-400">{formatWeight(s.totalWeight)} · {s.txCount} phiếu</p>
                {s.debt > 0 && (
                  <p className="text-xs font-medium text-amber-600">Nợ {formatVnd(s.debt)}</p>
                )}
              </div>
            </div>
          </Link>
        ))}

        {results.length === 0 && (
          <p className="rounded-xl bg-white p-8 text-center text-sm text-slate-400 shadow-sm">
            Không tìm thấy người bán.
          </p>
        )}
      </div>
    </div>
  );
}
