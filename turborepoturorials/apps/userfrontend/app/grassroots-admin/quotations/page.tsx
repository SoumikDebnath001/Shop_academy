"use client";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ADMIN_BASE_PATH } from '../../../services/adminRoutes';
import { formatMoney, useCurrencySettings } from '../../../services/currency';
import {
  ORG_TYPES, OrgType, QUOTE_DATE_FILTERS, QUOTE_STATUSES, QuoteDateFilter, QuoteListResult, QuoteQuery, QuoteSortKey, QuoteStatus,
  QuoteSummary, QuoteTab, Quotation, addQuoteNote, createQuotation, getQuotation, getQuoteSummary, listQuotations, sendQuotation,
  setQuoteStatus, updateOrganization,
} from '../../../services/adminQuotations';
import { useToast } from '../../../components/ToastProvider';
import { GlobalSearch, NotificationBell, ProfileMenu } from '../_dashboard/DashboardHeader';
import { PromptDialog, Skeleton, StatusBadge, useDismiss } from '../_dashboard/ui';
import { FilterSelect, Pagination, SidePanel, SortHeader } from '../_dashboard/table';
import QuotationDetailPanel, { EditOrgDialog, NewQuotationDialog, OrgLogo, SendQuotationDialog, formatDay } from './_components/QuotationDetailPanel';

const readUrl = () => {
  // The admin layout only renders pages in the browser (after the session check), so window is available here
  const params = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);
  return { search: params.get('q') ?? '' };
};

const TABS: QuoteTab[] = ['All', ...QUOTE_STATUSES];

function RowMenu({ quote, onView, onSend, onStatus, onDecline }: {
  quote: Quotation; onView: () => void; onSend: () => void; onStatus: (s: QuoteStatus) => void; onDecline: () => void;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss<HTMLDivElement>(open, close);
  const item = 'w-full flex items-center gap-3 px-4 h-10 text-[14px] text-on-surface hover:bg-surface-container-low';
  const isOpen = quote.status === 'New' || quote.status === 'In Discussion';

  return (
    <div ref={ref} className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <button onClick={() => setOpen((o) => !o)} aria-label={`Actions for ${quote.id}`} aria-expanded={open} className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface hover:bg-surface-container-high">
        <span className="material-symbols-outlined text-[22px]">more_horiz</span>
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-56 bg-white rounded-2xl border border-outline-variant/50 shadow-xl py-2 text-left">
          <button onClick={() => { close(); onView(); }} className={item}><span className="material-symbols-outlined text-[20px] text-on-surface-variant">visibility</span> View details</button>
          {(isOpen || quote.status === 'Quotation Sent') && <button onClick={() => { close(); onSend(); }} className={item}><span className="material-symbols-outlined text-[20px] text-on-surface-variant">send</span> {quote.status === 'Quotation Sent' ? 'Edit & resend quotation' : 'Send quotation'}</button>}
          {quote.status === 'New' && <button onClick={() => { close(); onStatus('In Discussion'); }} className={item}><span className="material-symbols-outlined text-[20px] text-on-surface-variant">schedule</span> Mark as In Discussion</button>}
          {quote.status === 'Quotation Sent' && <button onClick={() => { close(); onStatus('Approved'); }} className={`${item} text-green-700`}><span className="material-symbols-outlined text-[20px]">check_circle</span> Mark as Approved</button>}
          {(isOpen || quote.status === 'Quotation Sent') && <button onClick={() => { close(); onDecline(); }} className={`${item} text-brand-red`}><span className="material-symbols-outlined text-[20px]">cancel</span> Decline request</button>}
          {(quote.status === 'Approved' || quote.status === 'Declined') && <button onClick={() => { close(); onStatus('In Discussion'); }} className={item}><span className="material-symbols-outlined text-[20px] text-on-surface-variant">undo</span> Reopen request</button>}
          <a href={`mailto:${quote.org.email}?subject=${encodeURIComponent(`Your quotation request ${quote.id}`)}`} onClick={close} className={`${item} border-t border-outline-variant/40 mt-1`}><span className="material-symbols-outlined text-[20px] text-on-surface-variant">mail</span> Email contact</a>
        </div>
      )}
    </div>
  );
}

export default function AdminQuotations() {
  const { triggerToast } = useToast();
  useCurrencySettings(); // re-render when Settings > Currency changes
  const [initial] = useState(readUrl);

  const [tab, setTab] = useState<QuoteTab>('All');
  const [searchInput, setSearchInput] = useState(initial.search);
  const [search, setSearch] = useState(initial.search);
  const [orgType, setOrgType] = useState<OrgType | 'All'>('All');
  const [status, setStatus] = useState<QuoteStatus | 'All'>('All');
  const [date, setDate] = useState<QuoteDateFilter | 'All'>('All');
  const [sort, setSort] = useState<QuoteQuery['sort']>({ key: 'requestedAt', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [reloadKey, setReloadKey] = useState(0);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState<Quotation | null>(null);
  const [editingOrg, setEditingOrg] = useState<Quotation | null>(null);
  const [declining, setDeclining] = useState<{ ids: string[]; label: string } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const query: QuoteQuery = useMemo(() => ({ tab, search, orgType, status, date, sort, page, perPage }), [tab, search, orgType, status, date, sort, page, perPage]);
  const queryKey = JSON.stringify(query) + reloadKey;

  const [result, setResult] = useState<{ key: string; data: QuoteListResult } | null>(null);
  const [listError, setListError] = useState<{ key: string; message: string } | null>(null);
  useEffect(() => {
    let cancelled = false;
    listQuotations(query)
      .then((data) => { if (!cancelled) setResult({ key: queryKey, data }); })
      .catch((e) => { if (!cancelled) setListError({ key: queryKey, message: e?.message || 'Could not load quotations' }); });
    return () => { cancelled = true; };
  }, [query, queryKey]);
  const loading = result?.key !== queryKey && listError?.key !== queryKey;
  const error = listError?.key === queryKey ? listError.message : '';
  const data = result?.data;

  const [summary, setSummary] = useState<QuoteSummary | null>(null);
  useEffect(() => {
    let cancelled = false;
    getQuoteSummary().then((s) => { if (!cancelled) setSummary(s); }).catch(() => {});
    return () => { cancelled = true; };
  }, [reloadKey]);

  const [detail, setDetail] = useState<{ key: string; quote: Quotation | null; error: string } | null>(null);
  const detailKey = `${activeId}:${reloadKey}`;
  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    getQuotation(activeId)
      .then((quote) => { if (!cancelled) setDetail({ key: detailKey, quote, error: '' }); })
      .catch((e) => { if (!cancelled) setDetail({ key: detailKey, quote: null, error: e?.message || 'Could not load this quotation' }); });
    return () => { cancelled = true; };
  }, [activeId, detailKey]);
  const shownQuote = detail && detail.key.startsWith(`${activeId}:`) ? detail.quote : null;

  const withPageReset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1); };
  const onTab = withPageReset(setTab);
  const onOrgType = withPageReset(setOrgType);
  const onStatusFilter = withPageReset(setStatus);
  const onDate = withPageReset(setDate);
  const onPerPage = withPageReset(setPerPage);
  const filtersActive = search || orgType !== 'All' || status !== 'All' || date !== 'All';
  const resetFilters = () => {
    setSearchInput(''); setSearch(''); setOrgType('All'); setStatus('All'); setDate('All');
    setSort({ key: 'requestedAt', dir: 'desc' }); setPage(1); setSelected(new Set());
  };
  const onSort = (key: QuoteSortKey) => {
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

  const changeStatus = (ids: string[], to: QuoteStatus, label: string) =>
    run(() => setQuoteStatus(ids, to), `${label} marked as ${to}`).then(() => setSelected(new Set()));

  // "Send" needs the full request (all items), so load it first when started from the table
  const startSend = async (id: string) => {
    const q = shownQuote?.id === id ? shownQuote : await getQuotation(id);
    setSending(q);
  };

  /* Selection */
  const pageIds = data?.rows.map((q) => q.id) ?? [];
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
  const selectedLabel = `${selected.size} request${selected.size === 1 ? '' : 's'}`;

  const counts = data?.tabCounts;
  const columns = 10;
  const cards: { key: QuoteTab; label: string; icon: string; tint: string; value?: number; change?: number }[] = [
    { key: 'All', label: 'Total Quotations', icon: 'description', tint: 'bg-blue-50 text-blue-700', value: summary?.total, change: summary?.totalChangePercent },
    { key: 'New', label: 'New Requests', icon: 'schedule', tint: 'bg-amber-100 text-amber-600', value: summary?.New },
    { key: 'In Discussion', label: 'In Discussion', icon: 'forum', tint: 'bg-violet-100 text-violet-600', value: summary?.['In Discussion'] },
    { key: 'Quotation Sent', label: 'Quotation Sent', icon: 'outgoing_mail', tint: 'bg-blue-50 text-blue-700', value: summary?.['Quotation Sent'] },
    { key: 'Approved', label: 'Approved', icon: 'check_circle', tint: 'bg-green-50 text-green-600', value: summary?.Approved },
    { key: 'Declined', label: 'Declined', icon: 'cancel', tint: 'bg-red-50 text-brand-red', value: summary?.Declined },
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
                <span className="text-on-surface">Quotations</span>
              </nav>
              <h1 className="text-[30px] sm:text-[34px] font-bold text-on-surface leading-tight mt-1">Quotations (Bulk Orders)</h1>
              <p className="text-[14px] text-on-surface-variant">Manage bulk order requests from schools, institutions and organizations.</p>
            </div>
            <button onClick={() => setCreating(true)} className="h-11 px-5 flex items-center justify-center gap-2 rounded-xl bg-brand-red text-white text-[14px] font-medium hover:bg-[#b8231d] shrink-0">
              <span className="material-symbols-outlined text-[20px]">add</span> New Quotation
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
            {cards.map((c) => (
              <button key={c.key} onClick={() => onTab(c.key)} aria-pressed={tab === c.key} className={`bg-white rounded-2xl border p-4 flex items-center gap-3 text-left transition-all hover:shadow-md ${tab === c.key ? 'border-primary ring-1 ring-primary' : 'border-outline-variant/50'}`}>
                <span className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${c.tint}`}>
                  <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>{c.icon}</span>
                </span>
                <span className="flex flex-col min-w-0">
                  <span className="text-[22px] font-bold text-on-surface leading-none tabular-nums">{c.value ?? '–'}</span>
                  <span className="text-[13px] text-on-surface-variant mt-1 leading-snug">{c.label}</span>
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
            <div role="tablist" aria-label="Quotation status" className="flex gap-1 overflow-x-auto border-b border-outline-variant/50">
              {TABS.map((t) => (
                <button key={t} role="tab" aria-selected={tab === t} onClick={() => onTab(t)} className={`relative h-11 px-4 text-[14px] whitespace-nowrap ${tab === t ? 'text-brand-red font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`}>
                  {t} ({counts ? counts[t] : '…'})
                  {tab === t && <span className="absolute left-2 right-2 -bottom-px h-0.5 rounded-full bg-brand-red" />}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative flex-1 min-w-[200px] basis-full sm:basis-auto">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant pointer-events-none">search</span>
                <input type="search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search by organization..." aria-label="Search by quote ID, organization, contact or product"
                  className="h-11 w-full pl-10 pr-3 rounded-xl border border-outline-variant/70 bg-white text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
              </div>
              <FilterSelect label="Organization Type" value={orgType} options={ORG_TYPES} onChange={onOrgType} />
              <FilterSelect label="Status" value={status} options={QUOTE_STATUSES} onChange={onStatusFilter} />
              <FilterSelect label="Date Range" value={date} options={QUOTE_DATE_FILTERS} onChange={onDate} />
              <button onClick={resetFilters} disabled={!filtersActive} className="h-11 px-4 rounded-xl border border-outline-variant/70 bg-white text-[14px] font-medium text-primary hover:bg-primary/5 disabled:text-on-surface-variant/50 disabled:hover:bg-white">Reset</button>
            </div>

            {selected.size > 0 && (
              <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl bg-brand-green-dark text-white">
                <span className="text-[14px] font-medium">{selected.size} selected</span>
                <button disabled={busy} onClick={() => changeStatus([...selected], 'In Discussion', selectedLabel)} className="h-10 px-4 rounded-xl border border-white/30 text-[14px] hover:bg-white/10 disabled:opacity-50">Mark as In Discussion</button>
                <button disabled={busy} onClick={() => setDeclining({ ids: [...selected], label: selectedLabel })} className="h-10 px-4 rounded-xl bg-brand-red text-[14px] font-medium disabled:opacity-50">Decline</button>
                <button onClick={() => setSelected(new Set())} className="h-10 px-4 rounded-xl text-[14px] text-white/80 hover:text-white ml-auto">Clear selection</button>
              </div>
            )}

            <div className="overflow-x-auto -mx-4">
              <table className="w-full min-w-[920px] text-left text-[13px]">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant">
                    <th className="pl-4 pr-2 py-3 w-10">
                      <input type="checkbox" checked={allOnPage} ref={(el) => { if (el) el.indeterminate = someOnPage && !allOnPage; }} onChange={togglePage} aria-label="Select all quotations on this page" className="w-4 h-4 accent-[var(--color-primary)]" />
                    </th>
                    <th className="font-semibold px-3 py-3">Quote ID</th>
                    <th className="font-semibold px-3 py-3">Organization</th>
                    <th className="font-semibold px-3 py-3">Type</th>
                    <SortHeader label="Items" sortKey="items" sort={sort} onSort={onSort} />
                    <SortHeader label="Estimated Value" sortKey="estimatedValue" sort={sort} onSort={onSort} />
                    <th className="font-semibold px-3 py-3">Status</th>
                    <SortHeader label="Requested On" sortKey="requestedAt" sort={sort} onSort={onSort} />
                    <th className="font-semibold px-3 py-3 text-center" colSpan={2}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y divide-outline-variant/40 transition-opacity ${loading && data ? 'opacity-50' : ''}`}>
                  {error ? (
                    <tr><td colSpan={columns} className="px-4 py-12 text-center text-error">{error} <button onClick={refresh} className="ml-2 underline">Try again</button></td></tr>
                  ) : !data ? (
                    Array.from({ length: 10 }).map((_, i) => <tr key={i}><td colSpan={columns} className="px-4 py-2"><Skeleton className="h-10" /></td></tr>)
                  ) : data.rows.length === 0 ? (
                    <tr><td colSpan={columns} className="px-4 py-16 text-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-[36px] block mb-2">request_quote</span>
                      No quotation requests match these filters.
                      {filtersActive && <button onClick={resetFilters} className="ml-1 text-primary font-medium hover:underline">Reset filters</button>}
                    </td></tr>
                  ) : data.rows.map((q) => (
                    <tr key={q.id} onClick={() => setActiveId(q.id)} className={`cursor-pointer transition-colors ${activeId === q.id ? 'bg-primary/5' : selected.has(q.id) ? 'bg-surface-container-low/70' : 'hover:bg-surface-container-low/60'}`}>
                      <td className="pl-4 pr-2 py-2" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selected.has(q.id)} onChange={() => toggleOne(q.id)} aria-label={`Select ${q.id}`} className="w-4 h-4 accent-[var(--color-primary)]" />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap"><button onClick={(e) => { e.stopPropagation(); setActiveId(q.id); }} className="font-semibold text-blue-800 underline underline-offset-2 hover:text-primary">{q.id}</button></td>
                      <td className="px-3 py-2"><span className="flex items-center gap-2.5"><OrgLogo org={q.org} /><span className="text-on-surface whitespace-nowrap">{q.org.name}</span></span></td>
                      <td className="px-3 py-2"><StatusBadge status={q.org.type} /></td>
                      <td className="px-3 py-2 tabular-nums">{q.items.length}</td>
                      <td className="px-3 py-2 tabular-nums whitespace-nowrap">{formatMoney(q.estimatedValue)}</td>
                      <td className="px-3 py-2"><StatusBadge status={q.status} /></td>
                      <td className="px-3 py-2 whitespace-nowrap">{formatDay(q.requestedAt)}</td>
                      <td className="pl-3 py-2"><button onClick={(e) => { e.stopPropagation(); setActiveId(q.id); }} className="h-8 px-3.5 rounded-lg border border-outline-variant text-primary text-[13px] font-medium hover:bg-primary/5">View</button></td>
                      <td className="pr-3 py-1.5">
                        <RowMenu quote={q} onView={() => setActiveId(q.id)} onSend={() => startSend(q.id)} onStatus={(s) => changeStatus([q.id], s, q.id)} onDecline={() => setDeclining({ ids: [q.id], label: q.id })} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {data && <Pagination page={page} perPage={perPage} total={data.total} noun="quotations" onPage={setPage} onPerPage={onPerPage} />}
        </div>
      </div>

      {activeId && (
        <SidePanel label="Quotation details" onClose={() => setActiveId(null)}>
          <QuotationDetailPanel
            key={activeId}
            quote={shownQuote}
            loading={detail?.key !== detailKey && !shownQuote}
            error={detail?.key === detailKey ? detail.error : ''}
            busy={busy}
            onClose={() => setActiveId(null)}
            onEditOrg={() => shownQuote && setEditingOrg(shownQuote)}
            onSend={() => shownQuote && setSending(shownQuote)}
            onStatus={(s) => changeStatus([activeId], s, activeId)}
            onDecline={() => setDeclining({ ids: [activeId], label: activeId })}
            onAddNote={async (text) => { await run(() => addQuoteNote(activeId, text), 'Note saved'); }}
          />
        </SidePanel>
      )}

      {creating && (
        <NewQuotationDialog
          busy={busy}
          onCancel={() => setCreating(false)}
          onSave={async (input) => {
            let createdId = '';
            const ok = await run(async () => { createdId = (await createQuotation(input)).id; }, `Quotation request for ${input.org.name} created`);
            if (ok) { setCreating(false); setActiveId(createdId); }
          }}
        />
      )}

      {sending && (
        <SendQuotationDialog
          quote={sending}
          busy={busy}
          onCancel={() => setSending(null)}
          onSend={async (input) => { const ok = await run(() => sendQuotation(sending.id, input), `Quotation ${sending.id} sent to ${sending.org.name}`); if (ok) setSending(null); }}
        />
      )}

      {editingOrg && (
        <EditOrgDialog
          initial={editingOrg.org}
          busy={busy}
          onCancel={() => setEditingOrg(null)}
          onSave={async (org) => { const ok = await run(() => updateOrganization(editingOrg.id, org), `${org.name} updated`); if (ok) setEditingOrg(null); }}
        />
      )}

      {declining && (
        <PromptDialog
          title={`Decline ${declining.label}?`}
          text="The organization will be told their request cannot be fulfilled."
          label="Reason (shared with the organization)"
          placeholder="e.g. The requested items are not available in these quantities"
          confirmLabel="Decline"
          danger
          busy={busy}
          onCancel={() => setDeclining(null)}
          onConfirm={async (reason) => {
            const d = declining;
            setDeclining(null);
            await run(() => setQuoteStatus(d.ids, 'Declined', reason), `${d.label} declined`);
            setSelected(new Set());
          }}
        />
      )}
    </div>
  );
}
