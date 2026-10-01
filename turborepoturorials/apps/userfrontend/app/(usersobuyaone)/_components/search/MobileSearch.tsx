'use client';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@/components/Icon';
import { useOverlay } from '../useOverlay';
import SuggestionList from './SuggestionList';
import SearchStart from './SearchStart';
import { saveRecent, searchHref, useProductSearch } from './useProductSearch';
import { useSearchKeys } from './useSearchKeys';

/** Phone navbar search: the icon opens a full-screen search sheet with recent + popular searches and suggestions. */
export default function MobileSearch() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Search" className="w-10 h-10 flex items-center justify-center rounded-full text-obuya-ink hover:bg-obuya-ink/5">
        <Icon name="search" />
      </button>
      {/* Portal: the header's backdrop-blur would otherwise trap this fixed sheet inside the header's box */}
      {open && createPortal(<Sheet onClose={close} />, document.body)}
    </>
  );
}

function Sheet({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId().replace(/:/g, '');
  const state = useProductSearch(query);
  const { active, setActive, onKeyDown } = useSearchKeys(query, state, listId, onClose);
  useOverlay(true, onClose);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const runSearch = (term: string) => {
    saveRecent(term);
    onClose();
    router.push(searchHref(term));
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Search" className="fixed inset-0 z-[75] bg-obuya-bg flex flex-col obuya-fade-up">
      <div className="pt-safe border-b border-obuya-line/50">
        <div className="h-16 px-3 flex items-center gap-2">
          <button type="button" onClick={onClose} aria-label="Close search" className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full text-obuya-ink">
            <Icon name="arrow_back" size={24} />
          </button>
          <div className="flex-1 h-11 flex items-center gap-2 rounded-full border border-obuya-gold/60 bg-obuya-panel px-3">
            <Icon name="search" size={20} className="text-obuya-muted" />
            <input
              ref={inputRef}
              type="search"
              enterKeyHint="search"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActive(-1); }}
              onKeyDown={onKeyDown}
              placeholder="Search gear, kits, brands…"
              aria-label="Search products"
              role="combobox"
              aria-expanded={state.status !== 'idle'}
              aria-controls={listId}
              autoComplete="off"
              className="flex-1 min-w-0 bg-transparent text-[16px] text-obuya-ink placeholder:text-obuya-muted/70 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button type="button" onClick={() => { setQuery(''); inputRef.current?.focus(); }} aria-label="Clear search" className="text-obuya-muted">
                <Icon name="cancel" size={20} filled />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
        {state.status === 'idle' ? (
          <SearchStart onPick={runSearch} />
        ) : (
          <SuggestionList state={state} query={query} activeIndex={active} listId={listId} onPick={() => { saveRecent(query); onClose(); }} />
        )}
      </div>
    </div>
  );
}
