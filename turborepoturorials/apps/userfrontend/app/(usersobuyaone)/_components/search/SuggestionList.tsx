'use client';
import Link from 'next/link';
import Icon from '@/components/Icon';
import Loader from '@/components/Loader';
import type { CatalogProduct } from '@/services/catalog.types';
import { formatPrice } from '../format';
import { ArtTile } from '../catalog/ProductArt';
import { productHref } from '../shop/links';
import { MIN_QUERY, searchHref, type SearchState } from './useProductSearch';

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Bold the parts of `text` that match any typed word. */
export function Highlight({ text, query }: { text: string; query: string }) {
  const terms = query.trim().split(/\s+/).filter(Boolean).map(escapeRegex);
  if (!terms.length) return <>{text}</>;
  const parts = text.split(new RegExp(`(${terms.join('|')})`, 'ig'));
  return (
    <>
      {parts.map((part, i) => (i % 2 ? <mark key={i} className="bg-transparent text-obuya-gold font-semibold">{part}</mark> : part))}
    </>
  );
}

export const categoryLabel = (p: CatalogProduct) =>
  p.ref.section === 'sports' ? `${p.ref.sport[0].toUpperCase()}${p.ref.sport.slice(1)} · ${p.ref.category.replace(/-/g, ' ')}` : `Apparel · ${p.ref.category.replace(/-/g, ' ')}`;

interface Props {
  state: SearchState;
  query: string;
  activeIndex: number; // keyboard-highlighted row (-1 = none); last row index = "see all"
  listId: string;
  onPick: () => void; // called when the user follows a link (close the search, remember the term)
}

/** Dropdown / sheet content: hint, loader, up to 6 products, and "See all N results". */
export default function SuggestionList({ state, query, activeIndex, listId, onPick }: Props) {
  if (state.status === 'idle') return null;
  if (state.status === 'short') {
    return (
      <p className="px-4 py-5 text-[13px] text-obuya-muted text-center">
        Type {state.remaining} more character{state.remaining > 1 ? 's' : ''} to search (min {MIN_QUERY})
      </p>
    );
  }
  if (state.status === 'error') return <p className="px-4 py-5 text-[13px] text-obuya-maroon text-center">Search is unavailable right now.</p>;

  const data = state.status === 'done' ? state.data : state.previous;
  const pickable = state.status === 'done';
  if (!data) return <Loader label="Searching" size={64} className="py-6" />;
  if (!data.products.length) {
    return (
      <div className="px-4 py-6 text-center">
        <Icon name="search_off" size={34} weight={300} className="text-obuya-muted" />
        <p className="mt-1 text-[14px] text-obuya-ink">No products match “{query.trim()}”</p>
        <p className="text-[12px] text-obuya-muted">Try a sport, a category or a brand, like “cricket” or “jersey”.</p>
      </div>
    );
  }

  return (
    <div className={state.status === 'loading' ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
      <ul id={listId} role="listbox" aria-label="Suggested products" className="py-1.5">
        {data.products.map((p, i) => (
          <li key={p.id} role="option" aria-selected={pickable && activeIndex === i} id={`${listId}-${i}`}>
            <Link
              href={productHref(p.id, p.ref)}
              onClick={onPick}
              className={`flex items-center gap-3 px-3 py-2 mx-1.5 rounded-md transition-colors ${pickable && activeIndex === i ? 'bg-obuya-gold/15' : 'hover:bg-obuya-ink/5'}`}
            >
              <ArtTile image={p.image} icon={p.icon} iconSize={18} className="w-12 shrink-0" />
              <span className="flex-1 min-w-0">
                <span className="block text-[14px] text-obuya-ink truncate"><Highlight text={p.name} query={query} /></span>
                <span className="block text-[11px] text-obuya-muted capitalize truncate">{categoryLabel(p)} · {p.brand}</span>
              </span>
              <span className="text-[13px] font-semibold text-obuya-gold tabular-nums">{formatPrice(p.price)}</span>
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href={searchHref(query)}
        onClick={onPick}
        id={`${listId}-${data.products.length}`}
        className={`flex items-center justify-between px-4 py-3 border-t border-obuya-line/40 text-[13px] font-semibold text-obuya-ink transition-colors ${pickable && activeIndex === data.products.length ? 'bg-obuya-gold/15' : 'hover:bg-obuya-ink/5'}`}
      >
        <span>See all {data.total} result{data.total === 1 ? '' : 's'} for “{query.trim()}”</span>
        <Icon name="arrow_forward" size={18} />
      </Link>
    </div>
  );
}

/**
 * How many keyboard-selectable rows the list has (products + "see all"). Only up-to-date results count: while a
 * new query is loading, the old (dimmed) results are visible but cannot be picked with the keyboard.
 */
export const selectableCount = (state: SearchState) =>
  state.status === 'done' && state.data.products.length ? state.data.products.length + 1 : 0;
