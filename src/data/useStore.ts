import { createContext, useContext } from 'react';
import type { AppData, AppSettings, DraftReceipt, Note, Product, Supplier, Transaction } from '../domain/types';

export interface StoreValue {
  readonly data: AppData;
  addTransaction: (input: Omit<Transaction, 'id' | 'supplierId'> & { supplierId?: string }) => Transaction;
  addSupplier: (input: Omit<Supplier, 'id'>) => Supplier;
  addProduct: (
    input: Pick<Product, 'name' | 'unit' | 'formulaType'> & Partial<Pick<Product, 'crop' | 'isSuggested'>>,
  ) => Product;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  upsertDraft: (
    draft: Omit<DraftReceipt, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<DraftReceipt, 'id' | 'createdAt'>>,
  ) => DraftReceipt;
  deleteDraft: (draftId: string) => void;
  completeDraft: (draftId: string) => Transaction | null;
  recordPayment: (txId: string, amount: number) => void;
  deleteTransaction: (txId: string) => void;
  addNote: (body: string) => void;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  reset: () => void;
}

export const StoreContext = createContext<StoreValue | null>(null);

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
