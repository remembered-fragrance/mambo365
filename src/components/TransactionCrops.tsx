import { transactionCrops } from '../domain/calc';
import type { CropType, Transaction } from '../domain/types';
import { CropBadge } from './CropBadge';
import { CropIcon } from './CropIcon';

export function TransactionCrops({ transaction }: { transaction: Transaction }) {
  const crops = transactionCrops(transaction) as CropType[];
  return (
    <div className="flex flex-wrap gap-1">
      {crops.map((c) => (
        <CropBadge key={c} crop={c} />
      ))}
    </div>
  );
}

export function TransactionCropIcon({ transaction, className }: { transaction: Transaction; className?: string }) {
  const crop = transaction.lines[0]?.crop ?? 'rubber';
  return <CropIcon crop={crop} className={className} />;
}
