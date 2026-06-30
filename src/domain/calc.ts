import type { Transaction, TransactionLine } from './types';

export interface LineTotals {
  readonly netWeight: number;
  readonly total: number;
}

export interface ReceiptTotals {
  readonly netWeight: number;
  readonly total: number;
  readonly debt: number;
}

const round = (n: number, digits = 0): number => {
  const f = 10 ** digits;
  return Math.round((n + Number.EPSILON) * f) / f;
};

/** KL sản phẩm = KL cân − KL bì */
export const lineNetWeight = (line: Pick<TransactionLine, 'grossWeight' | 'tareWeight'>): number =>
  round(Math.max(line.grossWeight - line.tareWeight, 0), 2);

export const lineTotals = (line: TransactionLine): LineTotals => {
  const netWeight = lineNetWeight(line);
  return { netWeight, total: round(netWeight * line.pricePerKg) };
};

export const computeReceiptTotal = (
  lines: readonly Pick<TransactionLine, 'grossWeight' | 'tareWeight' | 'pricePerKg'>[],
): Pick<ReceiptTotals, 'netWeight' | 'total'> =>
  lines.reduce(
    (acc, line) => {
      const { netWeight, total } = lineTotals(line as TransactionLine);
      return { netWeight: acc.netWeight + netWeight, total: acc.total + total };
    },
    { netWeight: 0, total: 0 },
  );

export const transactionTotals = (t: Transaction): ReceiptTotals => {
  const { netWeight, total } = computeReceiptTotal(t.lines);
  return {
    netWeight: round(netWeight, 2),
    total: round(total),
    debt: round(Math.max(total - t.amountPaid, 0)),
  };
};

export const transactionCrops = (t: Transaction): readonly string[] => [
  ...new Set(t.lines.map((l) => l.crop)),
];

export const transactionHasCrop = (t: Transaction, crop: string): boolean =>
  t.lines.some((l) => l.crop === crop);
