import type { AppData, AppSettings, Supplier, Transaction, TransactionLine } from '../domain/types';
import { dataKeyForUser, getSessionUserId } from './auth';
import { buildSeedData } from './seed';

const LEGACY_KEY = 'thumua365:data:v1';

const defaultSettings = (): AppSettings => ({ defaultWeightUnit: 'kg' });

const uid = (prefix: string): string =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const migrateLegacyTx = (raw: Record<string, unknown>): Transaction => {
  if (Array.isArray(raw.lines)) {
    return raw as unknown as Transaction;
  }
  const gross = Number(raw.grossWeight) || 0;
  const pct = Number(raw.deductionPercent) || 0;
  return {
    id: String(raw.id),
    date: String(raw.date),
    supplierId: String(raw.supplierId),
    supplierName: String(raw.supplierName),
    amountPaid: Number(raw.amountPaid) || 0,
    note: raw.note ? String(raw.note) : undefined,
    lines: [
      {
        id: `line-${raw.id}`,
        crop: raw.crop as TransactionLine['crop'],
        grossWeight: gross,
        tareWeight: Math.round(gross * (pct / 100) * 100) / 100,
        pricePerKg: Number(raw.pricePerKg) || 0,
      },
    ],
  };
};

const normalize = (raw: unknown): AppData => {
  if (!raw || typeof raw !== 'object') return buildSeedData();
  const d = raw as Record<string, unknown>;
  const transactions = Array.isArray(d.transactions)
    ? d.transactions.map((t) => migrateLegacyTx(t as Record<string, unknown>))
    : [];
  return {
    suppliers: (d.suppliers as Supplier[]) ?? [],
    transactions,
    settings: (d.settings as AppSettings) ?? defaultSettings(),
  };
};

export const loadData = (userId?: string): AppData => {
  const id = userId ?? getSessionUserId();
  if (!id) return { suppliers: [], transactions: [], settings: defaultSettings() };

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

export const addTransaction = (
  data: AppData,
  input: Omit<Transaction, 'id' | 'supplierId'> & { supplierId?: string },
): { data: AppData; transaction: Transaction } => {
  let suppliers = data.suppliers;
  let supplierId = input.supplierId;

  if (!supplierId) {
    const { data: next, supplier } = addSupplier(data, {
      name: input.supplierName,
    });
    suppliers = next.suppliers;
    supplierId = supplier.id;
  }

  const tx: Transaction = {
    ...input,
    id: uid('tx'),
    supplierId,
    supplierName:
      suppliers.find((s) => s.id === supplierId)?.name ?? input.supplierName,
  };
  return {
    data: { suppliers, transactions: [tx, ...data.transactions], settings: data.settings },
    transaction: tx,
  };
};

export const recordPayment = (data: AppData, txId: string, amount: number): AppData => ({
  ...data,
  transactions: data.transactions.map((t) =>
    t.id === txId ? { ...t, amountPaid: t.amountPaid + Math.max(amount, 0) } : t,
  ),
});

export const deleteTransaction = (data: AppData, txId: string): AppData => ({
  ...data,
  transactions: data.transactions.filter((t) => t.id !== txId),
});

export const updateSettings = (data: AppData, settings: Partial<AppSettings>): AppData => ({
  ...data,
  settings: { ...data.settings, ...settings },
});
