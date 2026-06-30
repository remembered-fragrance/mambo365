import { cropMeta, type CropType } from '../domain/types';

interface CropIconProps {
  readonly crop: CropType;
  readonly className?: string;
}

/** Hồ tiêu dùng icon hạt tiêu (không dùng emoji trái ớt). */
export function CropIcon({ crop, className = 'text-lg' }: CropIconProps) {
  if (crop === 'pepper') {
    return (
      <img
        src="/icons/pepper.svg"
        alt=""
        aria-hidden
        crossOrigin="anonymous"
        className={`inline-block h-[1.15em] w-[1.15em] shrink-0 ${className}`}
      />
    );
  }
  return (
    <span className={className} aria-hidden>
      {cropMeta(crop)?.emoji}
    </span>
  );
}

export function ProductIcon({
  crop,
  name,
  className = 'text-lg',
}: {
  readonly crop?: CropType;
  readonly name: string;
  readonly className?: string;
}) {
  if (crop) return <CropIcon crop={crop} className={className} />;
  return (
    <span
      aria-hidden
      className={`inline-flex h-[1.8em] w-[1.8em] items-center justify-center rounded-full bg-slate-100 text-[0.72em] font-bold text-slate-600 ${className}`}
    >
      {name.trim().charAt(0).toUpperCase() || 'M'}
    </span>
  );
}

export function AppLogo({ className = 'h-9' }: { className?: string }) {
  return (
    <img
      src="/iconapp.jpg"
      alt="THUMUA365"
      crossOrigin="anonymous"
      className={`w-auto object-contain ${className}`}
    />
  );
}
