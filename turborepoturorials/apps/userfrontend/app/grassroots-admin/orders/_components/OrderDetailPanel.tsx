"use client";
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { adminPath } from '../../../../services/adminRoutes';
import { formatMoney } from '../../../../services/adminDashboard';
import { AdminOrder, ORDER_STATUSES, OrderStatus } from '../../../../services/adminOrders';
import { Skeleton, StatusBadge, useDismiss } from '../../_dashboard/ui';

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });

export const contactHref = (o: AdminOrder) =>
  `mailto:${o.customer.email}?subject=${encodeURIComponent(`Your order ${o.id}`)}`;

/* Card inside the panel: icon on the left, optional arrow link on the right */
function Section({ icon, title, aside, href, external, children }: {
  icon: string; title: string; aside?: React.ReactNode; href?: string; external?: boolean; children: React.ReactNode;
}) {
  const body = (
    <>
      <span className="material-symbols-outlined text-[22px] text-on-surface mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-[14px] font-semibold text-on-surface">{title}</p>
          {aside}
        </div>
        {children}
      </div>
      {href && <span className="material-symbols-outlined text-[22px] text-on-surface-variant self-center">chevron_right</span>}
    </>
  );
  const cls = 'flex gap-3 p-4 rounded-2xl border border-outline-variant/50 bg-white';
  if (!href) return <section className={cls}>{body}</section>;
  return external
    ? <a href={href} target="_blank" rel="noopener noreferrer" className={`${cls} hover:border-primary/40 transition-colors`}>{body}</a>
    : <Link href={href} className={`${cls} hover:border-primary/40 transition-colors`}>{body}</Link>;
}

const Row = ({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) => (
  <div className={`flex justify-between gap-3 text-[13px] ${strong ? 'text-[15px] font-bold text-on-surface pt-2 mt-1 border-t border-outline-variant/50' : 'text-on-surface-variant'}`}>
    <span>{label}</span><span className={`tabular-nums text-right ${strong ? '' : 'text-on-surface'}`}>{value}</span>
  </div>
);

/* Red "Update Order Status" button with a list of statuses */
export function StatusMenuButton({ current, busy, onPick, variant = 'primary' }: {
  current?: OrderStatus; busy?: boolean; onPick: (s: OrderStatus) => void; variant?: 'primary' | 'outline';
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss<HTMLDivElement>(open, close);
  const primary = variant === 'primary';

  return (
    <div ref={ref} className="relative">
      <button
        disabled={busy}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`w-full h-11 flex items-center justify-center gap-2 px-4 rounded-xl text-[14px] font-medium transition-colors disabled:opacity-60 ${primary ? 'bg-brand-red text-white hover:bg-[#b8231d]' : 'bg-white border border-outline-variant text-on-surface hover:bg-surface-container-low'}`}
      >
        <span className="material-symbols-outlined text-[20px]">local_shipping</span>
        {busy ? 'Updating…' : 'Update Order Status'}
        <span className="material-symbols-outlined text-[20px] ml-auto">expand_more</span>
      </button>
      {open && (
        <ul className={`absolute z-50 left-0 right-0 ${primary ? 'bottom-full mb-2' : 'top-full mt-2'} bg-white rounded-2xl border border-outline-variant/50 shadow-xl py-2`}>
          {ORDER_STATUSES.map((s) => (
            <li key={s}>
              <button
                disabled={s === current}
                onClick={() => { setOpen(false); onPick(s); }}
                className="w-full flex items-center justify-between gap-3 px-4 h-10 text-[14px] text-on-surface hover:bg-surface-container-low disabled:opacity-50 disabled:cursor-default"
              >
                <StatusBadge status={s} />
                {s === current && <span className="text-[12px] text-on-surface-variant">Current</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* Popup with every line item and the order timeline */
function FullDetailsModal({ order, onClose }: { order: AdminOrder; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Steps the order has reached, based on its current status
  const flow: OrderStatus[] = ['New', 'Processing', 'Shipped', 'Delivered'];
  const reached = order.status === 'Cancelled' || order.status === 'Return/Refund' ? -1 : flow.indexOf(order.status);

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label={`Order ${order.id} details`} className="relative w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl pb-safe">
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-outline-variant/40">
          <div>
            <h3 className="text-[18px] font-semibold text-on-surface flex items-center gap-2">Order {order.id} <StatusBadge status={order.status} /></h3>
            <p className="text-[13px] text-on-surface-variant mt-0.5">Placed {formatDateTime(order.placedAt)} · {order.type} order</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 -mr-2 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Timeline */}
          <ol className="grid grid-cols-4 gap-2">
            {flow.map((s, i) => (
              <li key={s} className="flex flex-col items-center text-center gap-1.5">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center ${i <= reached ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'}`}>
                  <span className="material-symbols-outlined text-[18px]">{i <= reached ? 'check' : 'more_horiz'}</span>
                </span>
                <span className={`text-[12px] ${i <= reached ? 'text-on-surface font-medium' : 'text-on-surface-variant'}`}>{s}</span>
              </li>
            ))}
          </ol>
          {reached === -1 && <p className="text-[13px] text-error text-center -mt-3">This order is {order.status === 'Cancelled' ? 'cancelled' : 'being returned / refunded'}.</p>}

          {/* Line items */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-[13px]">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-left">
                  <th className="font-semibold px-3 py-2.5 rounded-l-lg">Product</th>
                  <th className="font-semibold px-3 py-2.5">Vendor</th>
                  <th className="font-semibold px-3 py-2.5 text-right">Qty</th>
                  <th className="font-semibold px-3 py-2.5 text-right">Price</th>
                  <th className="font-semibold px-3 py-2.5 text-right rounded-r-lg">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {order.lines.map((l) => (
                  <tr key={l.product}>
                    <td className="px-3 py-2.5 text-on-surface">{l.product}</td>
                    <td className="px-3 py-2.5 text-on-surface-variant">{l.vendor}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{l.quantity}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{formatMoney(l.price)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-on-surface">{formatMoney(l.price * l.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="sm:ml-auto sm:w-64 space-y-1">
            <Row label="Subtotal" value={formatMoney(order.subtotal)} />
            <Row label="Shipping" value={order.shipping ? formatMoney(order.shipping) : 'Free'} />
            <Row label="Total" value={formatMoney(order.total)} strong />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Panel ---------- */

export default function OrderDetailPanel({ order, loading, error, busy, onClose, onStatusChange }: {
  order: AdminOrder | null; loading: boolean; error: string; busy: boolean;
  onClose: () => void; onStatusChange: (status: OrderStatus) => void;
}) {
  const [showFull, setShowFull] = useState(false);

  // Escape closes the panel (the full details popup handles its own Escape first)
  useEffect(() => {
    if (showFull) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, showFull]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
        {order ? (
          <div>
            <p className="flex items-center gap-2 text-[20px] font-bold text-on-surface">{order.id} <StatusBadge status={order.status} /></p>
            <p className="text-[13px] text-on-surface-variant mt-0.5">{formatDateTime(order.placedAt)}</p>
          </div>
        ) : <Skeleton className="h-12 w-48" />}
        <button onClick={onClose} aria-label="Close order details" className="w-9 h-9 -mr-2 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high shrink-0">
          <span className="material-symbols-outlined text-[24px]">close</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-3">
        {error ? (
          <p className="rounded-2xl bg-red-50 border border-red-200 p-4 text-[13px] text-error">{error}</p>
        ) : !order || loading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : (
          <>
            <Section icon="person" title="Customer" href={adminPath(`/customers?q=${encodeURIComponent(order.customer.name)}`)}>
              <p className="text-[14px] font-medium text-on-surface">{order.customer.name}</p>
              <p className="text-[13px] text-on-surface-variant break-all">{order.customer.email}</p>
              <p className="text-[13px] text-on-surface-variant">{order.customer.phone}</p>
            </Section>

            <Section icon="location_on" title="Shipping Address" external href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${order.address.line}, ${order.address.city}, ${order.address.country}`)}`}>
              <p className="text-[13px] text-on-surface-variant">{order.address.line}</p>
              <p className="text-[13px] text-on-surface-variant">{order.address.city}, {order.address.country}</p>
            </Section>

            <Section icon="shopping_cart" title="Order Summary">
              <div className="space-y-1 mt-1">
                <Row label="Items" value={order.items} />
                <Row label="Subtotal" value={formatMoney(order.subtotal)} />
                <Row label="Shipping" value={order.shipping ? formatMoney(order.shipping) : 'Free'} />
                <Row label="Total" value={formatMoney(order.total)} strong />
              </div>
            </Section>

            <Section icon="credit_card" title="Payment Information" aside={<StatusBadge status={order.paymentStatus} />}>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[13px] mt-1">
                <dt className="text-on-surface-variant">Method</dt><dd className="text-on-surface">{order.payment.method}</dd>
                <dt className="text-on-surface-variant">Transaction ID</dt><dd className="text-on-surface break-all">{order.payment.transactionId}</dd>
                <dt className="text-on-surface-variant">Paid on</dt><dd className="text-on-surface">{order.payment.paidAt ? formatDateTime(order.payment.paidAt) : 'Not paid yet'}</dd>
              </dl>
            </Section>

            <Section icon="storefront" title={`Vendors Involved (${order.vendors.length})`}>
              <ul className="divide-y divide-outline-variant/40 -mx-1">
                {order.vendors.map((v) => (
                  <li key={v.name}>
                    <Link href={adminPath(`/vendors?q=${encodeURIComponent(v.name)}`)} className="flex items-center gap-2 px-1 py-2 text-[13px] hover:text-primary">
                      <span className="material-symbols-outlined text-[20px] text-on-surface-variant">local_shipping</span>
                      <span className="flex-1 text-on-surface">{v.name}</span>
                      <span className="text-on-surface-variant">{v.items} {v.items === 1 ? 'item' : 'items'}</span>
                      <span className="material-symbols-outlined text-[20px] text-on-surface-variant">chevron_right</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          </>
        )}
      </div>

      {order && !error && (
        <div className="px-5 py-4 border-t border-outline-variant/50 space-y-2.5 bg-surface pb-safe">
          <StatusMenuButton current={order.status} busy={busy} onPick={onStatusChange} />
          <button onClick={() => setShowFull(true)} className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white text-[14px] font-medium text-on-surface hover:bg-surface-container-low">
            <span className="material-symbols-outlined text-[20px]">description</span> View Full Details
          </button>
          <a href={contactHref(order)} className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white text-[14px] font-medium text-on-surface hover:bg-surface-container-low">
            <span className="material-symbols-outlined text-[20px]">chat</span> Contact Customer
          </a>
        </div>
      )}

      {showFull && order && <FullDetailsModal order={order} onClose={() => setShowFull(false)} />}
    </div>
  );
}
