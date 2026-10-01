'use client';
import { useId, useState } from 'react';
import type { ProductDetail } from '@/services/catalog.types';

const TABS = ['Description', 'Specifications', 'Shipping & Returns'] as const;

/** Description / Specifications / Shipping & Returns tabs (accessible tablist, arrow keys switch tabs). */
export default function ProductTabs({ product }: { product: Pick<ProductDetail, 'description' | 'specifications' | 'shippingReturns'> }) {
  const [active, setActive] = useState(0);
  const id = useId();

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const next = (active + (e.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length;
    setActive(next);
    document.getElementById(`${id}-tab-${next}`)?.focus();
  };

  return (
    <div>
      <div role="tablist" aria-label="Product details" onKeyDown={onKey} className="flex gap-6 sm:gap-10 border-b border-obuya-line/40 overflow-x-auto">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            id={`${id}-tab-${i}`}
            role="tab"
            type="button"
            aria-selected={i === active}
            aria-controls={`${id}-panel`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            className={`relative shrink-0 pb-3 text-[14px] transition-colors ${i === active ? 'text-obuya-ink font-medium' : 'text-obuya-muted hover:text-obuya-ink'}`}
          >
            {tab}
            {i === active && <span className="absolute -bottom-px inset-x-0 h-[2px] bg-obuya-gold" />}
          </button>
        ))}
      </div>
      <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${active}`} className="pt-5 text-[14px] leading-relaxed text-obuya-muted">
        {active === 0 && <p>{product.description}</p>}
        {active === 1 && (
          <dl className="divide-y divide-obuya-line/30">
            {product.specifications.map((s) => (
              <div key={s.label} className="flex gap-4 py-2">
                <dt className="w-32 shrink-0 text-obuya-ink font-medium">{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {active === 2 && (
          <ul className="space-y-2 list-disc pl-5">
            {product.shippingReturns.map((line) => <li key={line}>{line}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
}
