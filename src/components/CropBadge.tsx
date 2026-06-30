import { cropMeta, type CropType } from '../domain/types';
import { ProductIcon } from './CropIcon';

export function CropBadge({ crop, name }: { crop?: CropType; name: string }) {
  const m = cropMeta(crop);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        m?.badge ?? 'bg-slate-100 text-slate-700'
      }`}
    >
      <ProductIcon crop={crop} name={name} className="text-sm" />
      {name}
    </span>
  );
}
