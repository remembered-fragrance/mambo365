import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AppData } from '../domain/types';
import { useAuth } from './AuthProvider';
import * as repo from './storage';
import { StoreContext, type StoreValue } from './useStore';

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [data, setData] = useState<AppData>(() =>
    userId ? repo.loadData(userId) : { suppliers: [], transactions: [], settings: { defaultWeightUnit: 'kg' } },
  );

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
      recordPayment: (txId, amount) => setData((d) => repo.recordPayment(d, txId, amount)),
      deleteTransaction: (txId) => setData((d) => repo.deleteTransaction(d, txId)),
      updateSettings: (settings) => setData((d) => repo.updateSettings(d, settings)),
      reset: () => userId && setData(repo.resetData(userId)),
    }),
    [data, userId],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
