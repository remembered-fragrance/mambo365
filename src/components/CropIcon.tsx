import { cropMeta, type CropType } from '../domain/types';

interface CropIconProps {
  readonly crop: CropType;
  readonly className?: string;
}

/** Hồ tiêu dùng icon hạt tiêu (không dùng 🌶️ trái ớt). */
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
      {cropMeta(crop).emoji}
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
