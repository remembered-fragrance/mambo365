import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStore } from '../data/useStore';
import { transactionTotals } from '../domain/calc';
import { exportTransactionsPdf, exportTransactionsXlsx } from '../domain/export';
import { filterTransactions, type HistoryFilters, type PaymentFilter, type TimePeriod } from '../domain/filters';
import { formatDate, formatVnd, formatWeight } from '../domain/format';
import { CROPS, type CropType } from '../domain/types';
import { TransactionCropIcon, TransactionCrops } from '../components/TransactionCrops';
import { CropIcon } from '../components/CropIcon';
import { SearchIcon } from '../components/icons';

const TIME_OPTIONS: { id: TimePeriod; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'day', label: 'Ngày' },
  { id: 'week', label: 'Tuần' },
  { id: 'month', label: 'Tháng' },
  { id: 'year', label: 'Năm' },
  { id: 'custom', label: 'Khoảng tùy chọn' },
];

const PAYMENT_OPTIONS: { id: PaymentFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'paid', label: 'Đã thanh toán' },
  { id: 'unpaid', label: 'Chưa thanh toán' },
];

export function HistoryPage() {
  const { data } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const supplierIdParam = searchParams.get('supplier') ?? undefined;

  const [query, setQuery] = useState('');
  const [period, setPeriod] = useState<TimePeriod>('all');
  const [payment, setPayment] = useState<PaymentFilter>('all');
  const [crop, setCrop] = useState<CropType | 'all'>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showCropFilter, setShowCropFilter] = useState(false);
  const [exporting, setExporting] = useState(false);

  const filters: HistoryFilters = {
    period,
    customFrom: customFrom || undefined,
    customTo: customTo || undefined,
    payment,
    supplierId: supplierIdParam,
    crop: crop === 'all' ? undefined : crop,
    query,
  };

  const results = useMemo(
    () => filterTransactions(data.transactions, filters),
    [data.transactions, period, payment, crop, supplierIdParam, query, customFrom, customTo],
  );

  const supplierName = supplierIdParam
    ? data.suppliers.find((s) => s.id === supplierIdParam)?.name ??
      data.transactions.find((t) => t.supplierId === supplierIdParam)?.supplierName
    : undefined;

  const totalSpent = results.reduce((s, t) => s + transactionTotals(t).total, 0);
  const totalWeight = results.reduce((s, t) => s + transactionTotals(t).netWeight, 0);

  const hasActiveFilters =
    period !== 'all' ||
    payment !== 'all' ||
    crop !== 'all' ||
    query.trim() !== '' ||
    Boolean(supplierIdParam);

  const resetFilters = () => {
    setPeriod('all');
    setPayment('all');
    setCrop('all');
    setCustomFrom('');
    setCustomTo('');
    setQuery('');
    setSearchParams({});
  };

  const exportXlsx = () => {
    exportTransactionsXlsx(results, `thumua365-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportPdf = async () => {
    setExporting(true);
    try {
      await exportTransactionsPdf(results, `thumua365-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900 lg:text-2xl">Lịch sử giao dịch</h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportXlsx}
            disabled={results.length === 0}
            className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 disabled:opacity-50"
          >
            Xuất Excel
          </button>
          <button
            type="button"
            onClick={exportPdf}
            disabled={results.length === 0 || exporting}
            className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 disabled:opacity-50"
          >
            {exporting ? 'Đang xuất…' : 'Xuất PDF'}
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600"
            >
              Xóa lọc
            </button>
          )}
        </div>
      </div>

      {supplierName && (
        <div className="rounded-xl bg-green-50 px-3 py-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-green-800">
              Khách hàng: <span className="font-semibold">{supplierName}</span>
            </span>
            <button type="button" onClick={() => setSearchParams({})} className="shrink-0 font-medium text-green-700">
              Bỏ lọc KH
            </button>
          </div>
          <p className="mt-1 text-xs text-green-700">
            {results.length} phiếu · {formatWeight(totalWeight)} · {formatVnd(totalSpent)}
          </p>
        </div>
      )}

      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo tên người bán, ghi chú…"
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-base outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
        />
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm space-y-4">
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">Bộ lọc thời gian</p>
          <div className="flex flex-wrap gap-2">
            {TIME_OPTIONS.map(({ id, label }) => (
              <Chip key={id} active={period === id} onClick={() => setPeriod(id)}>
                {label}
              </Chip>
            ))}
          </div>
          {period === 'custom' && (
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="block text-xs text-slate-500">
                Từ ngày
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-xs text-slate-500">
                Đến ngày
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 pt-4">
          <p className="mb-2 text-sm font-semibold text-slate-700">Trạng thái thanh toán</p>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_OPTIONS.map(({ id, label }) => (
              <Chip key={id} active={payment === id} onClick={() => setPayment(id)}>
                {label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => setShowCropFilter((v) => !v)}
            className="text-sm font-medium text-green-700"
          >
            {showCropFilter ? '▾ Ẩn lọc nông sản' : '▸ Lọc theo nông sản'}
          </button>
          {showCropFilter && (
            <div className="mt-2 flex flex-wrap gap-2">
              <Chip active={crop === 'all'} onClick={() => setCrop('all')}>
                Tất cả
              </Chip>
              {CROPS.map((c) => (
                <Chip key={c.id} active={crop === c.id} onClick={() => setCrop(c.id)}>
                  <CropIcon crop={c.id} className="text-base" /> {c.label}
                </Chip>
              ))}
            </div>
          )}
        </div>
      </section>

      <p className="text-sm text-slate-500">
        {results.length} phiếu · {formatWeight(totalWeight)} ·{' '}
        <span className="font-semibold text-slate-700">{formatVnd(totalSpent)}</span>
      </p>

      <div className="grid gap-2 lg:grid-cols-2">
        {results.map((t) => {
          const { total, netWeight, debt } = transactionTotals(t);
          return (
            <Link
              key={t.id}
              to={`/receipt/${t.id}`}
              className="block rounded-xl bg-white p-3 shadow-sm active:bg-slate-50"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                    <TransactionCropIcon transaction={t} className="text-xl" />
                  </span>
                  <div>
                    <p className="font-medium text-slate-800">{t.supplierName}</p>
                    <p className="text-xs text-slate-400">
                      {formatDate(t.date)} · {formatWeight(netWeight)}
                      {t.lines.length > 1 && ` · ${t.lines.length} dòng`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-800">{formatVnd(total)}</p>
                  {debt > 0 ? (
                    <span className="text-xs font-medium text-amber-600">Chưa thanh toán</span>
                  ) : (
                    <span className="text-xs font-medium text-green-600">Đã thanh toán</span>
                  )}
                </div>
              </div>
              <div className="mt-2">
                <TransactionCrops transaction={t} />
              </div>
            </Link>
          );
        })}
        {results.length === 0 && (
          <p className="col-span-full rounded-xl bg-white p-8 text-center text-sm text-slate-400 shadow-sm">
            Không tìm thấy giao dịch nào.
          </p>
        )}
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition ${
        active ? 'bg-green-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      {children}
    </button>
  );
}
