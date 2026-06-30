export type CropType = 'rubber' | 'cashew' | 'coffee' | 'pepper';
export type WeightUnit = 'kg' | 'hg';
export type ProductFormulaType = 'standard' | 'netAfterTare' | 'rubberLatex' | 'lossPercent';
export type DraftStatus = 'draft' | 'waiting';

export interface CropMeta {
  readonly id: CropType;
  readonly label: string;
  readonly emoji: string;
  readonly badge: string;
}

export const CROPS: readonly CropMeta[] = [
  { id: 'rubber', label: 'Cao su', emoji: '🌳', badge: 'bg-stone-100 text-stone-700' },
  { id: 'cashew', label: 'Điều', emoji: '🥜', badge: 'bg-amber-100 text-amber-700' },
  { id: 'coffee', label: 'Cà phê', emoji: '☕', badge: 'bg-orange-100 text-orange-700' },
  { id: 'pepper', label: 'Hồ tiêu', emoji: '', badge: 'bg-stone-200 text-stone-800' },
] as const;

export const cropMeta = (id?: CropType): CropMeta | undefined =>
  id ? CROPS.find((c) => c.id === id) : undefined;

export interface Product {
  readonly id: string;
  readonly name: string;
  readonly unit: string;
  readonly formulaType: ProductFormulaType;
  readonly isSuggested: boolean;
  readonly isActive: boolean;
  readonly crop?: CropType;
  readonly lastPricePerUnit?: number;
}

export const DEFAULT_PRODUCTS: readonly Product[] = [
  {
    id: 'prod-rubber',
    name: 'Cao su',
    unit: 'kg',
    formulaType: 'rubberLatex',
    isSuggested: true,
    isActive: true,
    crop: 'rubber',
  },
  {
    id: 'prod-cashew',
    name: 'Điều',
    unit: 'kg',
    formulaType: 'netAfterTare',
    isSuggested: true,
    isActive: true,
    crop: 'cashew',
  },
  {
    id: 'prod-coffee',
    name: 'Cà phê',
    unit: 'kg',
    formulaType: 'netAfterTare',
    isSuggested: true,
    isActive: true,
    crop: 'coffee',
  },
  {
    id: 'prod-pepper',
    name: 'Hồ tiêu',
    unit: 'kg',
    formulaType: 'netAfterTare',
    isSuggested: true,
    isActive: true,
    crop: 'pepper',
  },
] as const;

export const productNameFromCrop = (crop?: CropType): string =>
  cropMeta(crop)?.label ?? 'Mặt hàng';

export interface Supplier {
  readonly id: string;
  readonly name: string;
  readonly phone?: string;
  readonly location?: string;
  readonly note?: string;
}

export interface TransactionLine {
  readonly id: string;
  readonly crop?: CropType;
  readonly productId?: string;
  readonly productName: string;
  readonly unit: string;
  readonly formulaType: ProductFormulaType;
  /** So luong can/nhap theo don vi cua dong */
  readonly grossWeight: number;
  /** Khoi luong bi/tru, neu cong thuc can */
  readonly tareWeight?: number;
  /** Ham luong mu/ty le chat luong, nhap 30 cho 30% */
  readonly qualityPercent?: number;
  /** Hao hut %, neu cong thuc can */
  readonly lossPercent?: number;
  /** Don gia theo don vi cua dong */
  readonly pricePerUnit: number;
  /** Legacy field, giu de code cu/migration khong vo */
  readonly pricePerKg?: number;
  readonly rawTotal?: number;
  readonly roundedTotal?: number;
}

export interface Transaction {
  readonly id: string;
  readonly date: string;
  readonly supplierId: string;
  readonly supplierName: string;
  readonly lines: readonly TransactionLine[];
  readonly amountPaid: number;
  readonly note?: string;
}

export interface DraftReceipt {
  readonly id: string;
  readonly status: DraftStatus;
  readonly supplierId?: string;
  readonly supplierName: string;
  readonly lines: readonly TransactionLine[];
  readonly amountPaid: number;
  readonly note?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface Note {
  readonly id: string;
  readonly body: string;
  readonly pinned: boolean;
  readonly done: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AppSettings {
  readonly defaultWeightUnit: WeightUnit;
}

export interface AppData {
  readonly suppliers: readonly Supplier[];
  readonly products: readonly Product[];
  readonly transactions: readonly Transaction[];
  readonly drafts: readonly DraftReceipt[];
  readonly notes: readonly Note[];
  readonly settings: AppSettings;
}

export interface UserProfile {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly phone?: string;
  readonly businessName?: string;
}
