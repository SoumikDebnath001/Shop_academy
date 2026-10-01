"use client";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ADMIN_BASE_PATH } from '../../../services/adminRoutes';
import { DateRange, formatMoney } from '../../../services/adminDashboard';
import {
  AdminOrder, ORDER_STATUSES, ORDER_TYPES, ORDER_VENDORS, OrderListResult, OrderQuery, OrderSortKey, OrderStatus, OrderType,
  PAYMENT_STATUSES, PaymentStatus, exportOrders, getOrder, listOrders, updateOrdersStatus,
} from '../../../services/adminOrders';
import { useToast } from '../../../components/ToastProvider';
import { currencyCode, moneyForCsv, useCurrencySettings } from '../../../services/currency';
import { DATE_PRESETS, DateRangePicker, GlobalSearch, NotificationBell, ProfileMenu, defaultRange } from '../_dashboard/DashboardHeader';
import { Skeleton, StatusBadge, useDismiss } from '../_dashboard/ui';
import { FilterSelect, Pagination, SidePanel, SortHeader, downloadCsv } from '../_dashboard/table';
import OrderDetailPanel, { StatusMenuButton, contactHref } from './_components/OrderDetailPanel';

type StatusFilter = OrderStatus | 'All';

const PER_PAGE_OPTIONS = [10, 25, 50];

const SUMMARY_CARDS: { key: StatusFilter; label: string; icon: string; color: string }[] = [
  { key: 'All', label: 'Total Orders', icon: 'shopping_cart', color: 'text-on-surface' },
  { key: 'New', label: 'New', icon: 'fiber_manual_record', color: 'text-blue-600' },
  { key: 'Processing', label: 'Processing', icon: 'pending', color: 'text-amber-500' },
  { key: 'Shipped', label: 'Shipped', icon: 'local_shipping', color: 'text-violet-600' },
  { key: 'Delivered', label: 'Delivered', icon: 'check_circle', color: 'text-green-600' },
  { key: 'Cancelled', label: 'Cancelled', icon: 'cancel', color: 'text-gray-400' },
];

// Links from other admin pages, e.g. /orders?status=pending-dispatch or /orders?q=%23OB10234
const STATUS_ALIASES: Record<string, OrderStatus> = { 'awaiting-vendor': 'New', 'pending-dispatch': 'Processing' };

const readUrl = () => {
  // The admin layout only renders pages in the browser (after the session check), so window is available here
  const params = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);
  const status = params.get('status') ?? '';
  return {
    search: params.get('q') ?? '',
    status: (STATUS_ALIASES[status] ?? (ORDER_STATUSES as readonly string[]).find((s) => s.toLowerCase() === status.toLowerCase()) ?? 'All') as StatusFilter,
  };
};

const formatDay = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/* ---------- Small pieces ---------- */

/* "..." menu on each row */
function RowMenu({ order, onView, onStatus }: { order: AdminOrder; onView: () => void; onStatus: (s: OrderStatus) => void }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss<HTMLDivElement>(open, close);

  return (
    <div ref={ref} className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <button onClick={() => setOpen((o) => !o)} aria-label={`Actions for order ${order.id}`} aria-expanded={open} className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface hover:bg-surface-container-high">
        <span className="material-symbols-outlined text-[22px]">more_horiz</span>
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-56 bg-white rounded-2xl border border-outline-variant/50 shadow-xl py-2 text-left">
          <button onClick={() => { close(); onView(); }} className="w-full flex items-center gap-3 px-4 h-10 text-[14px] text-on-surface hover:bg-surface-container-low">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">visibility</span> View details
          </button>
          <a href={contactHref(order)} onClick={close} className="w-full flex items-center gap-3 px-4 h-10 text-[14px] text-on-surface hover:bg-surface-container-low">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">mail</span> Contact customer
          </a>
          <p className="px-4 pt-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-on-surface-variant border-t border-outline-variant/40 mt-1">Mark as</p>
          {ORDER_STATUSES.filter((s) => s !== order.status).map((s) => (
            <button key={s} onClick={() => { close(); onStatus(s); }} className="w-full flex items-center px-4 h-9 hover:bg-surface-container-low">
              <StatusBadge status={s} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Page ---------- */

export default function AdminOrders() {
  const { triggerToast } = useToast();
  useCurrencySettings(); // re-render when Settings > Currency changes
  const [initial] = useState(readUrl);

  const [range, setRange] = useState<DateRange>(defaultRange);
  const [searchInput, setSearchInput] = useState(initial.search);
  const [search, setSearch] = useState(initial.search);
  const [status, setStatus] = useState<StatusFilter>(initial.status);
  const [payment, setPayment] = useState<PaymentStatus | 'All'>('All');
  const [vendor, setVendor] = useState<string | 'All'>('All');
  const [type, setType] = useState<OrderType | 'All'>('All');
  const [sort, setSort] = useState<OrderQuery['sort']>({ key: 'placedAt', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [reloadKey, setReloadKey] = useState(0);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Waits until typing pauses before searching, and goes back to page 1
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const query: OrderQuery = useMemo(() => ({ range, search, status, payment, vendor, type, sort, page, perPage }), [range, search, status, payment, vendor, type, sort, page, perPage]);
  const queryKey = JSON.stringify(query) + reloadKey;

  /* List: the result remembers which query it belongs to, so "loading" is simply "result is for an older query" */
  const [result, setResult] = useState<{ key: string; data: OrderListResult } | null>(null);
  const [listError, setListError] = useState<{ key: string; message: string } | null>(null);
  useEffect(() => {
    let cancelled = false;
    listOrders(query)
      .then((data) => { if (!cancelled) setResult({ key: queryKey, data }); })
      .catch((e) => { if (!cancelled) setListError({ key: queryKey, message: e?.message || 'Could not load orders' }); });
    return () => { cancelled = true; };
  }, [query, queryKey]);
  const loading = result?.key !== queryKey && listError?.key !== queryKey;
  const error = listError?.key === queryKey ? listError.message : '';
  const data = result?.data;

  /* Detail panel */
  const [detail, setDetail] = useState<{ key: string; order: AdminOrder | null; error: string } | null>(null);
  const detailKey = `${activeId}:${reloadKey}`;
  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    getOrder(activeId)
      .then((order) => { if (!cancelled) setDetail({ key: detailKey, order, error: '' }); })
      .catch((e) => { if (!cancelled) setDetail({ key: detailKey, order: null, error: e?.message || 'Could not load this order' }); });
    return () => { cancelled = true; };
  }, [activeId, detailKey]);
  const detailLoading = detail?.key !== detailKey;
  // Keep showing the previous order's details while its refreshed copy loads
  const shownOrder = detail && detail.key.startsWith(`${activeId}:`) ? detail.order : null;

  /* Filters: every change goes back to page 1 */
  const withPageReset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1); };
  const onStatus = withPageReset(setStatus);
  const onPayment = withPageReset(setPayment);
  const onVendor = withPageReset(setVendor);
  const onType = withPageReset(setType);
  const onRange = withPageReset(setRange);
  const onPerPage = withPageReset(setPerPage);

  const resetFilters = () => {
    setSearchInput(''); setSearch(''); setStatus('All'); setPayment('All'); setVendor('All'); setType('All');
    setRange(defaultRange()); setSort({ key: 'placedAt', dir: 'desc' }); setPage(1); setSelected(new Set());
  };
  const filtersActive = search || status !== 'All' || payment !== 'All' || vendor !== 'All' || type !== 'All';

  const onSort = (key: OrderSortKey) => {
    setSort((s) => (s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }));
    setPage(1);
  };

  /* Status changes (one order, or every selected one) */
  const changeStatus = async (ids: string[], next: OrderStatus) => {
    setBusy(true);
    try {
      await updateOrdersStatus(ids, next);
      triggerToast(ids.length === 1 ? `Order ${ids[0]} marked as ${next}` : `${ids.length} orders marked as ${next}`);
      setReloadKey((k) => k + 1);
    } catch {
      triggerToast('Could not update the order status');
    } finally {
      setBusy(false);
    }
  };

  /* Export: the selected orders, or every order matching the filters */
  const exportCsv = async () => {
    const ids = [...selected];
    const rows = await exportOrders({ range, search, status, payment, vendor, type, sort }, ids);
    const cur = currencyCode();
    const header = ['Order ID', 'Date', 'Customer', 'Email', 'Phone', 'Items', `Subtotal (${cur})`, `Shipping (${cur})`, `Total (${cur})`, 'Payment Status', 'Payment Method', 'Order Status', 'Type', 'Vendors', 'Shipping Address'];
    const lines = rows.map((o) => [
      o.id, new Date(o.placedAt).toLocaleString('en-GB'), o.customer.name, o.customer.email, o.customer.phone, o.items, moneyForCsv(o.subtotal), moneyForCsv(o.shipping), moneyForCsv(o.total),
      o.paymentStatus, o.payment.method, o.status, o.type, o.vendors.map((v) => v.name).join('; '), `${o.address.line}, ${o.address.city}, ${o.address.country}`,
    ]);
    downloadCsv(ids.length ? `orders-selected-${ids.length}.csv` : `orders-${range.from}-to-${range.to}.csv`, [header, ...lines]);
    triggerToast(`Exported ${rows.length} order${rows.length === 1 ? '' : 's'}`);
  };

  /* Selection */
  const pageIds = data?.rows.map((o) => o.id) ?? [];
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someOnPage = pageIds.some((id) => selected.has(id));
  const togglePage = () => setSelected((s) => {
    const next = new Set(s);
    pageIds.forEach((id) => (allOnPage ? next.delete(id) : next.add(id)));
    return next;
  });
  const toggleOne = (id: string) => setSelected((s) => {
    const next = new Set(s);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const presetLabel = DATE_PRESETS.find((p) => { const r = p.make(); return r.from === range.from && r.to === range.to; })?.label;
  const counts = data?.statusCounts;
  const columns = 11;

  return (
    <div className="flex w-full min-h-screen">
      <div className="flex-1 min-w-0">
        <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8 flex flex-col gap-5">
          {/* Top bar */}
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1 md:max-w-xl"><GlobalSearch /></div>
            <div className="flex items-center gap-2 md:ml-auto">
              <div className="flex-1 md:flex-none"><DateRangePicker value={range} onChange={onRange} /></div>
              <NotificationBell />
              <ProfileMenu />
            </div>
          </div>

          {/* Title */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[13px] text-on-surface-variant">
                <Link href={ADMIN_BASE_PATH} className="hover:text-primary hover:underline">Admin Panel</Link>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                <span className="text-on-surface">Orders</span>
              </nav>
              <h1 className="text-[30px] sm:text-[34px] font-bold text-on-surface leading-tight mt-1">Orders</h1>
           </div>
            <button onClick={exportCsv} className="h-11 px-5 flex items-center justify-center gap-2 rounded-xl bg-brand-red text-white text-[14px] font-medium hover:bg-[#b8231d] transition-colors shrink-0">
              <span className="material-symbols-outlined text-[20px]">download</span>
              {selected.size ? `Export ${selected.size} Selected` : 'Export Orders'}
            </button>
          </div>

          {/* Summary cards, clicking one filters the table */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
            {SUMMARY_CARDS.map((c) => (
              <button
                key={c.key}
                onClick={() => onStatus(c.key)}
                aria-pressed={status === c.key}
                className={`bg-white rounded-2xl border p-4 flex items-center gap-3 text-left transition-all hover:shadow-md ${status === c.key ? 'border-primary ring-1 ring-primary' : 'border-outline-variant/50'}`}
              >
                <span className={`material-symbols-outlined text-[30px] ${c.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{c.icon}</span>
                <span className="flex flex-col">
                  <span className="text-[22px] font-bold text-on-surface leading-none tabular-nums">{counts ? counts[c.key].toLocaleString('en-US') : '–'}</span>
                  <span className="text-[13px] text-on-surface-variant mt-1">{c.label}</span>
                </span>
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5 p-3 bg-white rounded-2xl border border-outline-variant/50">
            <div className="relative flex-1 min-w-[200px] basis-full sm:basis-auto">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant pointer-events-none">search</span>
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search orders..."
                aria-label="Search orders by ID, customer, vendor or product"
                className="h-11 w-full pl-10 pr-3 rounded-xl border border-outline-variant/70 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </div>
            <FilterSelect label="Order Status" value={status} options={ORDER_STATUSES} onChange={onStatus} />
            <FilterSelect label="Payment Status" value={payment} options={PAYMENT_STATUSES} onChange={onPayment} />
            <FilterSelect label="Vendor" value={vendor} options={ORDER_VENDORS} onChange={onVendor} />
            <FilterSelect label="Order Type" value={type} options={ORDER_TYPES} onChange={onType} />
            <select
              aria-label="Date range"
              value={presetLabel ?? 'custom'}
              onChange={(e) => { const p = DATE_PRESETS.find((x) => x.label === e.target.value); if (p) onRange(p.make()); }}
              className="h-11 pl-3.5 pr-9 rounded-xl border border-outline-variant/70 bg-white text-[14px] text-on-surface"
            >
              {DATE_PRESETS.map((p) => <option key={p.label} value={p.label}>{p.label}</option>)}
              {!presetLabel && <option value="custom">Custom range</option>}
            </select>
            <button onClick={resetFilters} disabled={!filtersActive && presetLabel === 'This month'} className="h-11 px-4 rounded-xl border border-outline-variant/70 text-[14px] font-medium text-primary hover:bg-primary/5 disabled:text-on-surface-variant/50 disabled:hover:bg-transparent">
              Reset
            </button>
          </div>

          {/* Status tabs */}
          <div role="tablist" aria-label="Order status" className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
            {(['All', ...ORDER_STATUSES] as StatusFilter[]).map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={status === s}
                onClick={() => onStatus(s)}
                className={`relative h-10 px-4 rounded-lg text-[14px] whitespace-nowrap transition-colors ${status === s ? 'text-brand-red font-semibold' : 'bg-white border border-outline-variant/50 text-on-surface hover:bg-surface-container-low'}`}
              >
                {s} ({counts ? counts[s].toLocaleString('en-US') : '…'})
                {status === s && <span className="absolute left-2 right-2 -bottom-1 h-0.5 rounded-full bg-brand-red" />}
              </button>
            ))}
          </div>

          {/* Bulk actions for selected orders */}
          {selected.size > 0 && (
            <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl bg-brand-green-dark text-white">
              <span className="text-[14px] font-medium">{selected.size} selected</span>
              <div className="w-56"><StatusMenuButton variant="outline" busy={busy} onPick={(s) => changeStatus([...selected], s).then(() => setSelected(new Set()))} /></div>
              <button onClick={exportCsv} className="h-11 px-4 rounded-xl border border-white/30 text-[14px] hover:bg-white/10">Export selected</button>
              <button onClick={() => setSelected(new Set())} className="h-11 px-4 rounded-xl text-[14px] text-white/80 hover:text-white ml-auto">Clear selection</button>
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-2xl border border-outline-variant/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-[13px]">
                <thead>
                  <tr className="border-b border-outline-variant/50 text-on-surface-variant">
                    <th className="pl-4 pr-2 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allOnPage}
                        ref={(el) => { if (el) el.indeterminate = someOnPage && !allOnPage; }}
                        onChange={togglePage}
                        aria-label="Select all orders on this page"
                        className="w-4 h-4 accent-[var(--color-primary)]"
                      />
                    </th>
                    <th className="font-semibold px-3 py-3">Order ID</th>
                    <SortHeader label="Date" sortKey="placedAt" sort={sort} onSort={onSort} />
                    <th className="font-semibold px-3 py-3">Customer</th>
                    <SortHeader label="Items" sortKey="items" sort={sort} onSort={onSort} />
                    <SortHeader label="Amount" sortKey="total" sort={sort} onSort={onSort} />
                    <th className="font-semibold px-3 py-3 whitespace-nowrap">Payment Status</th>
                    <th className="font-semibold px-3 py-3 whitespace-nowrap">Order Status</th>
                    <th className="font-semibold px-3 py-3">Vendors</th>
                    <th className="font-semibold px-3 py-3">Type</th>
                    <th className="font-semibold px-3 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className={`divide-y divide-outline-variant/40 transition-opacity ${loading && data ? 'opacity-50' : ''}`}>
                  {error ? (
                    <tr><td colSpan={columns} className="px-4 py-12 text-center text-error">
                      {error} <button onClick={() => setReloadKey((k) => k + 1)} className="ml-2 underline">Try again</button>
                    </td></tr>
                  ) : !data ? (
                    Array.from({ length: perPage > 10 ? 10 : perPage }).map((_, i) => (
                      <tr key={i}><td colSpan={columns} className="px-4 py-2"><Skeleton className="h-9" /></td></tr>
                    ))
                  ) : data.rows.length === 0 ? (
                    <tr><td colSpan={columns} className="px-4 py-16 text-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-[36px] block mb-2">receipt_long</span>
                      No orders match these filters.
                      {filtersActive && <button onClick={resetFilters} className="ml-1 text-primary font-medium hover:underline">Reset filters</button>}
                    </td></tr>
                  ) : data.rows.map((o) => (
                    <tr
                      key={o.id}
                      onClick={() => setActiveId(o.id)}
                      className={`cursor-pointer transition-colors ${activeId === o.id ? 'bg-primary/5' : selected.has(o.id) ? 'bg-surface-container-low/70' : 'hover:bg-surface-container-low/60'}`}
                    >
                      <td className="pl-4 pr-2 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selected.has(o.id)} onChange={() => toggleOne(o.id)} aria-label={`Select order ${o.id}`} className="w-4 h-4 accent-[var(--color-primary)]" />
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <button onClick={(e) => { e.stopPropagation(); setActiveId(o.id); }} className="font-semibold text-blue-800 underline underline-offset-2 hover:text-primary">{o.id}</button>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{formatDay(o.placedAt)}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-on-surface">{o.customer.name}</td>
                      <td className="px-3 py-2.5 tabular-nums">{o.items}</td>
                      <td className="px-3 py-2.5 tabular-nums whitespace-nowrap">{formatMoney(o.total)}</td>
                      <td className="px-3 py-2.5"><StatusBadge status={o.paymentStatus} /></td>
                      <td className="px-3 py-2.5"><StatusBadge status={o.status} /></td>
                      <td className="px-3 py-2.5 tabular-nums">{o.vendors.length}</td>
                      <td className="px-3 py-2.5"><StatusBadge status={o.type} /></td>
                      <td className="px-3 py-1.5 text-center">
                        <RowMenu order={o} onView={() => setActiveId(o.id)} onStatus={(s) => changeStatus([o.id], s)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {data && <Pagination page={page} perPage={perPage} total={data.total} noun="orders" perPageOptions={PER_PAGE_OPTIONS} onPage={setPage} onPerPage={onPerPage} />}
        </div>
      </div>

      {/* Order details: a column beside the table on very wide screens, a slide-over panel below that */}
      {activeId && (
        <SidePanel label="Order details" onClose={() => setActiveId(null)}>
          <OrderDetailPanel
            order={shownOrder}
            loading={detailLoading && !shownOrder}
            error={detail?.key === detailKey ? detail.error : ''}
            busy={busy}
            onClose={() => setActiveId(null)}
            onStatusChange={(s) => changeStatus([activeId], s)}
          />
        </SidePanel>
      )}
    </div>
  );
}
