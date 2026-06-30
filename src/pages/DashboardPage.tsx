import { Link } from 'react-router-dom';
import { useAuth } from '../data/AuthProvider';
import { useStore } from '../data/useStore';
import { transactionTotals } from '../domain/calc';
import { formatVnd, formatVndShort, formatWeight } from '../domain/format';
import {
  dailySpend,
  spentByCrop,
  summaryFor,
  totalOutstandingDebt,
} from '../domain/selectors';
import { CropBadge } from '../components/CropBadge';
import { AppLogo } from '../components/CropIcon';
import { TransactionCropIcon } from '../components/TransactionCrops';

export function DashboardPage() {
  const { user } = useAuth();
  const { data } = useStore();
  const today = summaryFor(data, 'today');
  const week = summaryFor(data, 'week');
  const month = summaryFor(data, 'month');
  const debt = totalOutstandingDebt(data);
  const chart = dailySpend(data, 7);
  const byCrop = spentByCrop(data, 'month');
  const maxDay = Math.max(...chart.map((p) => p.spent), 1);
  const recent = data.transactions.slice(0, 5);

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between lg:mb-0">
        <div>
          <p className="text-sm text-slate-500">Xin chào,</p>
          <h1 className="text-xl font-bold text-slate-900 lg:text-2xl">
            {user?.name ?? 'Chủ vựa'} 👋
          </h1>
        </div>
        <AppLogo className="hidden h-10 lg:block" />
      </header>

      <section className="rounded-2xl bg-gradient-to-br from-green-700 to-emerald-600 p-5 text-white shadow-lg shadow-green-700/20 lg:p-6">
        <p className="text-sm/none text-green-100">Đã chi mua hôm nay</p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight lg:text-4xl">{formatVnd(today.spent)}</p>
        <div className="mt-4 flex gap-6 text-sm lg:gap-10">
          <div>
            <p className="text-green-100">Khối lượng</p>
            <p className="font-semibold">{formatWeight(today.weight)}</p>
          </div>
          <div>
            <p className="text-green-100">Số phiếu</p>
            <p className="font-semibold">{today.count} phiếu</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3 lg:gap-4">
        <Kpi label="Tuần này" value={formatVndShort(week.spent)} sub={`${week.count} phiếu`} />
        <Kpi label="Tháng này" value={formatVndShort(month.spent)} sub={`${month.count} phiếu`} />
        <Link to="/debts">
          <Kpi label="Còn nợ" value={formatVndShort(debt)} sub="Xem chi tiết" accent />
        </Link>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Chi mua 7 ngày qua</h2>
          <div className="flex h-32 items-stretch justify-between gap-2 lg:h-40">
            {chart.map((p, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center gap-1">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-md bg-green-500/80 transition-all"
                    style={{ height: `${Math.max((p.spent / maxDay) * 100, 3)}%` }}
                    title={formatVnd(p.spent)}
                  />
                </div>
                <span className="text-[10px] capitalize text-slate-400">{p.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Theo loại nông sản (30 ngày)</h2>
          <div className="space-y-3">
            {byCrop.map((c) => {
              const pct = (c.spent / month.spent) * 100 || 0;
              return (
                <div key={c.crop}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <CropBadge crop={c.crop} />
                    <span className="font-medium text-slate-700">{formatVnd(c.spent)}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: barColor(c.crop) }}
                    />
                  </div>
                </div>
              );
            })}
            {byCrop.length === 0 && <p className="text-sm text-slate-400">Chưa có dữ liệu.</p>}
          </div>
        </section>
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Giao dịch gần đây</h2>
          <Link to="/history" className="text-sm font-medium text-green-700">
            Xem tất cả
          </Link>
        </div>
        <div className="grid gap-2 lg:grid-cols-2">
          {recent.map((t) => {
            const { total } = transactionTotals(t);
            return (
              <Link
                key={t.id}
                to={`/receipt/${t.id}`}
                className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm active:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                    <TransactionCropIcon transaction={t} className="text-lg" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{t.supplierName}</p>
                    <p className="text-xs text-slate-400">{formatWeight(transactionTotals(t).netWeight)}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-slate-800">{formatVnd(total)}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-3 shadow-sm lg:p-4 ${accent ? 'bg-amber-50' : 'bg-white'}`}>
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-bold lg:text-xl ${accent ? 'text-amber-700' : 'text-slate-900'}`}>
        {value}
      </p>
      <p className="text-[10px] text-slate-400">{sub}</p>
    </div>
  );
}

function barColor(crop: string): string {
  switch (crop) {
    case 'rubber':
      return '#78716c';
    case 'cashew':
      return '#d97706';
    case 'coffee':
      return '#ea580c';
    case 'pepper':
      return '#4a3520';
    default:
      return '#16a34a';
  }
}
