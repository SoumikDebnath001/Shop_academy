/* =========================
   CURRENCY SETTING
   All amounts in the app are stored in Kenyan Shillings (KES). This setting only
   changes how they are SHOWN: in KSh, or converted to US Dollars at the saved rate.

   For now the choice is saved in this browser (localStorage). When the backend has a
   settings endpoint, load it in `loadSettings` and save it in `setCurrencySettings`
   (Backend: GET / PUT /admin/settings/currency), so every admin sees the same currency.
========================= */

import { useSyncExternalStore } from 'react';

export type CurrencyCode = 'KES' | 'USD';

export const CURRENCIES: Record<CurrencyCode, { label: string; symbol: string; locale: string; decimals: number; spaced: boolean }> = {
  KES: { label: 'Kenyan Shilling', symbol: 'KSh', locale: 'en-KE', decimals: 0, spaced: true },
  USD: { label: 'US Dollar', symbol: '$', locale: 'en-US', decimals: 2, spaced: false },
};

export type CurrencySettings = {
  code: CurrencyCode;
  usdRate: number; // how many KSh make 1 US Dollar
};

export const DEFAULT_CURRENCY_SETTINGS: CurrencySettings = { code: 'KES', usdRate: 129 };

const STORAGE_KEY = 'obuya.admin.currency';

const isValid = (s: unknown): s is CurrencySettings =>
  !!s && typeof s === 'object'
  && ((s as CurrencySettings).code === 'KES' || (s as CurrencySettings).code === 'USD')
  && typeof (s as CurrencySettings).usdRate === 'number' && (s as CurrencySettings).usdRate > 0;

// Storage can be blocked (private mode, disabled site data), so every access is guarded
function loadSettings(): CurrencySettings {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    return isValid(saved) ? saved : DEFAULT_CURRENCY_SETTINGS;
  } catch {
    return DEFAULT_CURRENCY_SETTINGS;
  }
}

let current: CurrencySettings = typeof window === 'undefined' ? DEFAULT_CURRENCY_SETTINGS : loadSettings();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export const getCurrencySettings = () => current;

export function setCurrencySettings(next: CurrencySettings) {
  current = { ...next };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(current)); } catch { /* keeps working for this visit */ }
  notify();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab changed the setting: pick it up here too
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) { current = loadSettings(); notify(); }
  };
  window.addEventListener('storage', onStorage);
  return () => { listeners.delete(listener); window.removeEventListener('storage', onStorage); };
}

/* Re-renders the component when the currency changes. Call it at the top of any page that shows money. */
export function useCurrencySettings() {
  return useSyncExternalStore(subscribe, getCurrencySettings, () => DEFAULT_CURRENCY_SETTINGS);
}

/* ---------- Formatting ---------- */

// KSh amount -> amount in the chosen currency
export const convertMoney = (kes: number, s: CurrencySettings = current) => (s.code === 'USD' ? kes / s.usdRate : kes);

// Formats a number that is ALREADY in the chosen currency (e.g. chart values after convertMoney)
export function formatAmount(value: number, s: CurrencySettings = current) {
  const c = CURRENCIES[s.code];
  const text = value.toLocaleString(c.locale, { minimumFractionDigits: c.decimals, maximumFractionDigits: c.decimals });
  return `${c.symbol}${c.spaced ? ' ' : ''}${text}`;
}

// Short label for chart axes, value already in the chosen currency: 1500 -> KSh 1.5k, 2400000 -> $2.4M
export function formatAmountCompact(value: number, s: CurrencySettings = current) {
  const c = CURRENCIES[s.code];
  const short = value >= 1e6 ? `${+(value / 1e6).toFixed(1)}M` : value >= 1e3 ? `${+(value / 1e3).toFixed(1)}k` : `${+value.toFixed(1)}`;
  return `${c.symbol}${c.spaced ? ' ' : ''}${short}`;
}

// KSh amount -> text in the chosen currency, e.g. "KSh 12,500" or "$96.90"
export const formatMoney = (kes: number, s: CurrencySettings = current) => formatAmount(convertMoney(kes, s), s);

// Plain number for CSV files, in the chosen currency and rounded like it is shown
export const moneyForCsv = (kes: number, s: CurrencySettings = current) => {
  const factor = 10 ** CURRENCIES[s.code].decimals;
  return Math.round(convertMoney(kes, s) * factor) / factor;
};

// Code for CSV column headers, e.g. "Total (USD)"
export const currencyCode = () => current.code;
