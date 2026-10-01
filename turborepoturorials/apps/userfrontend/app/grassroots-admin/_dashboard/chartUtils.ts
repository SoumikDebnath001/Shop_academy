import { useEffect, useRef, useState } from 'react';

// Rounds the top of the axis to a clean number (200, 1.5k, 250k...) and gives about 4 steps
export const niceTicks = (max: number) => {
  if (max <= 0) return [0, 1];
  const rough = max / 4;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= rough) ?? 10 * pow;
  return Array.from({ length: Math.ceil(max / step) + 1 }, (_, i) => i * step);
};

// Short axis labels: 1500 -> 1.5k, 2500000 -> 2.5M
export const compact = (v: number) => (v >= 1e6 ? `${+(v / 1e6).toFixed(1)}M` : v >= 1000 ? `${+(v / 1000).toFixed(1)}k` : String(+v.toFixed(1)));

// Width of an element in pixels, kept up to date when the layout changes (used by the SVG line charts)
export function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}
