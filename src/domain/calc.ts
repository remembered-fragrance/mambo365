import type { Transaction, TransactionLine } from './types';

export interface LineTotals {
  readonly netWeight: number;
  readonly rawTotal: number;
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

export const roundToThousand = (n: number): number => Math.round(n / 1000) * 1000;

export const linePrice = (line: Pick<TransactionLine, 'pricePerUnit' | 'pricePerKg'>): number =>
  line.pricePerUnit ?? line.pricePerKg ?? 0;

/** So luong tinh tien, khong nhat thiet la khoi luong vat ly. */
export const lineNetWeight = (
  line: Pick<
    TransactionLine,
    'formulaType' | 'grossWeight' | 'tareWeight' | 'qualityPercent' | 'lossPercent'
  >,
): number => {
  if (line.formulaType === 'rubberLatex') {
    return round(Math.max(line.grossWeight * ((line.qualityPercent ?? 0) / 100), 0), 2);
  }
  if (line.formulaType === 'lossPercent') {
    return round(Math.max(line.grossWeight * (1 - (line.lossPercent ?? 0) / 100), 0), 2);
  }
  if (line.formulaType === 'netAfterTare') {
    return round(Math.max(line.grossWeight - (line.tareWeight ?? 0), 0), 2);
  }
  return round(Math.max(line.grossWeight, 0), 2);
};

export const lineTotals = (line: TransactionLine): LineTotals => {
  const netWeight = lineNetWeight(line);
  const rawTotal = line.rawTotal ?? netWeight * linePrice(line);
  return {
    netWeight,
    rawTotal: round(rawTotal),
    total: line.roundedTotal ?? roundToThousand(rawTotal),
  };
};

export const freezeLineTotals = (line: TransactionLine): TransactionLine => {
  const { rawTotal, total } = lineTotals({ ...line, rawTotal: undefined, roundedTotal: undefined });
  return { ...line, rawTotal, roundedTotal: total };
};

export const computeReceiptTotal = (
  lines: readonly TransactionLine[],
): Pick<ReceiptTotals, 'netWeight' | 'total'> =>
  lines.reduce(
    (acc, line) => {
      const { netWeight, total } = lineTotals(line);
      return { netWeight: acc.netWeight + netWeight, total: acc.total + total };
    },
    { netWeight: 0, total: 0 },
  );

export const transactionTotals = (t: Pick<Transaction, 'lines' | 'amountPaid'>): ReceiptTotals => {
  const { netWeight, total } = computeReceiptTotal(t.lines);
  return {
    netWeight: round(netWeight, 2),
    total: round(total),
    debt: round(Math.max(total - t.amountPaid, 0)),
  };
};

export const transactionProducts = (t: Pick<Transaction, 'lines'>): readonly string[] => [
  ...new Set(t.lines.map((l) => l.productName || 'Mặt hàng')),
];

export const transactionHasProduct = (t: Pick<Transaction, 'lines'>, product: string): boolean =>
  t.lines.some((l) => l.productName === product || l.crop === product);
