'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MIN_QUERY, saveRecent, searchHref, type SearchState } from './useProductSearch';
import { selectableCount } from './SuggestionList';

/** Arrow keys move through suggestions, Enter opens the highlighted one or the full results page. */
export function useSearchKeys(query: string, state: SearchState, listId: string, done: () => void) {
  const router = useRouter();
  const [active, setActive] = useState(-1);
  const count = selectableCount(state);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && count) {
      e.preventDefault();
      setActive((i) => (i + 1) % count);
    } else if (e.key === 'ArrowUp' && count) {
      e.preventDefault();
      setActive((i) => (i <= 0 ? count - 1 : i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const link = active >= 0 && active < count ? document.querySelector<HTMLElement>(`#${CSS.escape(listId)}-${active} a, a#${CSS.escape(listId)}-${active}`) : null;
      if (link) return link.click();
      if (query.trim().length < MIN_QUERY) return;
      saveRecent(query);
      done();
      router.push(searchHref(query));
    }
  };

  return { active: active < count ? active : -1, setActive, onKeyDown };
}
