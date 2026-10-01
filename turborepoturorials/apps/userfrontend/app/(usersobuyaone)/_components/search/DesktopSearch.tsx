'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import Icon from '@/components/Icon';
import SearchStart from './SearchStart';
import SuggestionList from './SuggestionList';
import { saveRecent, searchHref, useProductSearch } from './useProductSearch';
import { useSearchKeys } from './useSearchKeys';

/**
 * Laptop navbar search: the icon expands into a search field (takes extra space in the nav, links slide over),
 * with a suggestions dropdown underneath. Esc, clicking outside or navigating closes it.
 */
export default function DesktopSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId().replace(/:/g, '');
  const state = useProductSearch(query);
  const close = () => {
    setOpen(false);
    inputRef.current?.blur();
  };
  const { active, setActive, onKeyDown } = useSearchKeys(query, state, listId, close);
  const pathname = usePathname();
  const router = useRouter();
  const runSearch = (term: string) => {
    saveRecent(term);
    setOpen(false);
    router.push(searchHref(term));
  };

  // Close when the page changes (a suggestion or results page was opened).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    inputRef.current?.select(); // reopening with an old query: typing replaces it
    const onDown = (e: MouseEvent) => !rootRef.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <div
        className={`flex items-center h-10 rounded-full border transition-[width,background-color,border-color] duration-500 ease-obuya overflow-hidden ${
          open ? 'w-[280px] xl:w-[340px] bg-obuya-bg border-obuya-gold/60 shadow-sm' : 'w-10 border-transparent'
        }`}
      >
        <button
          type="button"
          onClick={() => (open && query.trim() ? inputRef.current?.focus() : setOpen((o) => !o))}
          aria-label={open ? 'Search' : 'Open search'}
          aria-expanded={open}
          className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full text-obuya-ink hover:text-obuya-gold transition-colors"
        >
          <Icon name="search" />
        </button>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setActive(-1); }}
          onKeyDown={(e) => (e.key === 'Escape' ? close() : onKeyDown(e))}
          tabIndex={open ? 0 : -1}
          placeholder="Search gear, kits, brands…"
          aria-label="Search products"
          role="combobox"
          aria-expanded={open && state.status !== 'idle'}
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          className="flex-1 min-w-0 h-full bg-transparent pr-2 text-[14px] text-obuya-ink placeholder:text-obuya-muted/70 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {open && query && (
          <button type="button" onClick={() => { setQuery(''); inputRef.current?.focus(); }} aria-label="Clear search" className="w-8 h-8 mr-1 shrink-0 flex items-center justify-center rounded-full text-obuya-muted hover:text-obuya-ink">
            <Icon name="close" size={18} />
          </button>
        )}
      </div>

      {open && (
        <div className="obuya-fade-up absolute left-0 top-[calc(100%+10px)] w-[400px] max-w-[calc(100vw-2rem)] rounded-xl bg-obuya-bg border border-obuya-line/50 shadow-[0_24px_50px_-20px_rgba(40,10,15,0.4)] overflow-hidden z-50">
          {state.status === 'idle' ? (
            <SearchStart compact onPick={runSearch} />
          ) : (
            <SuggestionList state={state} query={query} activeIndex={active} listId={listId} onPick={() => { saveRecent(query); setOpen(false); }} />
          )}
        </div>
      )}
    </div>
  );
}
