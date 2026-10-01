"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminPath } from '../../../../services/adminRoutes';
import { formatMoney } from '../../../../services/currency';
import { AdminProduct, ReviewDecision } from '../../../../services/adminProducts';
import { Skeleton, StatusBadge } from '../../_dashboard/ui';

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });

// Soft background tints for the picture placeholders, so the 4 "images" look different
const TILE_TINTS = ['bg-amber-50', 'bg-stone-100', 'bg-orange-50', 'bg-zinc-100'];

/* Picture placeholder: real photos will come from the product's Cloudinary images */
export function ProductThumb({ icon, size = 'md', tint = 0 }: { icon: string; size?: 'sm' | 'md' | 'lg'; tint?: number }) {
  const box = { sm: 'w-10 h-10 text-[22px]', md: 'w-16 h-16 text-[32px]', lg: 'w-24 h-24 text-[44px]' }[size];
  return (
    <span className={`${box} ${TILE_TINTS[tint % TILE_TINTS.length]} rounded-xl flex items-center justify-center shrink-0 border border-outline-variant/40`}>
      <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 'inherit' }}>{icon}</span>
    </span>
  );
}

/* Section that can be folded away with the arrow on its title */
function Collapsible({ title, icon, action, children }: { title: string; icon?: string; action?: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="border-b border-outline-variant/50 last:border-0 py-4">
      <div className="flex items-center gap-3">
        {icon && <span className="material-symbols-outlined text-[22px] text-on-surface" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>}
        <h3 className="flex-1 text-[15px] font-semibold text-on-surface">{title}</h3>
        {action}
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={`${open ? 'Hide' : 'Show'} ${title}`} className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high">
          <span className="material-symbols-outlined text-[22px]">{open ? 'expand_less' : 'expand_more'}</span>
        </button>
      </div>
      {open && <div className="mt-3">{children}</div>}
    </section>
  );
}

const Fields = ({ rows }: { rows: [string, React.ReactNode][] }) => (
  <dl className="grid grid-cols-[minmax(0,7rem)_1fr] gap-x-4 gap-y-2.5 text-[13px]">
    {rows.map(([k, v]) => (
      <React.Fragment key={k}>
        <dt className="text-on-surface-variant">{k}</dt>
        <dd className="text-on-surface min-w-0 break-words">{v || <span className="text-on-surface-variant/60">Not given</span>}</dd>
      </React.Fragment>
    ))}
  </dl>
);

/* Popup asking why a product is rejected or sent back */
export function ReasonDialog({ decision, count, busy, onCancel, onConfirm }: {
  decision: Exclude<ReviewDecision, 'approve'>; count: number; busy: boolean; onCancel: () => void; onConfirm: (note: string) => void;
}) {
  const [note, setNote] = useState('');
  const reject = decision === 'reject';
  const what = count === 1 ? 'this product' : `${count} products`;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} aria-hidden="true" />
      <form
        role="dialog" aria-modal="true" aria-label={reject ? 'Reject product' : 'Request changes'}
        onSubmit={(e) => { e.preventDefault(); if (note.trim()) onConfirm(note.trim()); }}
        className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 pb-safe"
      >
        <h3 className="text-[18px] font-semibold text-on-surface">{reject ? `Reject ${what}?` : `Request changes for ${what}`}</h3>
        <p className="text-[13px] text-on-surface-variant mt-1">The vendor will see this message{reject ? ' and the product will not be published' : ' and can resubmit after fixing it'}.</p>
        <label htmlFor="review-note" className="block text-[13px] font-medium text-on-surface mt-4 mb-1.5">{reject ? 'Reason' : 'What needs to change?'}</label>
        <textarea
          id="review-note"
          autoFocus
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={reject ? 'e.g. The images do not match the product' : 'e.g. Please add size details and a photo of the back'}
          className="w-full rounded-xl border border-outline-variant p-3 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 resize-none"
        />
        <div className="flex justify-end gap-2 mt-4">
          <button type="button" onClick={onCancel} className="h-11 px-4 rounded-xl text-[14px] font-medium text-on-surface-variant hover:bg-surface-container-low">Cancel</button>
          <button type="submit" disabled={!note.trim() || busy} className={`h-11 px-5 rounded-xl text-white text-[14px] font-medium disabled:opacity-40 ${reject ? 'bg-brand-red' : 'bg-brand-green-dark'}`}>
            {busy ? 'Saving…' : reject ? 'Reject' : 'Send request'}
          </button>
        </div>
      </form>
    </div>
  );
}

type Tab = 'details' | 'images' | 'vendor' | 'history';

export default function ProductDetailPanel({ product, loading, error, busy, onClose, onReview, onPublish }: {
  product: AdminProduct | null; loading: boolean; error: string; busy: boolean;
  onClose: () => void;
  onReview: (decision: ReviewDecision, note?: string) => void;
  onPublish: (published: boolean) => void;
}) {
  const [tab, setTab] = useState<Tab>('details');
  const [asking, setAsking] = useState<Exclude<ReviewDecision, 'approve'> | null>(null);

  // Escape closes the panel (unless the reason popup is open, which handles Escape itself)
  useEffect(() => {
    if (asking) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, asking]);

  const p = product;
  const tabs: { key: Tab; label: string }[] = [
    { key: 'details', label: 'Details' },
    { key: 'images', label: `Images (${p?.imageCount ?? 0})` },
    { key: 'vendor', label: 'Vendor Info' },
    { key: 'history', label: 'History' },
  ];
  const reviewable = p && (p.status === 'Pending' || p.status === 'Changes Requested' || p.status === 'Rejected');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start gap-3 px-5 pt-5">
        {p ? <ProductThumb icon={p.icon} size="lg" /> : <Skeleton className="w-24 h-24 rounded-xl" />}
        <div className="flex-1 min-w-0">
          {p ? (
            <>
              <p className="text-[18px] font-bold text-on-surface leading-snug">{p.name}</p>
              <div className="mt-1"><StatusBadge status={p.status === 'Pending' ? 'Pending Approval' : p.status} /></div>
              <p className="text-[13px] text-on-surface-variant mt-1.5">by {p.vendor}</p>
              <p className="text-[12px] text-on-surface-variant">Submitted on {formatDateTime(p.submittedAt)}</p>
            </>
          ) : <Skeleton className="h-20" />}
        </div>
        <button onClick={onClose} aria-label="Close product details" className="w-9 h-9 -mr-2 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high shrink-0">
          <span className="material-symbols-outlined text-[24px]">close</span>
        </button>
      </div>

      {/* Tabs */}
      <div role="tablist" className="flex gap-1 px-5 mt-4 border-b border-outline-variant/50 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)} className={`relative h-10 px-2.5 text-[13px] whitespace-nowrap ${tab === t.key ? 'text-brand-red font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`}>
            {t.label}
            {tab === t.key && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-brand-red rounded-full" />}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5">
        {error ? (
          <p className="my-4 rounded-2xl bg-red-50 border border-red-200 p-4 text-[13px] text-error">{error}</p>
        ) : !p || loading ? (
          <div className="py-4 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
        ) : tab === 'details' ? (
          <>
            <Collapsible title="Product Information">
              <Fields rows={[
                ['Product Name', p.name],
                ['SKU', p.sku],
                ['Category', p.subcategory ? <>{p.category} <span className="text-on-surface-variant">›</span> {p.subcategory}</> : p.category],
                ['Sport', p.sport],
                ['Brand', p.brand],
                ['Price', formatMoney(p.price)],
                ['Stock Quantity', p.stock.toLocaleString('en-US')],
                ['Description', p.description],
              ]} />
            </Collapsible>
            <Collapsible title="Additional Details">
              <Fields rows={[
                ['Material', p.material],
                ['Weight', p.weight],
                ['Target Audience', p.audience],
                ['Tags', p.tags.length ? <span className="flex flex-wrap gap-1.5">{p.tags.map((t) => <span key={t} className="px-2 py-0.5 rounded-md bg-surface-container-high text-[12px]">{t}</span>)}</span> : ''],
              ]} />
            </Collapsible>
            <Collapsible title="Vendor Information" icon="storefront">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-on-surface">{p.vendor}</span>
                <Link href={adminPath(`/vendors?q=${encodeURIComponent(p.vendor)}`)} className="flex items-center gap-1 text-primary font-medium hover:underline">View Vendor <span className="material-symbols-outlined text-[18px]">arrow_forward</span></Link>
              </div>
            </Collapsible>
            <Collapsible title={`Submitted Images (${p.imageCount})`} icon="photo_library">
              {p.imageCount ? (
                <div className="grid grid-cols-4 gap-2">{Array.from({ length: p.imageCount }).map((_, i) => <ProductThumb key={i} icon={p.icon} tint={i} />)}</div>
              ) : <p className="text-[13px] text-on-surface-variant">No images submitted yet.</p>}
            </Collapsible>
          </>
        ) : tab === 'images' ? (
          <div className="py-4">
            {p.imageCount ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: p.imageCount }).map((_, i) => (
                  <figure key={i} className="flex flex-col gap-1">
                    <span className={`aspect-square rounded-2xl ${TILE_TINTS[i % TILE_TINTS.length]} border border-outline-variant/40 flex items-center justify-center`}>
                      <span className="material-symbols-outlined text-[64px] text-on-surface-variant">{p.icon}</span>
                    </span>
                    <figcaption className="text-[12px] text-on-surface-variant">Image {i + 1}{i === 0 ? ' · Cover' : ''}</figcaption>
                  </figure>
                ))}
              </div>
            ) : <p className="text-[13px] text-on-surface-variant">No images submitted yet.</p>}
            <p className="text-[12px] text-on-surface-variant mt-3">Demo pictures. Real photos will show here once the backend sends them.</p>
          </div>
        ) : tab === 'vendor' ? (
          <div className="py-4 space-y-4">
            <Fields rows={[['Vendor', p.vendor], ['Brand', p.brand], ['Sport', p.sport]]} />
            <Link href={adminPath(`/vendors?q=${encodeURIComponent(p.vendor)}`)} className="inline-flex items-center gap-1 text-[13px] text-primary font-medium hover:underline">Open vendor profile <span className="material-symbols-outlined text-[18px]">arrow_forward</span></Link>
          </div>
        ) : (
          <ol className="py-4 space-y-4">
            {[...p.history].reverse().map((h, i) => (
              <li key={i} className="flex gap-3">
                <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${i === 0 ? 'bg-primary' : 'bg-outline-variant'}`} />
                <span>
                  <span className="block text-[13px] text-on-surface">{h.text}</span>
                  <span className="block text-[12px] text-on-surface-variant">{formatDateTime(h.at)}</span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Actions depend on where the product is in review */}
      {p && !error && (
        <div className="px-5 py-4 border-t border-outline-variant/50 space-y-2.5 bg-surface pb-safe">
          {reviewable ? (
            <>
              <div className="grid grid-cols-2 gap-2.5">
                <button disabled={busy} onClick={() => onReview('approve')} className="h-11 flex items-center justify-center gap-2 rounded-xl bg-green-700 text-white text-[14px] font-medium hover:bg-green-800 disabled:opacity-60">
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Approve &amp; Publish
                </button>
                <button disabled={busy || p.status === 'Rejected'} onClick={() => setAsking('reject')} className="h-11 flex items-center justify-center gap-2 rounded-xl bg-brand-red text-white text-[14px] font-medium hover:bg-[#b8231d] disabled:opacity-40">
                  <span className="material-symbols-outlined text-[20px]">close</span> Reject
                </button>
              </div>
              <button disabled={busy} onClick={() => setAsking('request-changes')} className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white text-[14px] font-medium text-on-surface hover:bg-surface-container-low disabled:opacity-60">
                <span className="material-symbols-outlined text-[20px]">chat</span> Request Changes
              </button>
            </>
          ) : (
            <button disabled={busy} onClick={() => onPublish(p.status !== 'Live')} className={`w-full h-11 flex items-center justify-center gap-2 rounded-xl text-[14px] font-medium disabled:opacity-60 ${p.status === 'Live' ? 'border border-outline-variant bg-white text-on-surface hover:bg-surface-container-low' : 'bg-green-700 text-white hover:bg-green-800'}`}>
              <span className="material-symbols-outlined text-[20px]">{p.status === 'Live' ? 'visibility_off' : 'visibility'}</span>
              {p.status === 'Live' ? 'Unpublish' : 'Publish'}
            </button>
          )}
        </div>
      )}

      {asking && p && (
        <ReasonDialog decision={asking} count={1} busy={busy} onCancel={() => setAsking(null)} onConfirm={(note) => { onReview(asking, note); setAsking(null); }} />
      )}
    </div>
  );
}
