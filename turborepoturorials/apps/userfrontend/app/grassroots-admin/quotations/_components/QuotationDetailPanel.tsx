"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminPath } from '../../../../services/adminRoutes';
import { formatMoney } from '../../../../services/currency';
import { toIso } from '../../../../services/adminDashboard';
import { NewQuotation, ORG_TYPES, Organization, QUOTE_CATALOGUE, QuoteItem, Quotation } from '../../../../services/adminQuotations';
import { Skeleton, StatusBadge } from '../../_dashboard/ui';

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
export const formatDay = (iso: string) => new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const ORG_ICON: Record<string, string> = { School: 'school', Club: 'sports_soccer', Institution: 'account_balance', NGO: 'volunteer_activism' };

export function OrgLogo({ org, size = 'sm' }: { org: Pick<Organization, 'type'>; size?: 'sm' | 'lg' }) {
  return (
    <span className={`${size === 'lg' ? 'w-12 h-12 text-[26px]' : 'w-8 h-8 text-[18px]'} rounded-full bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0`} aria-hidden="true">
      <span className="material-symbols-outlined" style={{ fontSize: 'inherit', fontVariationSettings: "'FILL' 1" }}>{ORG_ICON[org.type] ?? 'groups'}</span>
    </span>
  );
}

const itemsValue = (items: QuoteItem[]) => items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
const EMAIL_RULE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label={title} className={`relative w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'} max-h-[92vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 pb-safe`}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <h3 className="text-[18px] font-semibold text-on-surface">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="w-9 h-9 -mr-2 -mt-1 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputCls = 'mt-1 w-full h-11 px-3 rounded-xl border border-outline-variant text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15';

/* ---------- Organisation fields (used by New Quotation and Edit) ---------- */

function OrgFields({ org, onChange, touched }: { org: Organization; onChange: (o: Organization) => void; touched: boolean }) {
  const set = (k: keyof Organization) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange({ ...org, [k]: e.target.value });
  const bad = (ok: boolean) => (touched && !ok ? 'border-error' : '');
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px] font-medium text-on-surface">
      <label className="sm:col-span-2">Organization name<input value={org.name} onChange={set('name')} className={`${inputCls} ${bad(!!org.name.trim())}`} /></label>
      <label>Type<select value={org.type} onChange={set('type')} className={inputCls}>{ORG_TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
      <label>Contact person<input value={org.contact} onChange={set('contact')} className={`${inputCls} ${bad(!!org.contact.trim())}`} /></label>
      <label>Email<input type="email" value={org.email} onChange={set('email')} className={`${inputCls} ${bad(EMAIL_RULE.test(org.email))}`} /></label>
      <label>Phone<input type="tel" value={org.phone} onChange={set('phone')} className={inputCls} /></label>
      <label className="sm:col-span-2">Address<input value={org.address} onChange={set('address')} className={inputCls} /></label>
    </div>
  );
}

const orgValid = (o: Organization) => !!o.name.trim() && !!o.contact.trim() && EMAIL_RULE.test(o.email.trim());

export function EditOrgDialog({ initial, busy, onCancel, onSave }: { initial: Organization; busy: boolean; onCancel: () => void; onSave: (o: Organization) => void }) {
  const [org, setOrg] = useState(initial);
  const [touched, setTouched] = useState(false);
  return (
    <Modal title="Edit organization details" onClose={onCancel}>
      <form noValidate onSubmit={(e) => { e.preventDefault(); setTouched(true); if (orgValid(org)) onSave(org); }}>
        <OrgFields org={org} onChange={setOrg} touched={touched} />
        {touched && !orgValid(org) && <p className="mt-3 text-[13px] text-error">Fill in the name, contact person and a valid email.</p>}
        <div className="flex justify-end gap-2 mt-6">
          <button type="button" onClick={onCancel} className="h-11 px-4 rounded-xl text-[14px] font-medium text-on-surface-variant hover:bg-surface-container-low">Cancel</button>
          <button type="submit" disabled={busy} className="h-11 px-5 rounded-xl bg-brand-red text-white text-[14px] font-medium disabled:opacity-50">{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------- New quotation (a request received by phone or email) ---------- */

export function NewQuotationDialog({ busy, onCancel, onSave }: { busy: boolean; onCancel: () => void; onSave: (q: NewQuotation) => void }) {
  const [org, setOrg] = useState<Organization>({ name: '', type: 'School', contact: '', email: '', phone: '', address: '' });
  const [message, setMessage] = useState('');
  const [lines, setLines] = useState<{ product: string; quantity: number }[]>([{ product: QUOTE_CATALOGUE[0].product, quantity: 10 }]);
  const [touched, setTouched] = useState(false);
  const linesValid = lines.some((l) => l.quantity > 0);
  const estimate = lines.reduce((s, l) => s + (QUOTE_CATALOGUE.find((c) => c.product === l.product)?.price ?? 0) * (l.quantity || 0), 0);

  return (
    <Modal title="New Quotation" onClose={onCancel} wide>
      <form noValidate onSubmit={(e) => { e.preventDefault(); setTouched(true); if (orgValid(org) && linesValid) onSave({ org, message: message.trim(), items: lines }); }} className="space-y-6">
        <OrgFields org={org} onChange={setOrg} touched={touched} />
        <label className="block text-[13px] font-medium text-on-surface">Request / message
          <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} className="mt-1 w-full rounded-xl border border-outline-variant p-3 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 resize-none" />
        </label>
        <fieldset>
          <legend className="text-[13px] font-medium text-on-surface mb-2">Requested items</legend>
          <ul className="space-y-2">
            {lines.map((l, i) => (
              <li key={i} className="flex gap-2">
                <select aria-label={`Item ${i + 1}`} value={l.product} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, product: e.target.value } : x)))} className="flex-1 min-w-0 h-11 px-3 rounded-xl border border-outline-variant text-[14px]">
                  {QUOTE_CATALOGUE.map((c) => <option key={c.product}>{c.product}</option>)}
                </select>
                <input aria-label={`Quantity for item ${i + 1}`} type="number" min={1} value={l.quantity || ''} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, quantity: Math.max(0, Number(e.target.value)) } : x)))} className="w-24 h-11 px-3 rounded-xl border border-outline-variant text-[14px] tabular-nums" />
                <button type="button" onClick={() => setLines(lines.filter((_, j) => j !== i))} disabled={lines.length === 1} aria-label={`Remove item ${i + 1}`} className="w-11 h-11 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-high disabled:opacity-30">
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between mt-2">
            <button type="button" onClick={() => setLines([...lines, { product: QUOTE_CATALOGUE[lines.length % QUOTE_CATALOGUE.length].product, quantity: 10 }])} className="h-10 px-3 flex items-center gap-1 rounded-xl text-[13px] font-medium text-primary hover:bg-primary/5">
              <span className="material-symbols-outlined text-[18px]">add</span> Add item
            </button>
            <span className="text-[13px] text-on-surface-variant">Estimated value: <strong className="text-on-surface">{formatMoney(estimate)}</strong></span>
          </div>
        </fieldset>
        {touched && (!orgValid(org) || !linesValid) && <p className="text-[13px] text-error">Fill in the organization name, contact person, a valid email and at least one item.</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="h-11 px-4 rounded-xl text-[14px] font-medium text-on-surface-variant hover:bg-surface-container-low">Cancel</button>
          <button type="submit" disabled={busy} className="h-11 px-5 rounded-xl bg-brand-red text-white text-[14px] font-medium disabled:opacity-50">{busy ? 'Saving…' : 'Create request'}</button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------- Send quotation: set the price per item, discount, delivery and validity ---------- */

export function SendQuotationDialog({ quote, busy, onCancel, onSend }: {
  quote: Quotation; busy: boolean; onCancel: () => void;
  onSend: (input: { items: QuoteItem[]; discountPercent: number; deliveryDays: number; validUntil: string; message: string }) => void;
}) {
  const inTwoWeeks = () => { const d = new Date(); d.setDate(d.getDate() + 14); return toIso(d); };
  const [items, setItems] = useState(quote.items);
  const [discount, setDiscount] = useState(quote.sent?.discountPercent ?? 5);
  const [days, setDays] = useState(quote.sent?.deliveryDays ?? 14);
  const [validUntil, setValidUntil] = useState(quote.sent?.validUntil ?? inTwoWeeks());
  const [message, setMessage] = useState(quote.sent?.message ?? `Dear ${quote.org.contact},\n\nThank you for your request. Please find our bulk pricing below.`);
  const subtotal = itemsValue(items);
  const total = Math.round(subtotal * (1 - discount / 100));
  const valid = items.every((i) => i.unitPrice > 0) && discount >= 0 && discount < 100 && days > 0 && validUntil >= toIso(new Date());

  return (
    <Modal title={`Send quotation to ${quote.org.name}`} onClose={onCancel} wide>
      <form onSubmit={(e) => { e.preventDefault(); if (valid) onSend({ items, discountPercent: discount, deliveryDays: days, validUntil, message }); }} className="space-y-5">
        <div className="overflow-x-auto max-h-72 overflow-y-auto rounded-xl border border-outline-variant/60">
          <table className="w-full min-w-[480px] text-[13px]">
            <thead className="sticky top-0 bg-surface-container-low text-on-surface-variant text-left">
              <tr><th className="font-semibold px-3 py-2">Item</th><th className="font-semibold px-3 py-2 text-right">Qty</th><th className="font-semibold px-3 py-2 text-right">Unit price (KSh)</th><th className="font-semibold px-3 py-2 text-right">Line total</th></tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {items.map((it, i) => (
                <tr key={i}>
                  <td className="px-3 py-1.5 text-on-surface">{it.product}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{it.quantity}</td>
                  <td className="px-3 py-1.5 text-right">
                    <input aria-label={`Unit price for ${it.product}`} type="number" min={1} value={it.unitPrice || ''} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, unitPrice: Math.max(0, Number(e.target.value)) } : x)))} className="w-28 h-9 px-2 rounded-lg border border-outline-variant text-right tabular-nums" />
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{formatMoney(it.unitPrice * it.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[13px] font-medium text-on-surface">
          <label>Discount (%)<input type="number" min={0} max={99} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className={inputCls} /></label>
          <label>Delivery (days)<input type="number" min={1} value={days} onChange={(e) => setDays(Number(e.target.value))} className={inputCls} /></label>
          <label>Valid until<input type="date" min={toIso(new Date())} value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className={inputCls} /></label>
        </div>

        <label className="block text-[13px] font-medium text-on-surface">Message to the organization
          <textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} className="mt-1 w-full rounded-xl border border-outline-variant p-3 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 resize-none" />
        </label>

        <div className="rounded-xl bg-surface-container-low p-4 text-[14px] space-y-1">
          <p className="flex justify-between"><span className="text-on-surface-variant">Subtotal</span><span className="tabular-nums">{formatMoney(subtotal)}</span></p>
          <p className="flex justify-between"><span className="text-on-surface-variant">Discount ({discount || 0}%)</span><span className="tabular-nums">− {formatMoney(subtotal - total)}</span></p>
          <p className="flex justify-between text-[16px] font-bold pt-1 border-t border-outline-variant/50"><span>Quotation total</span><span className="tabular-nums">{formatMoney(total)}</span></p>
        </div>

        {!valid && <p className="text-[13px] text-error">Every item needs a price, the discount must be under 100% and the validity date cannot be in the past.</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="h-11 px-4 rounded-xl text-[14px] font-medium text-on-surface-variant hover:bg-surface-container-low">Cancel</button>
          <button type="submit" disabled={!valid || busy} className="h-11 px-5 flex items-center gap-2 rounded-xl bg-brand-red text-white text-[14px] font-medium disabled:opacity-40">
            <span className="material-symbols-outlined text-[20px]">send</span>{busy ? 'Sending…' : 'Send Quotation'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------- Panel ---------- */

export default function QuotationDetailPanel({ quote, loading, error, busy, onClose, onEditOrg, onSend, onStatus, onDecline, onAddNote }: {
  quote: Quotation | null; loading: boolean; error: string; busy: boolean;
  onClose: () => void; onEditOrg: () => void; onSend: () => void;
  onStatus: (s: 'In Discussion' | 'Approved' | 'New') => void; onDecline: () => void; onAddNote: (text: string) => Promise<void>;
}) {
  const [allItems, setAllItems] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.querySelector('[role=dialog],[role=alertdialog]')) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const q = quote;
  const open = q && (q.status === 'New' || q.status === 'In Discussion');

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        {q ? (
          <div>
            <p className="flex items-center gap-2 text-[20px] font-bold text-on-surface">{q.id} <StatusBadge status={q.status} /></p>
            <p className="text-[13px] text-on-surface-variant mt-0.5">Requested on {formatDateTime(q.requestedAt)}</p>
          </div>
        ) : <Skeleton className="h-12 w-48" />}
        <button onClick={onClose} aria-label="Close quotation details" className="w-9 h-9 -mr-2 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high shrink-0">
          <span className="material-symbols-outlined text-[24px]">close</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5">
        {error ? (
          <p className="rounded-2xl bg-red-50 border border-red-200 p-4 text-[13px] text-error">{error}</p>
        ) : !q || loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
        ) : (
          <div className="space-y-6">
            <section className="pt-3 border-t border-outline-variant/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[15px] font-semibold text-on-surface">Organization Details</h3>
                <button onClick={onEditOrg} className="text-[13px] font-medium text-primary hover:underline">Edit</button>
              </div>
              <div className="flex items-center gap-3 mb-3"><OrgLogo org={q.org} size="lg" /><span className="text-[15px] font-semibold text-on-surface">{q.org.name}</span></div>
              <dl className="grid grid-cols-[minmax(0,7rem)_1fr] gap-x-4 gap-y-2 text-[13px]">
                {([
                  ['Type', q.org.type], ['Contact Person', q.org.contact],
                  ['Email', <a key="e" href={`mailto:${q.org.email}`} className="text-blue-700 hover:underline break-all">{q.org.email}</a>],
                  ['Phone', q.org.phone], ['Address', q.org.address],
                  ['Message', q.message ? <span key="m" className="italic">“{q.message}”</span> : '—'],
                ] as [string, React.ReactNode][]).map(([k, v]) => (
                  <React.Fragment key={k}><dt className="text-on-surface-variant">{k}</dt><dd className="text-on-surface min-w-0 break-words">{v}</dd></React.Fragment>
                ))}
              </dl>
            </section>

            {q.sent && (
              <section className="rounded-2xl border border-violet-200 bg-violet-50/60 p-4 text-[13px]">
                <p className="font-semibold text-violet-800 flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">send</span> Quotation sent {formatDay(q.sent.at)}</p>
                <p className="mt-1.5 text-on-surface">Total <strong>{formatMoney(q.sent.total)}</strong>{q.sent.discountPercent ? ` (${q.sent.discountPercent}% discount)` : ''} · delivery in {q.sent.deliveryDays} days · valid until {formatDay(q.sent.validUntil)}</p>
              </section>
            )}
            {q.status === 'Declined' && q.declineReason && (
              <section className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-[13px]"><p className="font-semibold text-on-surface">Declined</p><p className="text-on-surface-variant mt-1">{q.declineReason}</p></section>
            )}

            <section className="pt-5 border-t border-outline-variant/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[15px] font-semibold text-on-surface">Requested Items ({q.items.length})</h3>
                {q.items.length > 4 && <button onClick={() => setAllItems((a) => !a)} className="text-[13px] font-medium text-primary hover:underline">{allItems ? 'Show less' : 'View All'}</button>}
              </div>
              <ul className="space-y-2">
                {(allItems ? q.items : q.items.slice(0, 4)).map((it, i) => (
                  <li key={i}>
                    <Link href={adminPath(`/inventory?q=${encodeURIComponent(it.product.split(' – ')[0])}`)} className="flex items-center gap-3 p-1.5 -mx-1.5 rounded-xl hover:bg-surface-container-low">
                      <span className="w-12 h-12 rounded-xl bg-surface-container-low border border-outline-variant/40 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[26px] text-on-surface-variant">{it.icon}</span>
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] font-medium text-on-surface truncate">{it.product}</span>
                        <span className="block text-[12px] text-on-surface-variant">Qty: {it.quantity} · {formatMoney(it.unitPrice)} each</span>
                      </span>
                      <span className="material-symbols-outlined text-[20px] text-on-surface-variant">chevron_right</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[13px] text-on-surface-variant">Estimated value: <strong className="text-on-surface">{formatMoney(q.estimatedValue)}</strong></p>
            </section>

            <section className="pt-5 border-t border-outline-variant/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[15px] font-semibold text-on-surface">Internal Notes</h3>
                {!noteOpen && <button onClick={() => setNoteOpen(true)} className="flex items-center gap-0.5 text-[13px] font-medium text-primary hover:underline"><span className="material-symbols-outlined text-[18px]">add</span>Add Note</button>}
              </div>
              {noteOpen && (
                <form onSubmit={async (e) => { e.preventDefault(); if (!note.trim()) return; await onAddNote(note.trim()); setNote(''); setNoteOpen(false); }} className="mb-3 space-y-2">
                  <textarea autoFocus aria-label="New note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Only admins can see notes" className="w-full rounded-xl border border-outline-variant p-3 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 resize-none" />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => { setNoteOpen(false); setNote(''); }} className="h-9 px-3 rounded-lg text-[13px] text-on-surface-variant hover:bg-surface-container-low">Cancel</button>
                    <button disabled={!note.trim() || busy} className="h-9 px-4 rounded-lg bg-brand-green-dark text-white text-[13px] font-medium disabled:opacity-40">Save note</button>
                  </div>
                </form>
              )}
              {q.notes.length === 0 && !noteOpen ? <p className="text-[13px] text-on-surface-variant">No notes yet.</p> : (
                <ul className="space-y-2">
                  {[...q.notes].reverse().map((n, i) => (
                    <li key={i} className="border-l-4 border-primary/30 bg-surface-container-low rounded-r-xl p-3 text-[13px]">
                      <p className="text-on-surface whitespace-pre-wrap">{n.text}</p>
                      <p className="text-[12px] text-on-surface-variant mt-1">— {n.author}, {formatDay(n.at)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>

      {/* Actions follow the request's status */}
      {q && !error && (
        <div className="px-5 py-4 border-t border-outline-variant/50 space-y-2.5 bg-surface pb-safe">
          {open && <>
            <button disabled={busy} onClick={onSend} className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-brand-red text-white text-[14px] font-medium hover:bg-[#b8231d] disabled:opacity-50"><span className="material-symbols-outlined text-[20px]">send</span> Send Quotation</button>
            <button disabled={busy || q.status === 'In Discussion'} onClick={() => onStatus('In Discussion')} className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white text-[14px] font-medium text-on-surface hover:bg-surface-container-low disabled:opacity-40"><span className="material-symbols-outlined text-[20px]">schedule</span> {q.status === 'In Discussion' ? 'In Discussion' : 'Mark as In Discussion'}</button>
            <button disabled={busy} onClick={onDecline} className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white text-[14px] font-medium text-on-surface hover:bg-red-50 hover:text-brand-red disabled:opacity-50"><span className="material-symbols-outlined text-[20px] text-brand-red">cancel</span> Decline Request</button>
          </>}
          {q.status === 'Quotation Sent' && <>
            <button disabled={busy} onClick={() => onStatus('Approved')} className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-green-700 text-white text-[14px] font-medium hover:bg-green-800 disabled:opacity-50"><span className="material-symbols-outlined text-[20px]">check_circle</span> Mark as Approved</button>
            <button disabled={busy} onClick={onSend} className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white text-[14px] font-medium text-on-surface hover:bg-surface-container-low disabled:opacity-50"><span className="material-symbols-outlined text-[20px]">edit</span> Edit &amp; Resend Quotation</button>
            <button disabled={busy} onClick={onDecline} className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white text-[14px] font-medium text-on-surface hover:bg-red-50 hover:text-brand-red disabled:opacity-50"><span className="material-symbols-outlined text-[20px] text-brand-red">cancel</span> Decline Request</button>
          </>}
          {(q.status === 'Approved' || q.status === 'Declined') && (
            <button disabled={busy} onClick={() => onStatus('In Discussion')} className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white text-[14px] font-medium text-on-surface hover:bg-surface-container-low disabled:opacity-50"><span className="material-symbols-outlined text-[20px]">undo</span> Reopen request</button>
          )}
          <a href={`mailto:${q.org.email}?subject=${encodeURIComponent(`Your quotation request ${q.id}`)}`} className="w-full h-10 flex items-center justify-center gap-2 rounded-xl text-[13px] font-medium text-primary hover:bg-primary/5">
            <span className="material-symbols-outlined text-[18px]">mail</span> Email {q.org.contact}
          </a>
        </div>
      )}
    </div>
  );
}
