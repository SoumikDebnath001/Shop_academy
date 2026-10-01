"use client";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ADMIN_BASE_PATH } from '../../../services/adminRoutes';
import {
  SUPPORT_VENDORS, TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES, Ticket, TicketAttachment, TicketCategory, TicketListResult,
  TicketPriority, TicketQuery, TicketSortKey, TicketStatus, TicketSummary, TicketTab,
  assignTicket, createTicket, getTicket, getTicketSummary, listTickets, replyToTicket, setTicketPriority, setTicketStatus,
} from '../../../services/adminSupport';
import { useToast } from '../../../components/ToastProvider';
import { GlobalSearch, NotificationBell, ProfileMenu } from '../_dashboard/DashboardHeader';
import { Skeleton, StatusBadge, useDismiss } from '../_dashboard/ui';
import { FilterSelect, Pagination, SidePanel, SortHeader } from '../_dashboard/table';
import TicketDetailPanel, { NewTicketDialog, formatDay } from './_components/TicketDetailPanel';

const readUrl = () => {
  // The admin layout only renders pages in the browser (after the session check), so window is available here
  const params = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);
  return { search: params.get('q') ?? '' };
};

const TABS: { key: TicketTab; label: string }[] = [
  { key: 'All', label: 'All Tickets' }, { key: 'Open', label: 'Open' }, { key: 'In Progress', label: 'In Progress' },
  { key: 'Resolved', label: 'Resolved' }, { key: 'Closed', label: 'Closed' },
];
const VENDOR_NAMES = SUPPORT_VENDORS.map((v) => v.name);

function RowMenu({ ticket, onView, onStatus, onAssign }: {
  ticket: Ticket; onView: () => void; onStatus: (s: TicketStatus) => void; onAssign: (who: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss<HTMLDivElement>(open, close);
  const item = 'w-full flex items-center gap-3 px-4 h-10 text-[14px] text-on-surface hover:bg-surface-container-low';
  const done = ticket.status === 'Resolved' || ticket.status === 'Closed';

  return (
    <div ref={ref} className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <button onClick={() => setOpen((o) => !o)} aria-label={`Actions for ${ticket.id}`} aria-expanded={open} className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface hover:bg-surface-container-high">
        <span className="material-symbols-outlined text-[22px]">more_horiz</span>
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-56 bg-white rounded-2xl border border-outline-variant/50 shadow-xl py-2 text-left">
          <button onClick={() => { close(); onView(); }} className={item}><span className="material-symbols-outlined text-[20px] text-on-surface-variant">visibility</span> View &amp; reply</button>
          {!ticket.assignedTo && <button onClick={() => { close(); onAssign('Admin'); }} className={item}><span className="material-symbols-outlined text-[20px] text-on-surface-variant">person_add</span> Assign to me</button>}
          {ticket.status === 'Open' && <button onClick={() => { close(); onStatus('In Progress'); }} className={item}><span className="material-symbols-outlined text-[20px] text-amber-600">pending</span> Mark In Progress</button>}
          {!done && <button onClick={() => { close(); onStatus('Resolved'); }} className={item}><span className="material-symbols-outlined text-[20px] text-green-700">check_circle</span> Mark Resolved</button>}
          {ticket.status !== 'Closed' && <button onClick={() => { close(); onStatus('Closed'); }} className={item}><span className="material-symbols-outlined text-[20px] text-on-surface-variant">cancel</span> Close ticket</button>}
          {done && <button onClick={() => { close(); onStatus('Open'); }} className={item}><span className="material-symbols-outlined text-[20px] text-on-surface-variant">undo</span> Reopen</button>}
          <a href={`mailto:${ticket.vendor.email}?subject=${encodeURIComponent(`${ticket.id}: ${ticket.subject}`)}`} onClick={close} className={`${item} border-t border-outline-variant/40 mt-1`}><span className="material-symbols-outlined text-[20px] text-on-surface-variant">mail</span> Email vendor</a>
        </div>
      )}
    </div>
  );
}

export default function AdminVendorSupport() {
  const { triggerToast } = useToast();
  const [initial] = useState(readUrl);

  const [tab, setTab] = useState<TicketTab>('All');
  const [searchInput, setSearchInput] = useState(initial.search);
  const [search, setSearch] = useState(initial.search);
  const [category, setCategory] = useState<TicketCategory | 'All'>('All');
  const [vendor, setVendor] = useState<string | 'All'>('All');
  const [status, setStatus] = useState<TicketStatus | 'All'>('All');
  const [priority, setPriority] = useState<TicketPriority | 'All'>('All');
  const [sort, setSort] = useState<TicketQuery['sort']>({ key: 'createdAt', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [reloadKey, setReloadKey] = useState(0);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const query: TicketQuery = useMemo(() => ({ tab, search, category, vendor, status, priority, sort, page, perPage }), [tab, search, category, vendor, status, priority, sort, page, perPage]);
  const queryKey = JSON.stringify(query) + reloadKey;

  const [result, setResult] = useState<{ key: string; data: TicketListResult } | null>(null);
  const [listError, setListError] = useState<{ key: string; message: string } | null>(null);
  useEffect(() => {
    let cancelled = false;
    listTickets(query)
      .then((data) => { if (!cancelled) setResult({ key: queryKey, data }); })
      .catch((e) => { if (!cancelled) setListError({ key: queryKey, message: e?.message || 'Could not load tickets' }); });
    return () => { cancelled = true; };
  }, [query, queryKey]);
  const loading = result?.key !== queryKey && listError?.key !== queryKey;
  const error = listError?.key === queryKey ? listError.message : '';
  const data = result?.data;

  const [summary, setSummary] = useState<TicketSummary | null>(null);
  useEffect(() => {
    let cancelled = false;
    getTicketSummary().then((s) => { if (!cancelled) setSummary(s); }).catch(() => {});
    return () => { cancelled = true; };
  }, [reloadKey]);

  const [detail, setDetail] = useState<{ key: string; ticket: Ticket | null; error: string } | null>(null);
  const detailKey = `${activeId}:${reloadKey}`;
  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    getTicket(activeId)
      .then((ticket) => { if (!cancelled) setDetail({ key: detailKey, ticket, error: '' }); })
      .catch((e) => { if (!cancelled) setDetail({ key: detailKey, ticket: null, error: e?.message || 'Could not load this ticket' }); });
    return () => { cancelled = true; };
  }, [activeId, detailKey]);
  const shownTicket = detail && detail.key.startsWith(`${activeId}:`) ? detail.ticket : null;

  const withPageReset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1); };
  const onTab = withPageReset(setTab);
  const onCategory = withPageReset(setCategory);
  const onVendor = withPageReset(setVendor);
  const onStatusFilter = withPageReset(setStatus);
  const onPriority = withPageReset(setPriority);
  const onPerPage = withPageReset(setPerPage);
  const filtersActive = search || category !== 'All' || vendor !== 'All' || status !== 'All' || priority !== 'All';
  const resetFilters = () => {
    setSearchInput(''); setSearch(''); setCategory('All'); setVendor('All'); setStatus('All'); setPriority('All');
    setSort({ key: 'createdAt', dir: 'desc' }); setPage(1); setSelected(new Set());
  };
  const onSort = (key: TicketSortKey) => {
    setSort((s) => (s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }));
    setPage(1);
  };
  const refresh = () => setReloadKey((k) => k + 1);

  const run = async (action: () => Promise<unknown>, message: string) => {
    setBusy(true);
    try {
      await action();
      triggerToast(message);
      refresh();
      return true;
    } catch (e) {
      triggerToast(e instanceof Error ? e.message : 'Something went wrong, please try again');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = (ids: string[], to: TicketStatus) =>
    run(() => setTicketStatus(ids, to), `${ids.length === 1 ? ids[0] : `${ids.length} tickets`} marked as ${to}`).then(() => setSelected(new Set()));
  const assign = (ids: string[], who: string | null) =>
    run(() => assignTicket(ids, who), who ? `${ids.length === 1 ? ids[0] : `${ids.length} tickets`} assigned to you` : `${ids[0]} unassigned`).then(() => setSelected(new Set()));

  /* Selection */
  const pageIds = data?.rows.map((t) => t.id) ?? [];
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

  const counts = data?.tabCounts;
  const columns = 10;
  const cards: { key: TicketTab; label: string; icon: string; tint: string; value?: number; change?: number }[] = [
    { key: 'All', label: 'Total Tickets', icon: 'chat', tint: 'bg-blue-50 text-blue-700', value: summary?.total, change: summary?.totalChangePercent },
    { key: 'Open', label: 'Open', icon: 'schedule', tint: 'bg-red-50 text-brand-red', value: summary?.Open },
    { key: 'In Progress', label: 'In Progress', icon: 'hourglass_top', tint: 'bg-amber-50 text-amber-500', value: summary?.['In Progress'] },
    { key: 'Resolved', label: 'Resolved', icon: 'check_circle', tint: 'bg-green-50 text-green-600', value: summary?.Resolved },
    { key: 'Closed', label: 'Closed', icon: 'cancel', tint: 'bg-slate-100 text-slate-600', value: summary?.Closed },
  ];

  return (
    <div className="flex w-full min-h-screen">
      <div className="flex-1 min-w-0">
        <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8 flex flex-col gap-5">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1 md:max-w-xl"><GlobalSearch /></div>
            <div className="flex items-center gap-2 md:ml-auto"><NotificationBell /><ProfileMenu /></div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[13px] text-on-surface-variant">
                <Link href={ADMIN_BASE_PATH} className="hover:text-primary hover:underline">Admin Panel</Link>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                <span className="text-on-surface">Vendor Support</span>
              </nav>
              <h1 className="text-[30px] sm:text-[34px] font-bold text-on-surface leading-tight mt-1">Vendor Support</h1>
              <p className="text-[14px] text-on-surface-variant">Manage and resolve support queries from vendors.</p>
            </div>
            <button onClick={() => setCreating(true)} className="h-11 px-5 flex items-center justify-center gap-2 rounded-xl bg-brand-red text-white text-[14px] font-medium hover:bg-[#b8231d] shrink-0">
              <span className="material-symbols-outlined text-[20px]">add</span> New Ticket
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
            {cards.map((c) => (
              <button key={c.key} onClick={() => onTab(c.key)} aria-pressed={tab === c.key} className={`bg-white rounded-2xl border p-4 flex items-center gap-3 text-left transition-all hover:shadow-md ${tab === c.key ? 'border-primary ring-1 ring-primary' : 'border-outline-variant/50'}`}>
                <span className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${c.tint}`}>
                  <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>{c.icon}</span>
                </span>
                <span className="flex flex-col min-w-0">
                  <span className="text-[22px] font-bold text-on-surface leading-none tabular-nums">{c.value ?? '–'}</span>
                  <span className="text-[13px] text-on-surface-variant mt-1">{c.label}</span>
                  {c.change !== undefined && (
                    <span className="flex items-center gap-0.5 text-[12px] font-semibold text-green-700 mt-0.5">
                      <span className="material-symbols-outlined text-[16px]">arrow_upward</span>{c.change}%<span className="sr-only"> increase</span>
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-outline-variant/50 p-4 flex flex-col gap-4">
            <div role="tablist" aria-label="Ticket status" className="flex gap-1 overflow-x-auto border-b border-outline-variant/50">
              {TABS.map((t) => (
                <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => onTab(t.key)} className={`relative h-11 px-4 text-[14px] whitespace-nowrap ${tab === t.key ? 'text-brand-red font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`}>
                  {t.label} ({counts ? counts[t.key] : '…'})
                  {tab === t.key && <span className="absolute left-2 right-2 -bottom-px h-0.5 rounded-full bg-brand-red" />}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative flex-1 min-w-[200px] basis-full sm:basis-auto">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant pointer-events-none">search</span>
                <input type="search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search tickets..." aria-label="Search tickets by ID, subject, vendor or category"
                  className="h-11 w-full pl-10 pr-3 rounded-xl border border-outline-variant/70 bg-white text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
              </div>
              <FilterSelect label="Category" value={category} options={TICKET_CATEGORIES} onChange={onCategory} />
              <FilterSelect label="Vendor" value={vendor} options={VENDOR_NAMES} onChange={onVendor} />
              <FilterSelect label="Status" value={status} options={TICKET_STATUSES} onChange={onStatusFilter} />
              <FilterSelect label="Priority" value={priority} options={TICKET_PRIORITIES} onChange={onPriority} />
              <button onClick={resetFilters} disabled={!filtersActive} className="h-11 px-4 rounded-xl border border-outline-variant/70 bg-white text-[14px] font-medium text-primary hover:bg-primary/5 disabled:text-on-surface-variant/50 disabled:hover:bg-white">Reset</button>
            </div>

            {selected.size > 0 && (
              <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl bg-brand-green-dark text-white">
                <span className="text-[14px] font-medium">{selected.size} selected</span>
                <button disabled={busy} onClick={() => assign([...selected], 'Admin')} className="h-10 px-4 rounded-xl border border-white/30 text-[14px] hover:bg-white/10 disabled:opacity-50">Assign to me</button>
                <button disabled={busy} onClick={() => changeStatus([...selected], 'In Progress')} className="h-10 px-4 rounded-xl border border-white/30 text-[14px] hover:bg-white/10 disabled:opacity-50">Mark In Progress</button>
                <button disabled={busy} onClick={() => changeStatus([...selected], 'Resolved')} className="h-10 px-4 rounded-xl bg-green-600 text-[14px] font-medium hover:bg-green-700 disabled:opacity-50">Mark Resolved</button>
                <button disabled={busy} onClick={() => changeStatus([...selected], 'Closed')} className="h-10 px-4 rounded-xl border border-white/30 text-[14px] hover:bg-white/10 disabled:opacity-50">Close</button>
                <button onClick={() => setSelected(new Set())} className="h-10 px-4 rounded-xl text-[14px] text-white/80 hover:text-white ml-auto">Clear selection</button>
              </div>
            )}

            <div className="overflow-x-auto -mx-4">
              <table className="w-full min-w-[980px] text-left text-[13px]">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant">
                    <th className="pl-4 pr-2 py-3 w-10">
                      <input type="checkbox" checked={allOnPage} ref={(el) => { if (el) el.indeterminate = someOnPage && !allOnPage; }} onChange={togglePage} aria-label="Select all tickets on this page" className="w-4 h-4 accent-[var(--color-primary)]" />
                    </th>
                    <th className="font-semibold px-3 py-3">Ticket ID</th>
                    <th className="font-semibold px-3 py-3">Subject</th>
                    <th className="font-semibold px-3 py-3">Vendor</th>
                    <th className="font-semibold px-3 py-3">Category</th>
                    <SortHeader label="Priority" sortKey="priority" sort={sort} onSort={onSort} />
                    <th className="font-semibold px-3 py-3">Status</th>
                    <SortHeader label="Created On" sortKey="createdAt" sort={sort} onSort={onSort} />
                    <SortHeader label="Updated On" sortKey="updatedAt" sort={sort} onSort={onSort} />
                    <th className="font-semibold px-3 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y divide-outline-variant/40 transition-opacity ${loading && data ? 'opacity-50' : ''}`}>
                  {error ? (
                    <tr><td colSpan={columns} className="px-4 py-12 text-center text-error">{error} <button onClick={refresh} className="ml-2 underline">Try again</button></td></tr>
                  ) : !data ? (
                    Array.from({ length: 10 }).map((_, i) => <tr key={i}><td colSpan={columns} className="px-4 py-2"><Skeleton className="h-10" /></td></tr>)
                  ) : data.rows.length === 0 ? (
                    <tr><td colSpan={columns} className="px-4 py-16 text-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-[36px] block mb-2">support_agent</span>
                      {filtersActive ? 'No tickets match these filters.' : 'No tickets here. Nice work!'}
                      {filtersActive && <button onClick={resetFilters} className="ml-1 text-primary font-medium hover:underline">Reset filters</button>}
                    </td></tr>
                  ) : data.rows.map((t) => (
                    <tr key={t.id} onClick={() => setActiveId(t.id)} className={`cursor-pointer transition-colors ${activeId === t.id ? 'bg-primary/5' : selected.has(t.id) ? 'bg-surface-container-low/70' : 'hover:bg-surface-container-low/60'}`}>
                      <td className="pl-4 pr-2 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggleOne(t.id)} aria-label={`Select ${t.id}`} className="w-4 h-4 accent-[var(--color-primary)]" />
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap"><button onClick={(e) => { e.stopPropagation(); setActiveId(t.id); }} className="font-semibold text-blue-800 underline underline-offset-2 hover:text-primary">{t.id}</button></td>
                      <td className="px-3 py-2.5 text-on-surface max-w-[220px]">{t.subject}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{t.vendor.name}</td>
                      <td className="px-3 py-2.5">{t.category}</td>
                      <td className="px-3 py-2.5"><StatusBadge status={t.priority} /></td>
                      <td className="px-3 py-2.5"><StatusBadge status={t.status} /></td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{formatDay(t.createdAt)}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{formatDay(t.updatedAt)}</td>
                      <td className="px-3 py-1.5 text-center">
                        <RowMenu ticket={t} onView={() => setActiveId(t.id)} onStatus={(s) => changeStatus([t.id], s)} onAssign={(who) => assign([t.id], who)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {data && <Pagination page={page} perPage={perPage} total={data.total} noun="tickets" onPage={setPage} onPerPage={onPerPage} />}
        </div>
      </div>

      {activeId && (
        <SidePanel label="Ticket details" onClose={() => setActiveId(null)}>
          <TicketDetailPanel
            key={activeId}
            ticket={shownTicket}
            loading={detail?.key !== detailKey && !shownTicket}
            error={detail?.key === detailKey ? detail.error : ''}
            busy={busy}
            onClose={() => setActiveId(null)}
            onStatus={(s) => changeStatus([activeId], s)}
            onPriority={(p) => run(() => setTicketPriority(activeId, p), `${activeId} priority set to ${p}`)}
            onAssign={(who) => assign([activeId], who)}
            onReply={(text: string, files: TicketAttachment[]) => run(() => replyToTicket(activeId, text, files), `Reply sent to ${shownTicket?.vendor.name ?? 'the vendor'}`)}
          />
        </SidePanel>
      )}

      {creating && (
        <NewTicketDialog
          busy={busy}
          onCancel={() => setCreating(false)}
          onSave={async (input) => {
            let id = '';
            const ok = await run(async () => { id = (await createTicket(input)).id; }, `Ticket created for ${input.vendor}`);
            if (ok) { setCreating(false); setActiveId(id); }
          }}
        />
      )}
    </div>
  );
}
