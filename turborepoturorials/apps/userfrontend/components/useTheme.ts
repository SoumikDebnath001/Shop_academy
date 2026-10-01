'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { THEME_STORAGE_KEY } from './themeScript';

export type Theme = 'light' | 'dark';

// The theme lives on <html data-theme>, set before paint by themeInitScript. This hook just reads and
// changes that attribute, so every component stays in sync without a context provider.
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getTheme = (): Theme => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
const getServerTheme = (): Theme => 'light';

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme);

  const toggleTheme = useCallback(() => {
    const next: Theme = getTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(THEME_STORAGE_KEY, next); } catch { /* storage blocked: theme still applies for this visit */ }
    listeners.forEach((listener) => listener());
  }, []);

  return { theme, toggleTheme };
}
