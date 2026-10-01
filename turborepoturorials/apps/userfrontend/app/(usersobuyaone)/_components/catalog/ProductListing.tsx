'use client';
import React, { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { api } from '@/services/api';
import type { CatalogProduct, ListingSource, ProductPage, ProductQuery, ProductSort } from '@/services/catalog.types';
import Icon from '@/components/Icon';
import Loader from '@/components/Loader';
import { formatPrice } from '../format';
import ProductCard from './ProductCard';
import StarRating from './StarRating';
import { PAGE_SIZE_DESKTOP, PAGE_SIZE_PHONE, PHONE_QUERY } from './listingConfig';
import { useOverlay } from '../useOverlay';

const SORTS: { value: ProductSort; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'rating-desc', label: 'Rating: high to low' },
  { value: 'rating-asc', label: 'Rating: low to high' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
];

const RATING_OPTIONS = [0, 4.5, 4, 3.5, 3];

const subscribePhone = (cb: () => void) => {
  const mq = window.matchMedia(PHONE_QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const usePageSize = () =>
  useSyncExternalStore(subscribePhone, () => (window.matchMedia(PHONE_QUERY).matches ? PAGE_SIZE_PHONE : PAGE_SIZE_DESKTOP), () => PAGE_SIZE_DESKTOP);

const FILTER_DEBOUNCE_MS = 300; // sliders fire on every step; wait for the user to settle

interface Filters {
  brands: string[];
  min: number;
  max: number;
  minRating: number; // 0 = any
  inStockOnly: boolean;
}

interface Props {
  source: ListingSource; // which category (or search) to page through
  initial: ProductPage; // first page (PAGE_SIZE_DESKTOP items, default filters), rendered on the server
}

/**
 * Category product grid. Filtering, sorting and paging run on the server (see api.md), so only the products on
 * screen are ever loaded. "Load more" appends the next page; changing a filter or the sort reloads from page one.
 */
export default function ProductListing({ source, initial }: Props) {
  const sorts = source.section === 'search' ? SORTS.map((s) => (s.value === 'featured' ? { ...s, label: 'Best match' } : s)) : SORTS;
  const { brands, priceMin: priceFloor, priceMax: priceCeil } = initial.facets;
  const pageSize = usePageSize();

  const defaults: Filters = { brands: [], min: priceFloor, max: priceCeil, minRating: 0, inStockOnly: false };
  const [filters, setFilters] = useState<Filters>(defaults);
  const [sort, setSort] = useState<ProductSort>('featured');
  const [items, setItems] = useState<CatalogProduct[]>(initial.products);
  const [total, setTotal] = useState(initial.total);
  const [shown, setShown] = useState<number | null>(null); // null = first page at the current page size
  const [status, setStatus] = useState<'idle' | 'reloading' | 'loading-more' | 'reload-error' | 'more-error'>('idle');
  const [retryKey, setRetryKey] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const requestId = useRef(0); // ignore responses that arrive after a newer request
  const isFirstRun = useRef(true);

  const visibleCount = Math.min(shown ?? pageSize, items.length);
  const visible = items.slice(0, visibleCount);
  const hasMore = visibleCount < total;

  const toQuery = useCallback(
    (offset: number, limit: number): ProductQuery => ({
      brands: filters.brands,
      minPrice: filters.min > priceFloor ? filters.min : undefined,
      maxPrice: filters.max < priceCeil ? filters.max : undefined,
      minRating: filters.minRating || undefined,
      inStock: filters.inStockOnly || undefined,
      sort,
      offset,
      limit,
    }),
    [filters, sort, priceFloor, priceCeil],
  );

  // Filters or sort changed: reload from the first page (debounced).
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return; // the server already rendered page one with the default filters
    }
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      setStatus('reloading');
      try {
        const res = await api.getCatalogPage(source, toQuery(0, pageSize));
        if (id !== requestId.current || !res) return;
        setItems(res.products);
        setTotal(res.total);
        setShown(pageSize);
        setStatus('idle');
      } catch {
        if (id === requestId.current) setStatus('reload-error');
      }
    }, FILTER_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // pageSize is read at request time; a resize alone should not reload the list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toQuery, retryKey]);

  const loadMore = async () => {
    const target = visibleCount + pageSize;
    if (items.length >= Math.min(target, total)) return setShown(target); // already buffered
    const id = ++requestId.current;
    setStatus('loading-more');
    try {
      const res = await api.getCatalogPage(source, toQuery(items.length, target - items.length));
      if (id !== requestId.current || !res) return;
      setItems((prev) => [...prev, ...res.products]);
      setTotal(res.total);
      setShown(target);
      setStatus('idle');
    } catch {
      if (id === requestId.current) setStatus('more-error');
    }
  };

  const activeCount =
    filters.brands.length +
    (filters.min > priceFloor || filters.max < priceCeil ? 1 : 0) +
    (filters.minRating ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0);

  const update = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const clearAll = () => setFilters(defaults);

  const closeDrawer = useCallback(() => setDrawerOpen(false), [setDrawerOpen]);
  useOverlay(drawerOpen, closeDrawer);

  const reloading = status === 'reloading';

  const panel = (
    <FilterPanel
      brands={brands}
      priceFloor={priceFloor}
      priceCeil={priceCeil}
      filters={filters}
      activeCount={activeCount}
      onChange={update}
      onClear={clearAll}
    />
  );

  return (
    <div className="lg:grid lg:grid-cols-[243px_1fr] lg:gap-8 items-start">
      <aside className="hidden lg:block sticky top-[94px]">{panel}</aside>

      <section aria-label="Products" aria-busy={reloading || status === 'loading-more'}>
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden h-10 px-4 flex items-center gap-2 rounded-md border border-obuya-line bg-obuya-panel text-[14px] font-medium text-obuya-ink"
            >
              <Icon name="tune" size={20} />
              Filters{activeCount ? ` (${activeCount})` : ''}
            </button>
            <p className="text-[13px] text-obuya-muted" aria-live="polite">
              {reloading ? 'Updating…' : `${visible.length} of ${total} products`}
            </p>
          </div>
          <label className="flex items-center gap-2 text-[13px] text-obuya-muted">
            <span className="hidden sm:inline">Sort by</span>
            <span className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as ProductSort)}
                className="appearance-none h-10 pl-3 pr-9 rounded-md border border-obuya-gold/70 bg-obuya-panel text-[13px] text-obuya-ink cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-obuya-gold"
              >
                {sorts.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <Icon name="expand_more" size={18} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-obuya-ink" />
            </span>
          </label>
        </div>

        {reloading ? (
          <Loader label="Loading products" size={96} className="py-24" />
        ) : status !== 'reload-error' && visible.length ? (
          <>
            <ul className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-x-4 md:gap-x-5 gap-y-7">
              {visible.map((p, i) => (
                // Simple fade-up for each newly shown card; a small stagger within the batch, no layout measuring.
                <li key={p.id} className="obuya-fade-up" style={{ animationDelay: `${(i % pageSize) * 35}ms` }}>
                  <ProductCard product={p} />
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-col items-center gap-3">
              {status === 'loading-more' ? (
                <Loader label="Loading more products" size={72} />
              ) : status === 'more-error' ? (
                <button type="button" onClick={loadMore} className="h-11 px-6 rounded-md border border-obuya-maroon text-obuya-maroon text-[14px] font-semibold hover:bg-obuya-maroon hover:text-white transition-colors">
                  Couldn&apos;t load products. Try again
                </button>
              ) : hasMore ? (
                <button
                  type="button"
                  onClick={loadMore}
                  className="h-11 px-8 rounded-md border border-obuya-gold text-obuya-ink text-[14px] font-semibold hover:bg-obuya-gold hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-obuya-gold"
                >
                  Load more
                </button>
              ) : (
                total > pageSize && <p className="text-[13px] text-obuya-muted">You&apos;ve seen all {total} products</p>
              )}
              {hasMore && status === 'idle' && (
                <div className="w-40 h-1 rounded-full bg-obuya-line/40 overflow-hidden" aria-hidden>
                  <div className="h-full bg-obuya-gold transition-[width] duration-300" style={{ width: `${(visible.length / total) * 100}%` }} />
                </div>
              )}
            </div>
          </>
        ) : status === 'reload-error' ? (
          <div className="py-20 text-center">
            <p className="text-[15px] text-obuya-ink">Couldn&apos;t load products.</p>
            <button type="button" onClick={() => setRetryKey((k) => k + 1)} className="mt-4 h-10 px-5 rounded-md bg-obuya-maroon text-white text-[14px] font-medium hover:opacity-90">
              Try again
            </button>
          </div>
        ) : (
          <div className="py-20 text-center">
            <Icon name="filter_alt_off" size={44} className="text-obuya-muted" />
            <p className="mt-2 text-[15px] text-obuya-ink">No products match these filters.</p>
            <button type="button" onClick={clearAll} className="mt-4 h-10 px-5 rounded-md bg-obuya-maroon text-white text-[14px] font-medium hover:opacity-90">
              Clear filters
            </button>
          </div>
        )}
      </section>

      {/* Mobile / tablet filter drawer */}
      <div className={`lg:hidden fixed inset-0 z-[60] ${drawerOpen ? '' : 'pointer-events-none'}`} inert={!drawerOpen}>
        <div onClick={() => setDrawerOpen(false)} className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${drawerOpen ? 'opacity-100' : 'opacity-0'}`} />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
          className={`absolute inset-x-0 bottom-0 max-h-[85vh] flex flex-col rounded-t-2xl bg-obuya-bg transition-transform duration-300 ease-out ${drawerOpen ? 'translate-y-0' : 'translate-y-full'}`}
        >
          <div className="flex-1 overflow-y-auto p-4">{panel}</div>
          <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-obuya-line/60">
            <button type="button" onClick={() => setDrawerOpen(false)} className="w-full h-12 rounded-md bg-obuya-maroon text-white text-[15px] font-semibold">
              {reloading ? 'Updating…' : `Show ${total} products`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FilterPanelProps {
  brands: string[];
  priceFloor: number;
  priceCeil: number;
  filters: Filters;
  activeCount: number;
  onChange: (patch: Partial<Filters>) => void;
  onClear: () => void;
}

const sectionTitle = 'float-left w-full mb-3 text-[12px] font-bold uppercase tracking-[0.12em] text-obuya-gold';

function FilterPanel({ brands, priceFloor, priceCeil, filters, activeCount, onChange, onClear }: FilterPanelProps) {
  const ratingGroup = useId(); // the panel renders twice (sidebar + mobile drawer); radio groups must not collide
  const span = priceCeil - priceFloor || 1;
  const fill = (v: number) => ({ '--fill': `${((v - priceFloor) / span) * 100}%` }) as React.CSSProperties;
  const step = Math.max(50, Math.round(span / 50 / 50) * 50);

  return (
    <div className="rounded-md bg-obuya-panel border-t-[3px] border-obuya-maroon px-5 py-5">
      <div className="flex items-center justify-between pb-4 border-b border-obuya-line/40">
        <h2 className="font-headline-lg text-[22px] font-bold text-obuya-ink">Filters</h2>
        {activeCount > 0 && (
          <button type="button" onClick={onClear} className="text-[13px] font-medium text-obuya-gold hover:underline">
            Clear all ({activeCount})
          </button>
        )}
      </div>

      <fieldset className="py-5 border-b border-obuya-line/40">
        <legend className={sectionTitle}>Brand</legend>
        <div className="clear-both space-y-2.5">
          {brands.map((brand) => (
            <label key={brand} className="flex items-center gap-2.5 text-[14px] text-obuya-ink cursor-pointer">
              <input
                type="checkbox"
                checked={filters.brands.includes(brand)}
                onChange={(e) =>
                  onChange({ brands: e.target.checked ? [...filters.brands, brand] : filters.brands.filter((b) => b !== brand) })
                }
                className="w-4 h-4 rounded-sm accent-obuya-maroon cursor-pointer"
              />
              {brand}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="py-5 border-b border-obuya-line/40">
        <legend className={sectionTitle}>Price range</legend>
        <div className="clear-both flex justify-between text-[13px] font-medium text-obuya-gold mb-3">
          <span>{formatPrice(filters.min)}</span>
          <span>{formatPrice(filters.max)}</span>
        </div>
        <label className="block text-[12px] text-obuya-muted">
          Min
          <input
            type="range"
            min={priceFloor}
            max={priceCeil}
            step={step}
            value={filters.min}
            onChange={(e) => onChange({ min: Math.min(Number(e.target.value), filters.max) })}
            className="obuya-range mt-2 mb-4"
            style={fill(filters.min)}
          />
        </label>
        <label className="block text-[12px] text-obuya-muted">
          Max
          <input
            type="range"
            min={priceFloor}
            max={priceCeil}
            step={step}
            value={filters.max}
            onChange={(e) => onChange({ max: Math.max(Number(e.target.value), filters.min) })}
            className="obuya-range mt-2"
            style={fill(filters.max)}
          />
        </label>
      </fieldset>

      <fieldset className="py-5 border-b border-obuya-line/40">
        <legend className={sectionTitle}>Rating</legend>
        <div className="clear-both space-y-2.5">
          {RATING_OPTIONS.map((r) => (
            <label key={r} className="flex items-center gap-2.5 text-[14px] text-obuya-ink cursor-pointer">
              <input
                type="radio"
                name={ratingGroup}
                checked={filters.minRating === r}
                onChange={() => onChange({ minRating: r })}
                className="w-4 h-4 accent-obuya-maroon cursor-pointer"
              />
              {r === 0 ? (
                'Any rating'
              ) : (
                <span className="flex items-center gap-1.5">
                  <StarRating value={r} size={15} />
                  <span className="text-[13px] text-obuya-muted">{r} &amp; up</span>
                </span>
              )}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="pt-5">
        <legend className={sectionTitle}>Availability</legend>
        <label className="clear-both flex items-center justify-between text-[14px] text-obuya-ink cursor-pointer">
          In stock only
          <button
            type="button"
            role="switch"
            aria-checked={filters.inStockOnly}
            onClick={() => onChange({ inStockOnly: !filters.inStockOnly })}
            className={`relative w-10 h-6 rounded-full transition-colors ${filters.inStockOnly ? 'bg-obuya-maroon' : 'bg-obuya-track/40'}`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform ${filters.inStockOnly ? 'translate-x-4 bg-obuya-gold' : 'bg-white'}`}
            />
          </button>
        </label>
      </fieldset>
    </div>
  );
}
