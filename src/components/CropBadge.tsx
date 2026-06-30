import { cropMeta, type CropType } from '../domain/types';
import { CropIcon } from './CropIcon';

export function CropBadge({ crop }: { crop: CropType }) {
  const m = cropMeta(crop);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${m.badge}`}>
      <CropIcon crop={crop} className="text-sm" />
      {m.label}
    </span>
  );
}
