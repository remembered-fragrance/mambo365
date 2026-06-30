import { createContext, useContext } from 'react';
import type { AppData, AppSettings, Supplier, Transaction } from '../domain/types';

export interface StoreValue {
  readonly data: AppData;
  addTransaction: (input: Omit<Transaction, 'id' | 'supplierId'> & { supplierId?: string }) => Transaction;
  addSupplier: (input: Omit<Supplier, 'id'>) => Supplier;
  recordPayment: (txId: string, amount: number) => void;
  deleteTransaction: (txId: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  reset: () => void;
}

export const StoreContext = createContext<StoreValue | null>(null);

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
