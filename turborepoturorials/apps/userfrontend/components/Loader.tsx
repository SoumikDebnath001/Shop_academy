// Reusable loader built on public/loader.svg (a self-animating SVG). Server-safe, so it also works in loading.tsx.
interface LoaderProps {
  label?: string; // read by screen readers
  size?: number;
  className?: string;
}

export default function Loader({ label = 'Loading', size = 120, className = '' }: LoaderProps) {
  return (
    <div role="status" aria-live="polite" className={`flex items-center justify-center ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- animated SVG; next/image would add nothing */}
      <img src="/loader.svg" alt="" width={size} height={size} />
      <span className="sr-only">{label}</span>
    </div>
  );
}

/** Fills the space under the fixed header; used by route loading.tsx files and page-level loading states. */
export function PageLoader({ label = 'Loading page' }: { label?: string }) {
  return <Loader label={label} className="min-h-screen w-full bg-obuya-bg" />;
}
