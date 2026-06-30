import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AppData } from '../domain/types';
import { DEFAULT_PRODUCTS } from '../domain/types';
import { useAuth } from './AuthProvider';
import * as repo from './storage';
import { StoreContext, type StoreValue } from './useStore';

const emptyData = (): AppData => ({
  suppliers: [],
  products: DEFAULT_PRODUCTS,
  transactions: [],
  drafts: [],
  notes: [],
  settings: { defaultWeightUnit: 'kg' },
});

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [data, setData] = useState<AppData>(() => (userId ? repo.loadData(userId) : emptyData()));

  useEffect(() => {
    if (!userId) return;
    setData(repo.loadData(userId));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    repo.saveData(data, userId);
  }, [data, userId]);

  const value = useMemo<StoreValue>(
    () => ({
      data,
      addTransaction: (input) => {
        const result = repo.addTransaction(data, input);
        setData(result.data);
        return result.transaction;
      },
      addSupplier: (input) => {
        const result = repo.addSupplier(data, input);
        setData(result.data);
        return result.supplier;
      },
      addProduct: (input) => {
        const result = repo.addProduct(data, input);
        setData(result.data);
        return result.product;
      },
      updateProduct: (id, patch) => setData((d) => repo.updateProduct(d, id, patch)),
      upsertDraft: (draft) => {
        const result = repo.upsertDraft(data, draft);
        setData(result.data);
        return result.draft;
      },
      deleteDraft: (draftId) => setData((d) => repo.deleteDraft(d, draftId)),
      completeDraft: (draftId) => {
        const result = repo.completeDraft(data, draftId);
        setData(result.data);
        return result.transaction;
      },
      recordPayment: (txId, amount) => setData((d) => repo.recordPayment(d, txId, amount)),
      deleteTransaction: (txId) => setData((d) => repo.deleteTransaction(d, txId)),
      addNote: (body) => setData((d) => repo.addNote(d, body)),
      updateNote: (id, patch) => setData((d) => repo.updateNote(d, id, patch)),
      deleteNote: (id) => setData((d) => repo.deleteNote(d, id)),
      updateSettings: (settings) => setData((d) => repo.updateSettings(d, settings)),
      reset: () => userId && setData(repo.resetData(userId)),
    }),
    [data, userId],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
