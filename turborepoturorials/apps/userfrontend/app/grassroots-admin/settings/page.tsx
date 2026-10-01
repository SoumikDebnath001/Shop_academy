"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { ADMIN_BASE_PATH } from '../../../services/adminRoutes';
import {
  CURRENCIES, CurrencyCode, CurrencySettings, DEFAULT_CURRENCY_SETTINGS, formatMoney, setCurrencySettings, useCurrencySettings,
} from '../../../services/currency';
import { useToast } from '../../../components/ToastProvider';

const EXAMPLE_KES = 12500;

/* Settings > Currency: which currency the admin panel shows money in */
function CurrencySettingsCard() {
  const { triggerToast } = useToast();
  const saved = useCurrencySettings();
  const [draft, setDraft] = useState<CurrencySettings>(saved);
  const [rateText, setRateText] = useState(String(saved.usdRate));

  const rate = Number(rateText);
  const rateValid = Number.isFinite(rate) && rate > 0 && rate < 100000;
  const next: CurrencySettings = { code: draft.code, usdRate: rateValid ? rate : saved.usdRate };
  const dirty = next.code !== saved.code || (rateValid && rate !== saved.usdRate);

  const save = () => {
    if (!rateValid) return;
    setCurrencySettings(next);
    triggerToast(`Prices now show in ${CURRENCIES[next.code].label}s`);
  };

  const resetToDefault = () => {
    setDraft(DEFAULT_CURRENCY_SETTINGS);
    setRateText(String(DEFAULT_CURRENCY_SETTINGS.usdRate));
  };

  return (
    <section className="bg-white rounded-2xl border border-outline-variant/50 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <header className="flex items-start gap-3 px-6 pt-6 pb-4 border-b border-outline-variant/40">
        <span className="w-11 h-11 rounded-xl bg-green-50 text-primary flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
        </span>
        <div>
          <h2 className="text-[17px] font-semibold text-on-surface">Currency</h2>
          <p className="text-[13px] text-on-surface-variant mt-0.5">Choose how prices and amounts are shown across the admin panel: Dashboard, Orders, Analytics and Inventory.</p>
        </div>
      </header>

      <div className="px-6 py-5 space-y-6">
        {/* Currency choice */}
        <fieldset>
          <legend className="text-[14px] font-medium text-on-surface mb-3">Display currency</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => {
              const c = CURRENCIES[code];
              const active = draft.code === code;
              return (
                <label
                  key={code}
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${active ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-outline-variant hover:bg-surface-container-low'}`}
                >
                  <input type="radio" name="currency" value={code} checked={active} onChange={() => setDraft({ ...draft, code })} className="w-4 h-4 accent-[var(--color-primary)]" />
                  <span className="w-11 h-11 rounded-lg bg-surface-container-low flex items-center justify-center text-[15px] font-bold text-on-surface shrink-0">{c.symbol}</span>
                  <span className="flex flex-col">
                    <span className="text-[14px] font-semibold text-on-surface">{c.label} ({code})</span>
                    <span className="text-[13px] text-on-surface-variant">
                      Example: {formatMoney(EXAMPLE_KES, { code, usdRate: rateValid ? rate : saved.usdRate })}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* Exchange rate */}
        <div>
          <label htmlFor="usd-rate" className="block text-[14px] font-medium text-on-surface mb-1">Exchange rate</label>
          <p className="text-[13px] text-on-surface-variant mb-2">Prices are saved in Kenyan Shillings. US Dollar amounts are worked out with this rate.</p>
          <div className="flex items-center gap-2 text-[14px] text-on-surface">
            <span className="whitespace-nowrap">1 US Dollar =</span>
            <input
              id="usd-rate"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              value={rateText}
              onChange={(e) => setRateText(e.target.value)}
              aria-invalid={!rateValid}
              className={`h-11 w-32 px-3 rounded-xl border text-[14px] tabular-nums outline-none focus:ring-2 ${rateValid ? 'border-outline-variant focus:border-primary focus:ring-primary/15' : 'border-error focus:ring-error/20'}`}
            />
            <span>KSh</span>
          </div>
          {!rateValid && <p className="text-[12px] text-error mt-1.5">Enter a number greater than 0.</p>}
        </div>

        {/* Preview */}
        <div className="rounded-xl bg-surface-container-low px-4 py-3 text-[13px] text-on-surface-variant">
          After saving, an order of <strong className="text-on-surface">{formatMoney(EXAMPLE_KES, { code: 'KES', usdRate: 1 })}</strong> will show as{' '}
          <strong className="text-on-surface">{formatMoney(EXAMPLE_KES, next)}</strong>.
        </div>

        <p className="flex items-start gap-2 text-[12px] text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px] mt-px">info</span>
          For now this setting is saved in this browser only. The storefront is not changed yet.
        </p>
      </div>

      <footer className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2 px-6 py-4 border-t border-outline-variant/40">
        <button onClick={resetToDefault} className="h-11 px-4 rounded-xl text-[14px] font-medium text-on-surface-variant hover:bg-surface-container-low">
          Reset to default
        </button>
        <button onClick={save} disabled={!dirty || !rateValid} className="h-11 px-5 rounded-xl bg-brand-green-dark text-white text-[14px] font-medium disabled:opacity-40 disabled:cursor-not-allowed">
          Save changes
        </button>
      </footer>
    </section>
  );
}

export default function AdminSettings() {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8 flex flex-col gap-6">
      <div>
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[13px] text-on-surface-variant">
          <Link href={ADMIN_BASE_PATH} className="hover:text-primary hover:underline">Admin Panel</Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-on-surface">Settings</span>
        </nav>
        <h1 className="text-[30px] sm:text-[34px] font-bold text-on-surface leading-tight mt-1">Settings</h1>
        <p className="text-[14px] text-on-surface-variant">Configure the admin panel and store settings.</p>
      </div>

      <CurrencySettingsCard />
    </div>
  );
}
