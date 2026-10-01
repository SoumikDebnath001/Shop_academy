'use client';
import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { clearRecent, POPULAR_SEARCHES, readRecent } from './useProductSearch';

/** Shown before typing: recent searches (this browser) and popular searches. */
export default function SearchStart({ onPick, compact }: { onPick: (term: string) => void; compact?: boolean }) {
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => {
    const t = setTimeout(() => setRecent(readRecent()), 0); // localStorage is browser-only; read after mount
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={compact ? 'p-4 space-y-4' : 'px-4 py-5 space-y-6'}>
      {recent.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-[11px] font-bold tracking-[0.12em] uppercase text-obuya-gold">Recent</h3>
            <button type="button" onClick={() => { clearRecent(); setRecent([]); }} className="text-[12px] text-obuya-muted hover:text-obuya-ink">Clear</button>
          </div>
          <ul>
            {recent.map((r) => (
              <li key={r}>
                <button type="button" onClick={() => onPick(r)} className={`w-full flex items-center gap-3 rounded-md px-1 ${compact ? 'py-1.5 text-[14px]' : 'py-2.5 text-[15px]'} text-obuya-ink hover:bg-obuya-ink/5`}>
                  <Icon name="history" size={19} className="text-obuya-muted" /> {r}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section>
        <h3 className="mb-2.5 text-[11px] font-bold tracking-[0.12em] uppercase text-obuya-gold">Popular</h3>
        <div className="flex flex-wrap gap-2">
          {POPULAR_SEARCHES.map((p) => (
            <button key={p} type="button" onClick={() => onPick(p)} className="h-8 px-3 rounded-full border border-obuya-line/60 bg-obuya-panel text-[13px] text-obuya-ink hover:border-obuya-gold transition-colors">
              {p}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
