'use client';
import { useToast } from '@/components/ToastProvider';
import { SOCIAL_LINKS } from './shop/links';

// Simple line/fill marks drawn for this site (24×24, currentColor).
const MARKS: Record<(typeof SOCIAL_LINKS)[number]['name'], React.ReactNode> = {
  Instagram: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  YouTube: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <rect x="2" y="5" width="20" height="14" rx="4.5" />
      <path d="M10 9.2v5.6l5-2.8z" fill="var(--yt-play, #7a1d2e)" />
    </svg>
  ),
  Facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" />
      <path d="M13.2 21.9v-7.1h2.4l.4-2.8h-2.8v-1.8c0-.8.3-1.4 1.4-1.4h1.5V6.3c-.3 0-1.2-.1-2.2-.1-2.2 0-3.6 1.3-3.6 3.7V12H8v2.8h2.3v7.1z" fill="var(--fb-f, #7a1d2e)" />
    </svg>
  ),
};

/** Instagram / YouTube / Facebook icons that "dance" (staggered), used in the Follow bar and the footer. */
export default function SocialIcons({ className = '', size = 22, cutout = '#7a1d2e' }: { className?: string; size?: number; cutout?: string }) {
  const { triggerToast } = useToast();
  return (
    <ul className={`flex items-center gap-4 ${className}`} style={{ '--yt-play': cutout, '--fb-f': cutout } as React.CSSProperties}>
      {SOCIAL_LINKS.map((s, i) => {
        const common = {
          'aria-label': `Obuya on ${s.name}`,
          className: 'obuya-dance block rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-obuya-gold',
          style: { '--i': i, width: size, height: size } as React.CSSProperties,
        };
        return (
          <li key={s.name}>
            {s.url ? (
              <a href={s.url} target="_blank" rel="noopener noreferrer" {...common}>{MARKS[s.name]}</a>
            ) : (
              <button type="button" onClick={() => triggerToast(`Our ${s.name} page is coming soon`)} {...common}>{MARKS[s.name]}</button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
