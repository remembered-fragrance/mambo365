import { freezeLineTotals } from '../domain/calc';
import type { AppData, CropType, ProductFormulaType } from '../domain/types';
import { DEFAULT_PRODUCTS, productNameFromCrop } from '../domain/types';

const daysAgo = (d: number, hour = 9): string => {
  const date = new Date();
  date.setDate(date.getDate() - d);
  date.setHours(hour, Math.floor(Math.random() * 59), 0, 0);
  return date.toISOString();
};

interface SeedLine {
  crop: CropType;
  grossWeight: number;
  tareWeight: number;
  pricePerUnit: number;
  formulaType?: ProductFormulaType;
  qualityPercent?: number;
}

interface SeedTx {
  d: number;
  hour: number;
  supplierId: string;
  lines: SeedLine[];
  amountPaid: number;
}

const suppliers = [
  { id: 'sup-1', name: 'Nông hộ Nguyễn Văn Tâm', phone: '0905 112 233', location: 'Phú Riềng, Đồng Nai' },
  { id: 'sup-2', name: 'Vườn điều Bà Sáu', phone: '0912 445 668', location: 'Bù Đăng, Bình Phước' },
  { id: 'sup-3', name: 'HTX Cà phê Ea Tu', phone: '0349 778 991', location: 'Đắk Lắk' },
  { id: 'sup-4', name: 'Ông Trần Hữu Phước', phone: '0978 223 114', location: 'Tây Ninh' },
  { id: 'sup-5', name: 'Cô Lê Thị Mai', phone: '0933 556 882', location: 'Gia Lai' },
];

const line = (crop: CropType, gross: number, tarePct: number, price: number): SeedLine => ({
  crop,
  grossWeight: gross,
  tareWeight: Math.round(gross * (tarePct / 100) * 100) / 100,
  pricePerUnit: price,
  formulaType: 'netAfterTare',
});

const rubberLatex = (gross: number, qualityPercent: number, price: number): SeedLine => ({
  crop: 'rubber',
  grossWeight: gross,
  tareWeight: 0,
  qualityPercent,
  pricePerUnit: price,
  formulaType: 'rubberLatex',
});

const txs: SeedTx[] = [
  { d: 0, hour: 7, supplierId: 'sup-1', lines: [rubberLatex(320, 31, 14500)], amountPaid: 1000000 },
  {
    d: 0,
    hour: 8,
    supplierId: 'sup-2',
    lines: [line('cashew', 540, 8, 28000)],
    amountPaid: 13900000,
  },
  { d: 0, hour: 10, supplierId: 'sup-3', lines: [line('coffee', 800, 3, 95000)], amountPaid: 74000000 },
  { d: 1, hour: 9, supplierId: 'sup-4', lines: [line('pepper', 150, 4, 149000)], amountPaid: 21456000 },
  { d: 1, hour: 14, supplierId: 'sup-1', lines: [rubberLatex(280, 30, 14500)], amountPaid: 0 },
  {
    d: 2,
    hour: 8,
    supplierId: 'sup-5',
    lines: [line('coffee', 620, 3, 94000)],
    amountPaid: 56500000,
  },
  { d: 3, hour: 11, supplierId: 'sup-2', lines: [line('cashew', 410, 7, 27500)], amountPaid: 0 },
  {
    d: 4,
    hour: 9,
    supplierId: 'sup-3',
    lines: [
      rubberLatex(100, 32, 15000),
      line('cashew', 50, 6, 30000),
    ],
    amountPaid: 0,
  },
  { d: 6, hour: 10, supplierId: 'sup-4', lines: [line('pepper', 95, 5, 150000)], amountPaid: 13537500 },
  { d: 9, hour: 8, supplierId: 'sup-1', lines: [rubberLatex(350, 30, 14200)], amountPaid: 1491000 },
  { d: 12, hour: 13, supplierId: 'sup-5', lines: [line('coffee', 700, 4, 92000)], amountPaid: 0 },
  { d: 18, hour: 9, supplierId: 'sup-2', lines: [line('cashew', 480, 6, 27000)], amountPaid: 12000000 },
  { d: 24, hour: 10, supplierId: 'sup-3', lines: [line('coffee', 750, 3, 91000)], amountPaid: 66200000 },
];

export const buildSeedData = (): AppData => ({
  suppliers,
  products: DEFAULT_PRODUCTS,
  drafts: [],
  notes: [],
  settings: { defaultWeightUnit: 'kg' },
  transactions: txs.map((t, i) => {
    const sup = suppliers.find((s) => s.id === t.supplierId)!;
    return {
      id: `seed-${i + 1}`,
      date: daysAgo(t.d, t.hour),
      supplierId: t.supplierId,
      supplierName: sup.name,
      lines: t.lines.map((l, j) =>
        freezeLineTotals({
          id: `seed-${i + 1}-line-${j}`,
          crop: l.crop,
          productId: DEFAULT_PRODUCTS.find((p) => p.crop === l.crop)?.id,
          productName: productNameFromCrop(l.crop),
          unit: 'kg',
          formulaType: l.formulaType ?? 'netAfterTare',
          grossWeight: l.grossWeight,
          tareWeight: l.tareWeight,
          qualityPercent: l.qualityPercent,
          pricePerUnit: l.pricePerUnit,
          pricePerKg: l.pricePerUnit,
        }),
      ),
      amountPaid: t.amountPaid,
    };
  }),
});
