import type { CropType, Transaction } from '../domain/types';
import { CropBadge } from './CropBadge';
import { ProductIcon } from './CropIcon';

export function TransactionCrops({ transaction }: { transaction: Transaction }) {
  const products = [
    ...new Map(
      transaction.lines.map((line) => [
        line.productName,
        { name: line.productName || 'Mặt hàng', crop: line.crop },
      ]),
    ).values(),
  ];
  return (
    <div className="flex flex-wrap gap-1">
      {products.map((p) => (
        <CropBadge key={p.name} crop={p.crop as CropType | undefined} name={p.name} />
      ))}
    </div>
  );
}

export function TransactionCropIcon({ transaction, className }: { transaction: Transaction; className?: string }) {
  const line = transaction.lines[0];
  return <ProductIcon crop={line?.crop} name={line?.productName ?? 'Mặt hàng'} className={className} />;
}
