"use client";
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../../services/api';
import { ADMIN_LOGIN_PATH, adminPath } from '../../../services/adminRoutes';
import {
  AdminNotification, DateRange, SearchResult, formatDate, getNotifications, markNotificationsRead, searchAdmin, toIso,
} from '../../../services/adminDashboard';
import { useDismiss } from './ui';

/* ---------- Date range ---------- */

export const DATE_PRESETS: { label: string; make: () => DateRange }[] = [
  { label: 'Last 7 days', make: () => { const t = new Date(); const f = new Date(); f.setDate(t.getDate() - 6); return { from: toIso(f), to: toIso(t) }; } },
  { label: 'Last 30 days', make: () => { const t = new Date(); const f = new Date(); f.setDate(t.getDate() - 29); return { from: toIso(f), to: toIso(t) }; } },
  { label: 'This month', make: () => { const t = new Date(); return { from: toIso(new Date(t.getFullYear(), t.getMonth(), 1)), to: toIso(new Date(t.getFullYear(), t.getMonth() + 1, 0)) }; } },
  { label: 'Last month', make: () => { const t = new Date(); return { from: toIso(new Date(t.getFullYear(), t.getMonth() - 1, 1)), to: toIso(new Date(t.getFullYear(), t.getMonth(), 0)) }; } },
  { label: 'Last 90 days', make: () => { const t = new Date(); const f = new Date(); f.setDate(t.getDate() - 89); return { from: toIso(f), to: toIso(t) }; } },
];

export const defaultRange = () => DATE_PRESETS[2].make();

export function DateRangePicker({ value, onChange }: { value: DateRange; onChange: (r: DateRange) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss<HTMLDivElement>(open, close);

  const apply = (r: DateRange) => { onChange(r); setOpen(false); };
  const draftValid = draft.from && draft.to && draft.from <= draft.to;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setDraft(value); setOpen((o) => !o); }}
        aria-expanded={open}
        className="h-11 w-full flex items-center gap-2.5 px-3.5 rounded-xl bg-white border border-outline-variant/70 text-[13px] text-on-surface hover:border-outline transition-colors"
      >
        <span className="material-symbols-outlined text-[20px] text-on-surface-variant">calendar_month</span>
        <span className="whitespace-nowrap">{formatDate(value.from)} – {formatDate(value.to)}</span>
        <span className="material-symbols-outlined text-[20px] text-on-surface-variant ml-auto">expand_more</span>
      </button>

      {open && (
        <div className="absolute z-40 mt-2 left-0 sm:left-auto sm:right-0 w-[min(20rem,calc(100vw-2rem))] bg-white rounded-2xl border border-outline-variant/50 shadow-xl p-3">
          <div className="grid grid-cols-2 gap-1.5">
            {DATE_PRESETS.map((p) => (
              <button key={p.label} onClick={() => apply(p.make())} className="h-9 px-3 rounded-lg text-[13px] text-left text-on-surface hover:bg-surface-container-low">
                {p.label}
              </button>
            ))}
          </div>
          <div className="border-t border-outline-variant/40 mt-3 pt-3">
            <p className="text-[12px] font-medium text-on-surface-variant mb-2">Custom range</p>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[12px] text-on-surface-variant">From
                <input type="date" value={draft.from} max={draft.to} onChange={(e) => setDraft({ ...draft, from: e.target.value })} className="mt-1 w-full h-9 px-2 rounded-lg border border-outline-variant text-[13px] text-on-surface" />
              </label>
              <label className="text-[12px] text-on-surface-variant">To
                <input type="date" value={draft.to} min={draft.from} onChange={(e) => setDraft({ ...draft, to: e.target.value })} className="mt-1 w-full h-9 px-2 rounded-lg border border-outline-variant text-[13px] text-on-surface" />
              </label>
            </div>
            <button disabled={!draftValid} onClick={() => apply(draft)} className="mt-3 w-full h-9 rounded-lg bg-brand-green-dark text-white text-[13px] font-medium disabled:opacity-40">
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Search ---------- */

const RESULT_ICONS: Record<SearchResult['type'], string> = {
  Order: 'receipt_long', Vendor: 'storefront', Product: 'inventory_2', Customer: 'person', Quotation: 'request_quote', Support: 'support_agent',
};

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss<HTMLDivElement>(open, close);

  // Waits until typing pauses before searching
  useEffect(() => {
    if (!query.trim()) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      searchAdmin(query).then((r) => { if (!cancelled) { setResults(r); setHighlight(0); } });
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);

  const go = (r: SearchResult) => { setOpen(false); setQuery(''); setResults([]); router.push(r.href); };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!results.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight((h) => (h + 1) % results.length); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight((h) => (h - 1 + results.length) % results.length); }
    if (e.key === 'Enter') { e.preventDefault(); go(results[highlight]); }
  };

  const showPanel = open && query.trim().length > 0;

  return (
    <div ref={ref} className="relative w-full">
      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant pointer-events-none">search</span>
      <input
        type="search"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); if (!e.target.value.trim()) setResults([]); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search orders, vendors, products, customers..."
        aria-label="Search the admin panel"
        className="h-11 w-full pl-11 pr-4 rounded-xl bg-white border border-outline-variant/70 text-[14px] text-on-surface placeholder:text-on-surface-variant/70 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition"
      />
      {showPanel && (
        <div className="absolute z-40 mt-2 w-full bg-white rounded-2xl border border-outline-variant/50 shadow-xl py-2 max-h-96 overflow-y-auto">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-[13px] text-on-surface-variant">No results for “{query}”</p>
          ) : results.map((r, i) => (
            <button
              key={r.id}
              onMouseEnter={() => setHighlight(i)}
              onClick={() => go(r)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left ${i === highlight ? 'bg-surface-container-low' : ''}`}
            >
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">{RESULT_ICONS[r.type]}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-[14px] text-on-surface truncate">{r.title}</span>
                <span className="block text-[12px] text-on-surface-variant truncate">{r.subtitle}</span>
              </span>
              <span className="text-[11px] font-medium uppercase tracking-wide text-on-surface-variant/80">{r.type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Notifications ---------- */

export function NotificationBell() {
  const router = useRouter();
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss<HTMLDivElement>(open, close);

  useEffect(() => { getNotifications().then(setItems).catch(() => {}); }, []);

  const unread = items.filter((n) => !n.read).length;

  const openItem = async (n: AdminNotification) => {
    setItems((all) => all.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    setOpen(false);
    await markNotificationsRead([n.id]);
    router.push(n.href);
  };

  const markAll = async () => {
    setItems((all) => all.map((x) => ({ ...x, read: true })));
    await markNotificationsRead();
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-label={`Notifications, ${unread} unread`} aria-expanded={open} className="relative w-11 h-11 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container-high transition-colors">
        <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>notifications</span>
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-red text-white text-[11px] font-semibold flex items-center justify-center ring-2 ring-surface">{unread}</span>
        )}
      </button>

      {open && (
        <div className="absolute z-40 mt-2 right-0 w-[min(22rem,calc(100vw-2rem))] bg-white rounded-2xl border border-outline-variant/50 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/40">
            <span className="text-[15px] font-semibold text-on-surface">Notifications</span>
            <button onClick={markAll} disabled={!unread} className="text-[12px] font-medium text-primary disabled:text-on-surface-variant/50">Mark all as read</button>
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13px] text-on-surface-variant">You are all caught up</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <button onClick={() => openItem(n)} className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-surface-container-low">
                    <span className="material-symbols-outlined text-[20px] text-primary mt-0.5">{n.icon}</span>
                    <span className="flex-1 min-w-0">
                      <span className={`block text-[13px] ${n.read ? 'text-on-surface-variant' : 'text-on-surface font-medium'}`}>{n.title}</span>
                      <span className="block text-[12px] text-on-surface-variant/80 mt-0.5">{n.time}</span>
                    </span>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-brand-red mt-1.5 shrink-0" aria-label="Unread" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Profile ---------- */

type AdminProfile = { name: string; email: string; role: string };

export function ProfileMenu() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss<HTMLDivElement>(open, close);

  useEffect(() => { api.adminMe().then(setAdmin).catch(() => {}); }, []);

  const signOut = async () => {
    try { await api.adminLogout(); } finally { router.replace(ADMIN_LOGIN_PATH); }
  };

  const name = admin?.name || 'Admin';

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex items-center gap-2.5 h-11 pl-1 pr-2 rounded-full hover:bg-surface-container-high transition-colors">
        <span className="w-10 h-10 rounded-full bg-brand-green-dark text-brand-gold flex items-center justify-center text-[16px] font-semibold">{name.charAt(0).toUpperCase()}</span>
        <span className="hidden 2xl:flex flex-col items-start leading-tight">
          <span className="text-[14px] font-semibold text-on-surface">{name}</span>
          <span className="text-[12px] text-on-surface-variant">Obuya Foundation</span>
        </span>
        <span className="material-symbols-outlined text-[20px] text-on-surface-variant hidden 2xl:block">expand_more</span>
      </button>

      {open && (
        <div className="absolute z-40 mt-2 right-0 w-64 bg-white rounded-2xl border border-outline-variant/50 shadow-xl py-2">
          <div className="px-4 py-2 border-b border-outline-variant/40 mb-1">
            <p className="text-[14px] font-semibold text-on-surface truncate">{name}</p>
            <p className="text-[12px] text-on-surface-variant truncate">{admin?.email}</p>
            {admin?.role && <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md bg-brand-gold/15 text-secondary text-[11px] font-medium uppercase tracking-wide">{admin.role}</span>}
          </div>
          <Link href={adminPath('/settings')} onClick={close} className="flex items-center gap-3 px-4 h-10 text-[14px] text-on-surface hover:bg-surface-container-low">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">settings</span> Settings
          </Link>
          <Link href="/" className="flex items-center gap-3 px-4 h-10 text-[14px] text-on-surface hover:bg-surface-container-low">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">open_in_new</span> Back to Storefront
          </Link>
          <button onClick={signOut} className="w-full flex items-center gap-3 px-4 h-10 text-[14px] text-error hover:bg-red-50">
            <span className="material-symbols-outlined text-[20px]">logout</span> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- Header ---------- */

export default function DashboardHeader({ range, onRangeChange }: { range: DateRange; onRangeChange: (r: DateRange) => void }) {
  return (
    <header className="flex flex-col gap-5 pb-6 border-b border-outline-variant/50">
      <div className="flex flex-col xl:flex-row xl:items-start gap-4 xl:gap-6">
        <div className="xl:mr-auto xl:max-w-[380px] shrink-0">
     <h1 className="font-headline-lg text-[32px] sm:text-[38px] leading-tight text-on-surface mt-1">Dashboard</h1>
           </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 xl:max-w-[820px] xl:flex-1">
          <div className="flex-1 min-w-0 xl:min-w-[280px]"><GlobalSearch /></div>
          <div className="flex items-center gap-2">
            <div className="flex-1 sm:flex-none"><DateRangePicker value={range} onChange={onRangeChange} /></div>
            <NotificationBell />
            <ProfileMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
