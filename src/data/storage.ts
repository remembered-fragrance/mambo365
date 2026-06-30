import { freezeLineTotals, transactionTotals } from '../domain/calc';
import type {
  AppData,
  AppSettings,
  CropType,
  DraftReceipt,
  Note,
  Product,
  ProductFormulaType,
  Supplier,
  Transaction,
  TransactionLine,
} from '../domain/types';
import { DEFAULT_PRODUCTS, productNameFromCrop } from '../domain/types';
import { dataKeyForUser, getSessionUserId } from './auth';
import { buildSeedData } from './seed';

const LEGACY_KEY = 'thumua365:data:v1';
const GUEST_SUPPLIER_ID = 'guest';

const defaultSettings = (): AppSettings => ({ defaultWeightUnit: 'kg' });

const uid = (prefix: string): string =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const crops: readonly CropType[] = ['rubber', 'cashew', 'coffee', 'pepper'];
const formulas: readonly ProductFormulaType[] = ['standard', 'netAfterTare', 'rubberLatex', 'lossPercent'];

const cropFrom = (value: unknown): CropType | undefined =>
  crops.includes(value as CropType) ? (value as CropType) : undefined;

const formulaFrom = (value: unknown): ProductFormulaType =>
  formulas.includes(value as ProductFormulaType) ? (value as ProductFormulaType) : 'netAfterTare';

const normalizeProducts = (raw: unknown): Product[] => {
  const incoming = Array.isArray(raw) ? (raw as Record<string, unknown>[]) : [];
  const normalized = incoming.map((p): Product => {
    const crop = cropFrom(p.crop);
    const name = String(p.name || productNameFromCrop(crop)).trim();
    return {
      id: String(p.id || uid('prod')),
      name,
      unit: String(p.unit || 'kg'),
      formulaType: formulaFrom(p.formulaType),
      isSuggested: Boolean(p.isSuggested),
      isActive: p.isActive !== false,
      crop,
      lastPricePerUnit: Number(p.lastPricePerUnit) || undefined,
    };
  });

  const byName = new Map(normalized.map((p) => [p.name.trim().toLowerCase(), p]));
  const merged = DEFAULT_PRODUCTS.map((p) => ({ ...p, ...byName.get(p.name.toLowerCase()) }));
  const custom = normalized.filter((p) => !DEFAULT_PRODUCTS.some((d) => d.name.toLowerCase() === p.name.toLowerCase()));
  return [...merged, ...custom];
};

const normalizeLine = (raw: Record<string, unknown>, freeze = true): TransactionLine => {
  const crop = cropFrom(raw.crop);
  const productName = String(raw.productName || productNameFromCrop(crop)).trim() || 'Mặt hàng';
  const formulaType = formulaFrom(raw.formulaType);
  const price = Number(raw.pricePerUnit ?? raw.pricePerKg) || 0;
  const line: TransactionLine = {
    id: String(raw.id || uid('line')),
    crop,
    productId: raw.productId ? String(raw.productId) : undefined,
    productName,
    unit: String(raw.unit || 'kg'),
    formulaType,
    grossWeight: Number(raw.grossWeight) || 0,
    tareWeight: Number(raw.tareWeight) || 0,
    qualityPercent: raw.qualityPercent === undefined ? undefined : Number(raw.qualityPercent) || 0,
    lossPercent: raw.lossPercent === undefined ? undefined : Number(raw.lossPercent) || 0,
    pricePerUnit: price,
    pricePerKg: price,
    rawTotal: raw.rawTotal === undefined ? undefined : Number(raw.rawTotal) || 0,
    roundedTotal: raw.roundedTotal === undefined ? undefined : Number(raw.roundedTotal) || 0,
  };
  return freeze ? freezeLineTotals(line) : line;
};

const migrateLegacyTx = (raw: Record<string, unknown>): Transaction => {
  if (Array.isArray(raw.lines)) {
    return {
      id: String(raw.id || uid('tx')),
      date: String(raw.date || new Date().toISOString()),
      supplierId: String(raw.supplierId || GUEST_SUPPLIER_ID),
      supplierName: String(raw.supplierName || 'Khách lẻ'),
      amountPaid: Number(raw.amountPaid) || 0,
      note: raw.note ? String(raw.note) : undefined,
      lines: raw.lines.map((line) => normalizeLine(line as Record<string, unknown>)),
    };
  }

  const gross = Number(raw.grossWeight) || 0;
  const pct = Number(raw.deductionPercent) || 0;
  return {
    id: String(raw.id || uid('tx')),
    date: String(raw.date || new Date().toISOString()),
    supplierId: String(raw.supplierId || GUEST_SUPPLIER_ID),
    supplierName: String(raw.supplierName || 'Khách lẻ'),
    amountPaid: Number(raw.amountPaid) || 0,
    note: raw.note ? String(raw.note) : undefined,
    lines: [
      normalizeLine({
        id: `line-${raw.id || uid('old')}`,
        crop: raw.crop,
        productName: productNameFromCrop(cropFrom(raw.crop)),
        formulaType: 'netAfterTare',
        grossWeight: gross,
        tareWeight: Math.round(gross * (pct / 100) * 100) / 100,
        pricePerUnit: Number(raw.pricePerKg) || 0,
      }),
    ],
  };
};

const normalizeDraft = (raw: Record<string, unknown>): DraftReceipt => {
  const now = new Date().toISOString();
  return {
    id: String(raw.id || uid('draft')),
    status: raw.status === 'waiting' ? 'waiting' : 'draft',
    supplierId: raw.supplierId ? String(raw.supplierId) : undefined,
    supplierName: String(raw.supplierName || ''),
    lines: Array.isArray(raw.lines)
      ? raw.lines.map((line) => normalizeLine(line as Record<string, unknown>, false))
      : [],
    amountPaid: Number(raw.amountPaid) || 0,
    note: raw.note ? String(raw.note) : undefined,
    createdAt: String(raw.createdAt || now),
    updatedAt: String(raw.updatedAt || now),
  };
};

const normalizeNote = (raw: Record<string, unknown>): Note => {
  const now = new Date().toISOString();
  return {
    id: String(raw.id || uid('note')),
    body: String(raw.body || ''),
    pinned: Boolean(raw.pinned),
    done: Boolean(raw.done),
    createdAt: String(raw.createdAt || now),
    updatedAt: String(raw.updatedAt || now),
  };
};

const normalize = (raw: unknown): AppData => {
  if (!raw || typeof raw !== 'object') return buildSeedData();
  const d = raw as Record<string, unknown>;
  return {
    suppliers: (Array.isArray(d.suppliers) ? (d.suppliers as Supplier[]) : []),
    products: normalizeProducts(d.products),
    transactions: Array.isArray(d.transactions)
      ? d.transactions.map((t) => migrateLegacyTx(t as Record<string, unknown>))
      : [],
    drafts: Array.isArray(d.drafts)
      ? d.drafts.map((draft) => normalizeDraft(draft as Record<string, unknown>))
      : [],
    notes: Array.isArray(d.notes) ? d.notes.map((note) => normalizeNote(note as Record<string, unknown>)) : [],
    settings: (d.settings as AppSettings) ?? defaultSettings(),
  };
};

export const loadData = (userId?: string): AppData => {
  const id = userId ?? getSessionUserId();
  if (!id) {
    return { suppliers: [], products: DEFAULT_PRODUCTS, transactions: [], drafts: [], notes: [], settings: defaultSettings() };
  }

  const key = dataKeyForUser(id);
  try {
    const raw = localStorage.getItem(key);
    if (raw) return normalize(JSON.parse(raw));

    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const migrated = normalize(JSON.parse(legacy));
      saveData(migrated, id);
      return migrated;
    }

    const seeded = buildSeedData();
    saveData(seeded, id);
    return seeded;
  } catch {
    return buildSeedData();
  }
};

export const saveData = (data: AppData, userId?: string): void => {
  const id = userId ?? getSessionUserId();
  if (!id) return;
  localStorage.setItem(dataKeyForUser(id), JSON.stringify(data));
};

export const resetData = (userId?: string): AppData => {
  const seeded = buildSeedData();
  saveData(seeded, userId);
  return seeded;
};

export const addSupplier = (
  data: AppData,
  input: Omit<Supplier, 'id'>,
): { data: AppData; supplier: Supplier } => {
  const existing = data.suppliers.find(
    (s) => s.name.trim().toLowerCase() === input.name.trim().toLowerCase(),
  );
  if (existing) return { data, supplier: existing };
  const supplier: Supplier = {
    id: uid('sup'),
    name: input.name.trim(),
    phone: input.phone?.trim(),
    location: input.location?.trim(),
    note: input.note?.trim(),
  };
  return { data: { ...data, suppliers: [...data.suppliers, supplier] }, supplier };
};

const resolveSupplier = (
  data: AppData,
  supplierId: string | undefined,
  supplierName: string,
): { data: AppData; supplierId: string; supplierName: string } => {
  if (supplierId) {
    return {
      data,
      supplierId,
      supplierName: data.suppliers.find((s) => s.id === supplierId)?.name ?? supplierName,
    };
  }

  const name = supplierName.trim();
  if (!name || name === 'Khách lẻ') {
    return { data, supplierId: GUEST_SUPPLIER_ID, supplierName: 'Khách lẻ' };
  }

  const { data: next, supplier } = addSupplier(data, { name });
  return { data: next, supplierId: supplier.id, supplierName: supplier.name };
};

const rememberPrices = (products: readonly Product[], lines: readonly TransactionLine[]): Product[] =>
  products.map((p) => {
    const line = [...lines].reverse().find((l) => l.productId === p.id);
    return line ? { ...p, lastPricePerUnit: line.pricePerUnit } : p;
  });

export const addTransaction = (
  data: AppData,
  input: Omit<Transaction, 'id' | 'supplierId'> & { supplierId?: string },
): { data: AppData; transaction: Transaction } => {
  const resolved = resolveSupplier(data, input.supplierId, input.supplierName);
  const lines = input.lines.map((line) => freezeLineTotals(line));
  const tx: Transaction = {
    ...input,
    id: uid('tx'),
    supplierId: resolved.supplierId,
    supplierName: resolved.supplierName,
    lines,
  };
  return {
    data: {
      ...resolved.data,
      products: rememberPrices(resolved.data.products, lines),
      transactions: [tx, ...resolved.data.transactions],
    },
    transaction: tx,
  };
};

export const recordPayment = (data: AppData, txId: string, amount: number): AppData => ({
  ...data,
  transactions: data.transactions.map((t) => {
    if (t.id !== txId) return t;
    return { ...t, amountPaid: Math.min(transactionTotals(t).total, t.amountPaid + Math.max(amount, 0)) };
  }),
});

export const deleteTransaction = (data: AppData, txId: string): AppData => ({
  ...data,
  transactions: data.transactions.filter((t) => t.id !== txId),
});

export const updateSettings = (data: AppData, settings: Partial<AppSettings>): AppData => ({
  ...data,
  settings: { ...data.settings, ...settings },
});

export const addProduct = (
  data: AppData,
  input: Pick<Product, 'name' | 'unit' | 'formulaType'> & Partial<Pick<Product, 'crop' | 'isSuggested'>>,
): { data: AppData; product: Product } => {
  const name = input.name.trim();
  const existing = data.products.find((p) => p.name.trim().toLowerCase() === name.toLowerCase());
  if (existing) return { data, product: existing };
  const product: Product = {
    id: uid('prod'),
    name,
    unit: input.unit.trim() || 'kg',
    formulaType: input.formulaType,
    isSuggested: Boolean(input.isSuggested),
    isActive: true,
    crop: input.crop,
  };
  return { data: { ...data, products: [...data.products, product] }, product };
};

export const updateProduct = (data: AppData, id: string, patch: Partial<Product>): AppData => ({
  ...data,
  products: data.products.map((p) => (p.id === id ? { ...p, ...patch, id: p.id } : p)),
});

export const upsertDraft = (
  data: AppData,
  draft: Omit<DraftReceipt, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<DraftReceipt, 'id' | 'createdAt'>>,
): { data: AppData; draft: DraftReceipt } => {
  const now = new Date().toISOString();
  const next: DraftReceipt = {
    ...draft,
    id: draft.id ?? uid('draft'),
    createdAt: draft.createdAt ?? now,
    updatedAt: now,
  };
  const exists = data.drafts.some((d) => d.id === next.id);
  return {
    data: {
      ...data,
      drafts: exists ? data.drafts.map((d) => (d.id === next.id ? next : d)) : [next, ...data.drafts],
    },
    draft: next,
  };
};

export const deleteDraft = (data: AppData, draftId: string): AppData => ({
  ...data,
  drafts: data.drafts.filter((d) => d.id !== draftId),
});

const isCompleteLine = (line: TransactionLine): boolean => {
  if (!line.productName.trim() || line.grossWeight <= 0 || line.pricePerUnit <= 0) return false;
  if (line.formulaType === 'rubberLatex') return (line.qualityPercent ?? 0) > 0;
  return true;
};

export const completeDraft = (
  data: AppData,
  draftId: string,
): { data: AppData; transaction: Transaction | null } => {
  const draft = data.drafts.find((d) => d.id === draftId);
  if (!draft) return { data, transaction: null };
  const lines = draft.lines.filter(isCompleteLine);
  if (lines.length === 0) return { data, transaction: null };
  const result = addTransaction(data, {
    date: new Date().toISOString(),
    supplierId: draft.supplierId,
    supplierName: draft.supplierName || 'Khách lẻ',
    lines,
    amountPaid: draft.amountPaid,
    note: draft.note,
  });
  return { data: deleteDraft(result.data, draftId), transaction: result.transaction };
};

export const addNote = (data: AppData, body: string): AppData => {
  const text = body.trim();
  if (!text) return data;
  const now = new Date().toISOString();
  const note: Note = { id: uid('note'), body: text, pinned: false, done: false, createdAt: now, updatedAt: now };
  return { ...data, notes: [note, ...data.notes] };
};

export const updateNote = (data: AppData, id: string, patch: Partial<Note>): AppData => ({
  ...data,
  notes: data.notes.map((n) => (n.id === id ? { ...n, ...patch, id: n.id, updatedAt: new Date().toISOString() } : n)),
});

export const deleteNote = (data: AppData, id: string): AppData => ({
  ...data,
  notes: data.notes.filter((n) => n.id !== id),
});
