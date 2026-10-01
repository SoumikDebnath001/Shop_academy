"use client";
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { adminPath } from '../../../../services/adminRoutes';
import { formatMoney } from '../../../../services/currency';
import { CUSTOMER_COUNTRIES, CUSTOMER_TYPES, CustomerDetail, NewCustomer } from '../../../../services/adminCustomers';
import { Skeleton, StatusBadge, useDismiss } from '../../_dashboard/ui';

export const formatDay = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const AVATAR_TINTS = ['bg-slate-200 text-slate-700', 'bg-blue-100 text-blue-800', 'bg-amber-100 text-amber-800', 'bg-green-100 text-green-800', 'bg-violet-100 text-violet-800'];

export function Avatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'lg' }) {
  const words = name.replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean);
  const initials = (words.length > 2 ? words.slice(0, 3).map((w) => w[0]).join('') : words.slice(0, 2).map((w) => w[0]).join('')).toUpperCase();
  const tint = AVATAR_TINTS[name.length % AVATAR_TINTS.length];
  return (
    <span className={`${size === 'lg' ? 'w-16 h-16 text-[20px]' : 'w-8 h-8 text-[11px]'} ${tint} rounded-full flex items-center justify-center font-semibold shrink-0`} aria-hidden="true">
      {initials}
    </span>
  );
}

export const messageHref = (c: { email: string; name: string }) =>
  `mailto:${c.email}?subject=${encodeURIComponent(`Message from Obuya Foundation Shop`)}&body=${encodeURIComponent(`Hello ${c.name},\n\n`)}`;

/* ---------- Add / edit customer popup ---------- */

const EMAIL_RULE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function CustomerFormDialog({ title, initial, busy, error, onCancel, onSave }: {
  title: string; initial?: NewCustomer; busy: boolean; error: string; onCancel: () => void; onSave: (c: NewCustomer) => void;
}) {
  const [form, setForm] = useState<NewCustomer>(initial ?? { name: '', email: '', phone: '', type: 'Individual', city: '', country: 'Kenya' });
  const [touched, setTouched] = useState(false);
  const set = (k: keyof NewCustomer) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const problems: Partial<Record<keyof NewCustomer, string>> = {
    name: form.name.trim() ? '' : 'Enter a name',
    email: EMAIL_RULE.test(form.email.trim()) ? '' : 'Enter a valid email',
    phone: form.phone.replace(/\D/g, '').length >= 7 ? '' : 'Enter a phone number',
  };
  const valid = !Object.values(problems).some(Boolean);
  const input = (bad?: string) => `mt-1 w-full h-11 px-3 rounded-xl border text-[14px] outline-none focus:ring-2 ${touched && bad ? 'border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/15'}`;

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
          <label className="sm:col-span-2">Full name / organisation
            <input autoFocus value={form.name} onChange={set('name')} className={input(problems.name)} />
            {touched && problems.name && <span className="block mt-1 text-[12px] font-normal text-error">{problems.name}</span>}
          </label>
          <label>Email
            <input type="email" value={form.email} onChange={set('email')} className={input(problems.email)} />
            {touched && problems.email && <span className="block mt-1 text-[12px] font-normal text-error">{problems.email}</span>}
          </label>
          <label>Phone
            <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+254 7xx xxx xxx" className={input(problems.phone)} />
            {touched && problems.phone && <span className="block mt-1 text-[12px] font-normal text-error">{problems.phone}</span>}
          </label>
          <label>Customer type
            <select value={form.type} onChange={set('type')} className={input()}>{CUSTOMER_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
          </label>
          <label>Country
            <select value={form.country} onChange={set('country')} className={input()}>{CUSTOMER_COUNTRIES.map((c) => <option key={c}>{c}</option>)}</select>
          </label>
          <label className="sm:col-span-2">City
            <input value={form.city} onChange={set('city')} className={input()} />
          </label>
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

/* ---------- Panel ---------- */

type Tab = 'overview' | 'orders' | 'addresses' | 'notes';

const SectionHead = ({ title, action }: { title: string; action?: React.ReactNode }) => (
  <div className="flex items-center justify-between mb-3">
    <h3 className="text-[15px] font-semibold text-on-surface">{title}</h3>
    {action}
  </div>
);

const ViewAll = ({ onClick, href }: { onClick?: () => void; href?: string }) => {
  const cls = 'flex items-center gap-1 text-[13px] font-medium text-primary hover:underline';
  const body = <>View all <span className="material-symbols-outlined text-[18px]">arrow_forward</span></>;
  return href ? <Link href={href} className={cls}>{body}</Link> : <button onClick={onClick} className={cls}>{body}</button>;
};

function OrdersList({ orders }: { orders: CustomerDetail['orders'] }) {
  if (!orders.length) return <p className="text-[13px] text-on-surface-variant">No orders yet.</p>;
  return (
    <ul className="divide-y divide-outline-variant/40">
      {orders.map((o, i) => (
        <li key={`${o.id}-${i}`} className="grid grid-cols-[5.5rem_1fr_auto_auto] items-center gap-2 py-2 text-[13px]">
          <Link href={adminPath(`/orders?q=${encodeURIComponent(o.id)}`)} className="font-semibold text-on-surface hover:text-primary">{o.id}</Link>
          <span className="text-on-surface-variant whitespace-nowrap">{formatDay(o.date)}</span>
          <span className="tabular-nums whitespace-nowrap text-right">{formatMoney(o.total)}</span>
          <StatusBadge status={o.status} />
        </li>
      ))}
    </ul>
  );
}

function AddressList({ addresses }: { addresses: CustomerDetail['addresses'] }) {
  return (
    <ul className="space-y-3">
      {addresses.map((a, i) => (
        <li key={i} className="flex gap-3 text-[13px]">
          <span className="material-symbols-outlined text-[22px] text-on-surface" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
          <span>
            <span className="block font-medium text-on-surface">{a.label}</span>
            <span className="block text-on-surface-variant">{a.line}</span>
            <span className="block text-on-surface-variant">{a.city}{a.postcode ? ` ${a.postcode}` : ''}, {a.country}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function CustomerDetailPanel({ customer, loading, error, busy, onClose, onEdit, onToggleStatus, onAddNote }: {
  customer: CustomerDetail | null; loading: boolean; error: string; busy: boolean;
  onClose: () => void; onEdit: () => void; onToggleStatus: () => void; onAddNote: (text: string) => Promise<void>;
}) {
  const [tab, setTab] = useState<Tab>('overview');
  const [moreOpen, setMoreOpen] = useState(false);
  const closeMore = useCallback(() => setMoreOpen(false), []);
  const moreRef = useDismiss<HTMLDivElement>(moreOpen, closeMore);
  const [note, setNote] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.querySelector('[role=dialog],[role=alertdialog]')) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const c = customer;
  const tabBtn = (key: Tab, label: string) => (
    <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={`relative h-10 px-2.5 text-[13px] whitespace-nowrap ${tab === key ? 'text-brand-red font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`}>
      {label}
      {tab === key && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-brand-red rounded-full" />}
    </button>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start gap-4 px-5 pt-5">
        {c ? <Avatar name={c.name} size="lg" /> : <Skeleton className="w-16 h-16 rounded-full" />}
        <div className="flex-1 min-w-0">
          {c ? (
            <>
              <p className="text-[18px] font-bold text-on-surface leading-snug">{c.name}</p>
              <div className="flex flex-wrap gap-1.5 mt-1"><StatusBadge status={c.type === 'Individual' ? 'Individual' : c.type} /><StatusBadge status={c.status} /></div>
              <ul className="mt-2.5 space-y-1 text-[13px] text-on-surface-variant">
                {[['mail', c.email], ['call', c.phone], ['location_on', `${c.city}, ${c.country}`], ['event', `Joined ${formatDay(c.joinedAt)}`]].map(([icon, text]) => (
                  <li key={icon} className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                    <span className="truncate">{text}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : <Skeleton className="h-28" />}
        </div>
        <button onClick={onClose} aria-label="Close customer details" className="w-9 h-9 -mr-2 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high shrink-0">
          <span className="material-symbols-outlined text-[24px]">close</span>
        </button>
      </div>

      {/* Tabs */}
      <div role="tablist" className="flex items-center gap-1 px-5 mt-4 border-b border-outline-variant/50">
        {tabBtn('overview', 'Overview')}
        {tabBtn('orders', `Orders (${c?.orders.length ?? 0})`)}
        {tabBtn('addresses', `Addresses (${c?.addresses.length ?? 0})`)}
        <div ref={moreRef} className="relative ml-auto">
          <button onClick={() => setMoreOpen((o) => !o)} aria-expanded={moreOpen} className={`h-10 px-2.5 flex items-center gap-0.5 text-[13px] ${tab === 'notes' ? 'text-brand-red font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`}>
            More <span className="material-symbols-outlined text-[18px]">expand_more</span>
          </button>
          {moreOpen && (
            <div className="absolute right-0 z-30 mt-1 w-44 bg-white rounded-2xl border border-outline-variant/50 shadow-xl py-2">
              <button onClick={() => { setTab('notes'); closeMore(); }} className="w-full flex items-center gap-3 px-4 h-10 text-[14px] text-on-surface hover:bg-surface-container-low">
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant">sticky_note_2</span> Notes ({c?.notes.length ?? 0})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {error ? (
          <p className="rounded-2xl bg-red-50 border border-red-200 p-4 text-[13px] text-error">{error}</p>
        ) : !c || loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
        ) : tab === 'overview' ? (
          <div className="space-y-6">
            <section>
              <SectionHead title="Customer Summary" action={<button onClick={onEdit} className="text-[13px] font-medium text-primary hover:underline">Edit</button>} />
              <dl className="grid grid-cols-[minmax(0,7.5rem)_1fr] gap-x-4 gap-y-2 text-[13px]">
                {([
                  ['Full Name', c.name], ['Email', c.email], ['Phone', c.phone], ['Country', c.country],
                  ['Customer Type', c.type], ['Account Status', <StatusBadge key="s" status={c.status} />],
                  ['Total Orders', c.totalOrders], ['Total Spent', formatMoney(c.totalSpent)],
                  ['Last Order', c.lastOrderAt ? formatDay(c.lastOrderAt) : 'No orders yet'],
                ] as [string, React.ReactNode][]).map(([k, v]) => (
                  <React.Fragment key={k}><dt className="text-on-surface-variant">{k}</dt><dd className="text-on-surface min-w-0 break-words">{v}</dd></React.Fragment>
                ))}
              </dl>
            </section>
            <section className="pt-5 border-t border-outline-variant/50">
              <SectionHead title="Recent Orders" action={c.orders.length > 5 ? <ViewAll onClick={() => setTab('orders')} /> : undefined} />
              <OrdersList orders={c.orders.slice(0, 5)} />
            </section>
            <section className="pt-5 border-t border-outline-variant/50">
              <SectionHead title="Addresses" action={c.addresses.length > 1 ? <ViewAll onClick={() => setTab('addresses')} /> : undefined} />
              <AddressList addresses={c.addresses.slice(0, 1)} />
            </section>
          </div>
        ) : tab === 'orders' ? (
          <>
            <OrdersList orders={c.orders} />
            {c.orders.length > 0 && <div className="mt-4"><ViewAll href={adminPath(`/orders?q=${encodeURIComponent(c.name)}`)} /></div>}
          </>
        ) : tab === 'addresses' ? (
          <AddressList addresses={c.addresses} />
        ) : (
          <div className="space-y-4">
            <form onSubmit={async (e) => { e.preventDefault(); if (!note.trim()) return; await onAddNote(note.trim()); setNote(''); }} className="space-y-2">
              <label htmlFor="customer-note" className="text-[13px] font-medium text-on-surface">Add a private note</label>
              <textarea id="customer-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Only admins can see notes" className="w-full rounded-xl border border-outline-variant p-3 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 resize-none" />
              <div className="flex justify-end"><button disabled={!note.trim() || busy} className="h-10 px-4 rounded-xl bg-brand-green-dark text-white text-[13px] font-medium disabled:opacity-40">Save note</button></div>
            </form>
            {c.notes.length === 0 ? <p className="text-[13px] text-on-surface-variant">No notes yet.</p> : (
              <ul className="space-y-3">
                {[...c.notes].reverse().map((n, i) => (
                  <li key={i} className="rounded-xl bg-surface-container-low p-3 text-[13px]">
                    <p className="text-on-surface whitespace-pre-wrap">{n.text}</p>
                    <p className="text-[12px] text-on-surface-variant mt-1">{new Date(n.at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {c && !error && (
        <div className="grid grid-cols-2 gap-2.5 px-5 py-4 border-t border-outline-variant/50 bg-surface pb-safe">
          <a href={messageHref(c)} className="h-11 flex items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white text-[14px] font-medium text-on-surface hover:bg-surface-container-low">
            <span className="material-symbols-outlined text-[20px]">mail</span> Send Message
          </a>
          <button disabled={busy} onClick={onToggleStatus} className={`h-11 flex items-center justify-center gap-2 rounded-xl border text-[14px] font-medium disabled:opacity-50 ${c.status === 'Disabled' ? 'border-green-700 text-green-700 hover:bg-green-50' : 'border-brand-red text-brand-red hover:bg-red-50'}`}>
            <span className="material-symbols-outlined text-[20px]">{c.status === 'Disabled' ? 'check_circle' : 'block'}</span>
            {c.status === 'Disabled' ? 'Enable Account' : 'Disable Account'}
          </button>
        </div>
      )}
    </div>
  );
}
