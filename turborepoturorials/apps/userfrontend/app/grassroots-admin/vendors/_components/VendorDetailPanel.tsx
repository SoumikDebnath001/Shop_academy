"use client";
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { adminPath } from '../../../../services/adminRoutes';
import { convertMoney, formatAmount, formatAmountCompact, formatMoney, useCurrencySettings } from '../../../../services/currency';
import { NewVendor, VENDOR_CATEGORIES, VENDOR_COUNTRIES, VendorDetail } from '../../../../services/adminVendors';
import { Skeleton, StatusBadge } from '../../_dashboard/ui';
import { MetricSelect, SingleLine } from '../../analytics/_components/charts';

export const formatDay = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const timeAgo = (iso: string) => {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

// "SprintGear Ltd" -> SG, "Swift Athletics" -> SA, "The Kit Room" -> KR
export const vendorInitials = (name: string) => {
  const words = name.replace(/[^A-Za-z ]/g, '').split(' ').filter((w) => w && w.toLowerCase() !== 'the');
  const capitals = (words[0] ?? '').match(/[A-Z]/g) ?? [];
  return (capitals.length >= 2 ? capitals.slice(0, 2).join('') : words.slice(0, 2).map((w) => w[0]).join('')).toUpperCase();
};

export function VendorLogo({ name, pending, size = 'sm' }: { name: string; pending?: boolean; size?: 'sm' | 'lg' }) {
  return (
    <span className={`${size === 'lg' ? 'w-14 h-14 text-[20px] rounded-xl' : 'w-9 h-9 text-[13px] rounded-lg'} ${pending ? 'bg-blue-300 text-white' : 'bg-brand-black text-white'} flex items-center justify-center font-bold shrink-0`} aria-hidden="true">
      {vendorInitials(name)}
    </span>
  );
}

export const Stars = ({ rating }: { rating: number }) => (
  rating ? (
    <span className="inline-flex items-center gap-1 tabular-nums">
      <span className="material-symbols-outlined text-[16px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
      {rating.toFixed(1)}<span className="sr-only"> out of 5</span>
    </span>
  ) : <span className="text-on-surface-variant">—</span>
);

export const messageVendorHref = (v: { email: string; name: string }) =>
  `mailto:${v.email}?subject=${encodeURIComponent('Obuya Foundation Shop – vendor support')}&body=${encodeURIComponent(`Hello ${v.name} team,\n\n`)}`;

/* ---------- Add / edit vendor popup ---------- */

const EMAIL_RULE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function VendorFormDialog({ title, initial, busy, error, onCancel, onSave }: {
  title: string; initial?: NewVendor; busy: boolean; error: string; onCancel: () => void; onSave: (v: NewVendor) => void;
}) {
  const [form, setForm] = useState<NewVendor>(initial ?? { name: '', email: '', phone: '', city: '', country: 'Kenya', categories: [] });
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const problems = {
    name: form.name.trim() ? '' : 'Enter the business name',
    email: EMAIL_RULE.test(form.email.trim()) ? '' : 'Enter a valid email',
    phone: form.phone.replace(/\D/g, '').length >= 7 ? '' : 'Enter a phone number',
    categories: form.categories.length ? '' : 'Pick at least one category',
  };
  const valid = !Object.values(problems).some(Boolean);
  const input = (bad?: string) => `mt-1 w-full h-11 px-3 rounded-xl border text-[14px] outline-none focus:ring-2 ${touched && bad ? 'border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/15'}`;
  const err = (msg: string) => touched && msg ? <span className="block mt-1 text-[12px] font-normal text-error">{msg}</span> : null;
  const toggleCat = (c: string) => setForm({ ...form, categories: form.categories.includes(c) ? form.categories.filter((x) => x !== c) : [...form.categories, c] });

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} aria-hidden="true" />
      <form
        role="dialog" aria-modal="true" aria-label={title} noValidate
        onSubmit={(e) => { e.preventDefault(); setTouched(true); if (valid) onSave({ ...form, name: form.name.trim(), email: form.email.trim(), city: form.city.trim() }); }}
        className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 pb-safe"
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <h3 className="text-[18px] font-semibold text-on-surface">{title}</h3>
          <button type="button" onClick={onCancel} aria-label="Close" className="w-9 h-9 -mr-2 -mt-1 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px] font-medium text-on-surface">
          <label className="sm:col-span-2">Business name
            <input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input(problems.name)} />{err(problems.name)}
          </label>
          <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={input(problems.email)} />{err(problems.email)}</label>
          <label>Phone<input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+254 7xx xxx xxx" className={input(problems.phone)} />{err(problems.phone)}</label>
          <label>City<input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={input()} /></label>
          <label>Country
            <select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={input()}>{VENDOR_COUNTRIES.map((c) => <option key={c}>{c}</option>)}</select>
          </label>
          <fieldset className="sm:col-span-2">
            <legend>Categories <span className="font-normal text-on-surface-variant">(the first one ticked is the main category)</span></legend>
            <div className="flex flex-wrap gap-2 mt-2">
              {VENDOR_CATEGORIES.map((c) => {
                const on = form.categories.includes(c);
                return (
                  <button key={c} type="button" aria-pressed={on} onClick={() => toggleCat(c)} className={`h-9 px-3 rounded-lg border text-[13px] font-normal ${on ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-outline-variant text-on-surface hover:bg-surface-container-low'}`}>
                    {on && form.categories[0] === c ? '★ ' : ''}{c}
                  </button>
                );
              })}
            </div>
            {err(problems.categories)}
          </fieldset>
        </div>
        {error && <p className="mt-4 text-[13px] text-error">{error}</p>}
        <div className="flex justify-end gap-2 mt-6">
          <button type="button" onClick={onCancel} className="h-11 px-4 rounded-xl text-[14px] font-medium text-on-surface-variant hover:bg-surface-container-low">Cancel</button>
          <button type="submit" disabled={busy} className="h-11 px-5 rounded-xl bg-brand-red text-white text-[14px] font-medium disabled:opacity-50">{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
}

/* ---------- Performance chart ---------- */

function PerformanceChart({ vendor, tall }: { vendor: VendorDetail; tall?: boolean }) {
  const [metric, setMetric] = useState<'orders' | 'revenue'>('orders');
  const currency = useCurrencySettings();
  const points = useMemo(() => vendor.weeks.map((w, i) => {
    const d = new Date(`${w.weekStart}T00:00:00`);
    const firstOfMonth = i === 0 || d.getMonth() !== new Date(`${vendor.weeks[i - 1].weekStart}T00:00:00`).getMonth();
    return {
      label: `Week of ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
      tick: firstOfMonth ? d.toLocaleDateString('en-GB', { month: 'short' }) : undefined,
      value: metric === 'orders' ? w.orders : convertMoney(w.revenue, currency),
    };
  }), [vendor.weeks, metric, currency]);

  return (
    <div className="rounded-2xl border border-outline-variant/50 bg-white p-3">
      <div className="flex justify-end mb-1">
        <MetricSelect label="Chart metric" value={metric} options={[{ value: 'orders', label: 'Orders' }, { value: 'revenue', label: 'Revenue' }]} onChange={setMetric} />
      </div>
      <SingleLine
        label={`${vendor.name} ${metric} per week`}
        points={points}
        color="#1b7a43"
        height={tall ? 180 : 110}
        format={metric === 'orders' ? (v) => `${v} orders` : (v) => formatAmount(v)}
        axisFormat={metric === 'orders' ? undefined : (v) => formatAmountCompact(v)}
      />
    </div>
  );
}

/* ---------- Panel ---------- */

type Tab = 'overview' | 'analytics' | 'products' | 'orders';

const ACTIVITY_DOT: Record<string, string> = { product: 'border-green-600', order: 'border-blue-600', profile: 'border-violet-600', status: 'border-amber-500' };

export default function VendorDetailPanel({ vendor, loading, error, busy, onClose, onEdit, onApprove, onReject, onSuspend, onReactivate }: {
  vendor: VendorDetail | null; loading: boolean; error: string; busy: boolean;
  onClose: () => void; onEdit: () => void; onApprove: () => void; onReject: () => void; onSuspend: () => void; onReactivate: () => void;
}) {
  const [tab, setTab] = useState<Tab>('overview');
  const [allActivity, setAllActivity] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.querySelector('[role=dialog],[role=alertdialog]')) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const v = vendor;
  const tabBtn = (key: Tab, label: string) => (
    <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={`relative h-10 px-2.5 text-[13px] whitespace-nowrap ${tab === key ? 'text-brand-red font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`}>
      {label}
      {tab === key && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-brand-red rounded-full" />}
    </button>
  );
  const stat = (icon: string, color: string, value: React.ReactNode, label: string) => (
    <div className="rounded-xl bg-surface-container-low p-2.5 text-center">
      <p className="flex items-center justify-center gap-1 text-[16px] font-bold text-on-surface tabular-nums">
        <span className={`material-symbols-outlined text-[16px] ${color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>{value}
      </p>
      <p className="text-[11px] text-on-surface-variant mt-0.5">{label}</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start gap-3 px-5 pt-5">
        {v ? <VendorLogo name={v.name} size="lg" /> : <Skeleton className="w-14 h-14 rounded-xl" />}
        <div className="flex-1 min-w-0">
          {v ? (
            <>
              <p className="flex flex-wrap items-center gap-2 text-[18px] font-bold text-on-surface leading-snug">{v.name} <StatusBadge status={v.status} /></p>
              <ul className="mt-1.5 space-y-1 text-[13px] text-on-surface-variant">
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>{v.city}, {v.country}</li>
                <li className="flex items-center gap-2 min-w-0"><span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>mail</span><a href={`mailto:${v.email}`} className="text-blue-700 hover:underline truncate">{v.email}</a></li>
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>{v.phone}</li>
              </ul>
            </>
          ) : <Skeleton className="h-20" />}
        </div>
        <button onClick={onClose} aria-label="Close vendor details" className="w-9 h-9 -mr-2 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high shrink-0">
          <span className="material-symbols-outlined text-[24px]">close</span>
        </button>
      </div>
      {v && (
        <div className="px-5 mt-2 flex justify-end">
          <Link href={adminPath(`/inventory?q=${encodeURIComponent(v.name)}`)} className="h-9 px-3 flex items-center gap-1.5 rounded-lg border border-outline-variant text-[13px] font-medium text-on-surface hover:bg-surface-container-low">
            View Products <span className="material-symbols-outlined text-[18px]">open_in_new</span>
          </Link>
        </div>
      )}

      {/* Tabs */}
      <div role="tablist" className="flex gap-1 px-5 mt-2 border-b border-outline-variant/50 overflow-x-auto">
        {tabBtn('overview', 'Overview')}
        {tabBtn('analytics', 'Analytics')}
        {tabBtn('products', `Products (${v?.products ?? 0})`)}
        {tabBtn('orders', `Orders (${v?.totalOrders ?? 0})`)}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {error ? (
          <p className="rounded-2xl bg-red-50 border border-red-200 p-4 text-[13px] text-error">{error}</p>
        ) : !v || loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
        ) : tab === 'overview' ? (
          <div className="space-y-6">
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[15px] font-semibold text-on-surface">About Vendor</h3>
                <button onClick={onEdit} className="text-[13px] font-medium text-primary hover:underline">Edit</button>
              </div>
              <dl className="grid grid-cols-[minmax(0,7rem)_1fr] gap-x-4 gap-y-2 text-[13px]">
                {([
                  ['Business Name', v.name], ['Category', v.categories.join(', ')], ['Country', v.country], ['Joined On', formatDay(v.joinedAt)],
                  ['Status', <StatusBadge key="s" status={v.status} />],
                  ['Verification', v.verified
                    ? <span key="v" className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-[18px] text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>Verified</span>
                    : <span key="v" className="inline-flex items-center gap-1 text-amber-700"><span className="material-symbols-outlined text-[18px]">pending</span>Not verified yet</span>],
                ] as [string, React.ReactNode][]).map(([k, val]) => (
                  <React.Fragment key={k}><dt className="text-on-surface-variant">{k}</dt><dd className="text-on-surface min-w-0 break-words">{val}</dd></React.Fragment>
                ))}
              </dl>
            </section>

            <section className="pt-5 border-t border-outline-variant/50">
              <h3 className="text-[15px] font-semibold text-on-surface mb-3">Performance (Last 3 Months)</h3>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {stat('shopping_cart', 'text-blue-700', v.performance.orders, 'Orders')}
                {stat('check_circle', 'text-green-600', `${v.performance.fulfilment}%`, 'Fulfilment')}
                {stat('cancel', 'text-brand-red', v.performance.returns, 'Returns')}
                {stat('star', 'text-amber-500', v.performance.rating ? v.performance.rating.toFixed(1) : '—', 'Rating')}
              </div>
              <PerformanceChart vendor={v} />
            </section>

            <section className="pt-5 border-t border-outline-variant/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[15px] font-semibold text-on-surface">Recent Activity</h3>
                {v.activity.length > 4 && (
                  <button onClick={() => setAllActivity((a) => !a)} className="flex items-center gap-1 text-[13px] font-medium text-primary hover:underline">
                    {allActivity ? 'Show less' : 'View all'} <span className="material-symbols-outlined text-[18px]">{allActivity ? 'expand_less' : 'arrow_forward'}</span>
                  </button>
                )}
              </div>
              <ul className="space-y-2.5">
                {(allActivity ? v.activity : v.activity.slice(0, 4)).map((a, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[13px]">
                    <span className={`w-3 h-3 rounded-full border-2 mt-1 shrink-0 ${ACTIVITY_DOT[a.kind]}`} />
                    <span className="flex-1 text-on-surface">{a.text}</span>
                    <span className="text-[12px] text-on-surface-variant whitespace-nowrap">{timeAgo(a.at)}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        ) : tab === 'analytics' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {stat('shopping_cart', 'text-blue-700', v.performance.orders, 'Orders (3 months)')}
              {stat('payments', 'text-green-600', formatMoney(v.weeks.reduce((s, w) => s + w.revenue, 0)), 'Revenue (3 months)')}
              {stat('check_circle', 'text-green-600', `${v.performance.fulfilment}%`, 'Fulfilment rate')}
              {stat('star', 'text-amber-500', v.performance.rating ? v.performance.rating.toFixed(1) : '—', 'Average rating')}
            </div>
            <PerformanceChart vendor={v} tall />
            <p className="text-[12px] text-on-surface-variant">Weekly numbers for the last 13 weeks. Hover a point to see the exact value.</p>
          </div>
        ) : tab === 'products' ? (
          v.productList.length === 0 ? <p className="text-[13px] text-on-surface-variant">No products yet.</p> : (
            <>
              <ul className="divide-y divide-outline-variant/40">
                {v.productList.map((p, i) => (
                  <li key={i} className="flex items-center gap-3 py-2.5 text-[13px]">
                    <span className="flex-1 min-w-0">
                      <span className="block text-on-surface truncate">{p.name}</span>
                      <span className="block text-[12px] text-on-surface-variant">{formatMoney(p.price)} · {p.stock ? `${p.stock} in stock` : 'Out of stock'}</span>
                    </span>
                    <StatusBadge status={p.status} />
                  </li>
                ))}
              </ul>
              <Link href={adminPath(`/inventory?q=${encodeURIComponent(v.name)}`)} className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline">Manage in Products <span className="material-symbols-outlined text-[18px]">arrow_forward</span></Link>
            </>
          )
        ) : (
          v.recentOrders.length === 0 ? <p className="text-[13px] text-on-surface-variant">No orders yet.</p> : (
            <>
              <ul className="divide-y divide-outline-variant/40">
                {v.recentOrders.map((o, i) => (
                  <li key={i} className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-2 py-2.5 text-[13px]">
                    <Link href={adminPath(`/orders?q=${encodeURIComponent(o.id)}`)} className="font-semibold text-on-surface hover:text-primary">{o.id}</Link>
                    <span className="min-w-0">
                      <span className="block truncate text-on-surface">{o.customer}</span>
                      <span className="block text-[12px] text-on-surface-variant">{formatDay(o.date)} · {formatMoney(o.total)}</span>
                    </span>
                    <StatusBadge status={o.status} />
                  </li>
                ))}
              </ul>
              <Link href={adminPath(`/orders?q=${encodeURIComponent(v.name)}`)} className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline">View all {v.totalOrders} orders <span className="material-symbols-outlined text-[18px]">arrow_forward</span></Link>
            </>
          )
        )}
      </div>

      {/* Actions depend on the vendor's status */}
      {v && !error && (
        <div className="px-5 py-4 border-t border-outline-variant/50 space-y-2.5 bg-surface pb-safe">
          {tab !== 'analytics' && v.status !== 'Pending' && (
            <button onClick={() => setTab('analytics')} className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-brand-black text-white text-[14px] font-medium hover:bg-black/80">
              View Full Analytics <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          )}
          <div className="grid grid-cols-2 gap-2.5">
            {v.status === 'Pending' ? (
              <>
                <button disabled={busy} onClick={onApprove} className="h-11 flex items-center justify-center gap-2 rounded-xl bg-green-700 text-white text-[14px] font-medium hover:bg-green-800 disabled:opacity-50">
                  <span className="material-symbols-outlined text-[20px]">check_circle</span> Approve Vendor
                </button>
                <button disabled={busy} onClick={onReject} className="h-11 flex items-center justify-center gap-2 rounded-xl border border-brand-red text-brand-red text-[14px] font-medium hover:bg-red-50 disabled:opacity-50">
                  <span className="material-symbols-outlined text-[20px]">block</span> Reject
                </button>
              </>
            ) : (
              <>
                <a href={messageVendorHref(v)} className="h-11 flex items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white text-[14px] font-medium text-on-surface hover:bg-surface-container-low">
                  <span className="material-symbols-outlined text-[20px]">chat</span> Message Vendor
                </a>
                {v.status === 'Active' ? (
                  <button disabled={busy} onClick={onSuspend} className="h-11 flex items-center justify-center gap-2 rounded-xl border border-brand-red text-brand-red text-[14px] font-medium hover:bg-red-50 disabled:opacity-50">
                    <span className="material-symbols-outlined text-[20px]">block</span> Suspend Vendor
                  </button>
                ) : (
                  <button disabled={busy} onClick={onReactivate} className="h-11 flex items-center justify-center gap-2 rounded-xl border border-green-700 text-green-700 text-[14px] font-medium hover:bg-green-50 disabled:opacity-50">
                    <span className="material-symbols-outlined text-[20px]">check_circle</span> Reactivate
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
