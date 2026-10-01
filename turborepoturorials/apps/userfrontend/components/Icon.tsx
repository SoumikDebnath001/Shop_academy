import type { CSSProperties } from 'react';

interface IconProps {
  name: string; // Material Symbols name
  size?: number;
  filled?: boolean;
  weight?: number; // 100–700; lower = thinner line
  className?: string;
}

// Material Symbols icon. Size is set inline because Google's icon stylesheet is unlayered and would
// otherwise override Tailwind text-size classes. For the same reason, display classes (hidden, sm:inline, ...)
// do NOT work on <Icon>: wrap it in a <span className="hidden sm:flex"> instead.
export default function Icon({ name, size = 24, filled = false, weight = 400, className = '' }: IconProps) {
  const style: CSSProperties = {
    fontSize: size,
    fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${weight}, 'opsz' ${Math.min(48, Math.max(20, size))}`,
  };
  return (
    <span aria-hidden className={`material-symbols-outlined leading-none select-none ${className}`} style={style}>
      {name}
    </span>
  );
}
