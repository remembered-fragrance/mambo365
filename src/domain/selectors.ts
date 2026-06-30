import { lineTotals, transactionTotals } from './calc';
import type { AppData, CropType, Transaction } from './types';

const startOfToday = (): number => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const daysAgoMs = (n: number): number => startOfToday() - n * 86_400_000;

export interface PeriodSummary {
  readonly count: number;
  readonly weight: number;
  readonly spent: number;
}

const summarize = (txs: readonly Transaction[]): PeriodSummary =>
  txs.reduce<PeriodSummary>(
    (acc, t) => {
      const { netWeight, total } = transactionTotals(t);
      return { count: acc.count + 1, weight: acc.weight + netWeight, spent: acc.spent + total };
    },
    { count: 0, weight: 0, spent: 0 },
  );

export const summaryFor = (data: AppData, period: 'today' | 'week' | 'month'): PeriodSummary => {
  const since = period === 'today' ? startOfToday() : period === 'week' ? daysAgoMs(6) : daysAgoMs(29);
  return summarize(data.transactions.filter((t) => new Date(t.date).getTime() >= since));
};

export interface CropBreakdown {
  readonly crop: CropType;
  readonly spent: number;
  readonly weight: number;
}

export const spentByCrop = (data: AppData, period: 'week' | 'month'): CropBreakdown[] => {
  const since = period === 'week' ? daysAgoMs(6) : daysAgoMs(29);
  const map = new Map<CropType, CropBreakdown>();
  for (const t of data.transactions) {
    if (new Date(t.date).getTime() < since) continue;
    for (const line of t.lines) {
      const lt = lineTotals(line);
      const cur = map.get(line.crop) ?? { crop: line.crop, spent: 0, weight: 0 };
      map.set(line.crop, {
        crop: line.crop,
        spent: cur.spent + lt.total,
        weight: cur.weight + lt.netWeight,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.spent - a.spent);
};

export const totalOutstandingDebt = (data: AppData): number =>
  data.transactions.reduce((sum, t) => sum + transactionTotals(t).debt, 0);

export interface SupplierDebt {
  readonly supplierId: string;
  readonly supplierName: string;
  readonly debt: number;
  readonly transactions: readonly Transaction[];
}

export const debtsBySupplier = (data: AppData): SupplierDebt[] => {
  const map = new Map<string, { name: string; debt: number; txs: Transaction[] }>();
  for (const t of data.transactions) {
    const { debt } = transactionTotals(t);
    if (debt <= 0) continue;
    const cur = map.get(t.supplierId) ?? { name: t.supplierName, debt: 0, txs: [] };
    cur.debt += debt;
    cur.txs.push(t);
    map.set(t.supplierId, cur);
  }
  return [...map.entries()]
    .map(([supplierId, v]) => ({
      supplierId,
      supplierName: v.name,
      debt: v.debt,
      transactions: v.txs.sort((a, b) => +new Date(a.date) - +new Date(b.date)),
    }))
    .filter((g) => g.debt > 0)
    .sort((a, b) => b.debt - a.debt);
};

/** Daily spend for the last `days` days, oldest first — for the dashboard chart. */
export interface DailyPoint {
  readonly label: string;
  readonly spent: number;
}

export const dailySpend = (data: AppData, days = 7): DailyPoint[] => {
  const points: DailyPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const start = daysAgoMs(i);
    const end = start + 86_400_000;
    const spent = data.transactions
      .filter((t) => {
        const ms = new Date(t.date).getTime();
        return ms >= start && ms < end;
      })
      .reduce((s, t) => s + transactionTotals(t).total, 0);
    const label = new Date(start).toLocaleDateString('vi-VN', { weekday: 'short' });
    points.push({ label, spent });
  }
  return points;
};
