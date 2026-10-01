'use client';
import { useState } from 'react';
import { api } from '@/services/api';
import type { CatalogProduct, FeaturedTab } from '@/services/catalog.types';
import Loader from '@/components/Loader';
import ProductCard from '../catalog/ProductCard';
import { SectionTitle } from './ShopBySport';

const FEATURED_COUNT = 12; // 3 rows of 4 on laptop, 6 rows of 2 on phones

const TABS: { key: FeaturedTab; label: string }[] = [
  { key: 'new', label: 'New Arrivals' },
  { key: 'best', label: 'Best Sellers' },
  { key: 'bundles', label: 'Bundles' },
];

/** "Featured Picks" with New Arrivals / Best Sellers / Bundles tabs. Each tab loads once, then is cached. */
export default function FeaturedPicks({ initial }: { initial: CatalogProduct[] }) {
  const [tab, setTab] = useState<FeaturedTab>('new');
  const [cache, setCache] = useState<Partial<Record<FeaturedTab, CatalogProduct[]>>>({ new: initial });

  const select = async (next: FeaturedTab) => {
    setTab(next);
    if (cache[next]) return;
    const products = await api.getFeaturedProducts(next, FEATURED_COUNT).catch(() => []);
    setCache((c) => ({ ...c, [next]: products }));
  };

  const products = cache[tab];

  return (
    <section aria-labelledby="featured-picks" className="max-w-[1328px] mx-auto px-margin-mobile md:px-6 pt-10 md:pt-14">
      <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6 mb-5 md:mb-6">
        <SectionTitle id="featured-picks">Featured Picks</SectionTitle>
        <div role="tablist" aria-label="Featured picks" className="flex gap-5 md:pt-2 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              type="button"
              aria-selected={tab === t.key}
              onClick={() => select(t.key)}
              className={`relative shrink-0 pb-1.5 text-[13px] transition-colors ${tab === t.key ? 'text-obuya-ink font-medium' : 'text-obuya-muted hover:text-obuya-ink'}`}
            >
              {t.label}
              {tab === t.key && <span className="absolute bottom-0 inset-x-0 h-[2px] rounded-full bg-obuya-gold" />}
            </button>
          ))}
        </div>
      </div>
      {!products ? (
        <Loader label="Loading picks" size={88} className="py-16" />
      ) : (
        <ul key={tab} role="tabpanel" className="grid grid-cols-2 md:grid-cols-4 gap-x-3 md:gap-x-5 gap-y-6">
          {products.map((p, i) => (
            <li key={p.id} className="obuya-fade-up" style={{ animationDelay: `${(i % 4) * 50}ms` }}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
