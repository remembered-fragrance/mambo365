export type CropType = 'rubber' | 'cashew' | 'coffee' | 'pepper';
export type WeightUnit = 'kg' | 'hg';

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

export const cropMeta = (id: CropType): CropMeta =>
  CROPS.find((c) => c.id === id) ?? CROPS[0];

export interface Supplier {
  readonly id: string;
  readonly name: string;
  readonly phone?: string;
  readonly location?: string;
  readonly note?: string;
}

export interface TransactionLine {
  readonly id: string;
  readonly crop: CropType;
  /** Khối lượng cân (kg) */
  readonly grossWeight: number;
  /** Khối lượng bì (kg) */
  readonly tareWeight: number;
  /** Đơn giá (VND/kg) */
  readonly pricePerKg: number;
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

export interface AppSettings {
  readonly defaultWeightUnit: WeightUnit;
}

export interface AppData {
  readonly suppliers: readonly Supplier[];
  readonly transactions: readonly Transaction[];
  readonly settings: AppSettings;
}

export interface UserProfile {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly phone?: string;
  readonly businessName?: string;
}
