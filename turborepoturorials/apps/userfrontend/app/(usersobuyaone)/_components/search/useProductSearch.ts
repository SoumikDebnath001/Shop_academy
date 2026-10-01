'use client';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import type { SearchSuggestions } from '@/services/catalog.types';

export const MIN_QUERY = 3;
export const SUGGESTION_LIMIT = 6;
const DEBOUNCE_MS = 300;

export type SearchState =
  | { status: 'idle' } // nothing typed
  | { status: 'short'; remaining: number } // fewer than MIN_QUERY characters: don't search
  | { status: 'loading'; previous?: SearchSuggestions } // keeps last results on screen while typing
  | { status: 'done'; data: SearchSuggestions }
  | { status: 'error' };

/**
 * Debounced navbar search: waits until typing pauses (300ms) and at least 3 characters are entered, then asks for
 * the 6 best matches. Responses for older queries are ignored so results never jump back.
 */
export function useProductSearch(query: string): SearchState {
  const q = query.trim();
  const [result, setResult] = useState<{ q: string; data?: SearchSuggestions; error?: boolean } | null>(null);

  useEffect(() => {
    if (q.length < MIN_QUERY) return;
    let current = true;
    const timer = setTimeout(() => {
      api.searchSuggestions(q, SUGGESTION_LIMIT).then(
        (data) => current && setResult({ q, data }),
        () => current && setResult({ q, error: true }),
      );
    }, DEBOUNCE_MS);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [q]);

  if (!q) return { status: 'idle' };
  if (q.length < MIN_QUERY) return { status: 'short', remaining: MIN_QUERY - q.length };
  if (result?.q === q) return result.error ? { status: 'error' } : { status: 'done', data: result.data! };
  return { status: 'loading', previous: result?.data };
}

// ---------- Recent searches (this browser) ----------
const RECENT_KEY = 'obuya.recentSearches';
const RECENT_MAX = 5;

export function readRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]'); } catch { return []; }
}
export function saveRecent(q: string) {
  const term = q.trim();
  if (term.length < MIN_QUERY) return;
  const next = [term, ...readRecent().filter((r) => r.toLowerCase() !== term.toLowerCase())].slice(0, RECENT_MAX);
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* storage blocked */ }
}
export function clearRecent() {
  try { localStorage.removeItem(RECENT_KEY); } catch { /* storage blocked */ }
}

export const searchHref = (q: string) => `/search?q=${encodeURIComponent(q.trim())}`;
export const POPULAR_SEARCHES = ['Cricket bat', 'Jersey', 'Football boots', 'Rugby ball', 'Hoodie'];
