"use client";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ADMIN_BASE_PATH } from '../../../services/adminRoutes';
import { useCurrencySettings } from '../../../services/currency';
import {
  AdminVendor, NewVendor, VENDOR_CATEGORIES, VENDOR_COUNTRIES, VENDOR_STATUSES, VendorDetail, VendorListResult, VendorQuery,
  VendorSortKey, VendorStatus, VendorSummary, VendorTab, createVendor, getVendor, getVendorSummary, listVendors, setVendorStatus, updateVendor,
} from '../../../services/adminVendors';
import { useToast } from '../../../components/ToastProvider';
import { GlobalSearch, NotificationBell, ProfileMenu } from '../_dashboard/DashboardHeader';
import { ConfirmDialog, PromptDialog, Skeleton, StatusBadge, useDismiss } from '../_dashboard/ui';
import { FilterSelect, Pagination, SidePanel, SortHeader } from '../_dashboard/table';
import VendorDetailPanel, { Stars, VendorFormDialog, VendorLogo, formatDay, messageVendorHref } from './_components/VendorDetailPanel';

const readUrl = () => {
  // The admin layout only renders pages in the browser (after the session check), so window is available here
  const params = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);
  return { search: params.get('q') ?? '', tab: (params.get('status') === 'pending' ? 'Pending' : 'All') as VendorTab };
};

const TABS: { key: VendorTab; label: string }[] = [
  { key: 'All', label: 'All Vendors' },
  { key: 'Pending', label: 'Pending Approval' },
  { key: 'Suspended', label: 'Suspended' },
  { key: 'Inactive', label: 'Inactive' },
];

// What each status change means, for the confirmation popups and messages
type StatusAction = { ids: string[]; to: VendorStatus; label: string; kind: 'approve' | 'reject' | 'suspend' | 'reactivate' };

function RowMenu({ vendor, onView, onEdit, onAction }: {
  vendor: AdminVendor; onView: () => void; onEdit: () => void; onAction: (kind: StatusAction['kind']) => void;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss<HTMLDivElement>(open, close);
  const item = 'w-full flex items-center gap-3 px-4 h-10 text-[14px] text-on-surface hover:bg-surface-container-low';

  return (
    <div ref={ref} className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <button onClick={() => setOpen((o) => !o)} aria-label={`Actions for ${vendor.name}`} aria-expanded={open} className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface hover:bg-surface-container-high">
        <span className="material-symbols-outlined text-[22px]">more_horiz</span>
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-52 bg-white rounded-2xl border border-outline-variant/50 shadow-xl py-2 text-left">
          <button onClick={() => { close(); onView(); }} className={item}><span className="material-symbols-outlined text-[20px] text-on-surface-variant">visibility</span> View details</button>
          <button onClick={() => { close(); onEdit(); }} className={item}><span className="material-symbols-outlined text-[20px] text-on-surface-variant">edit</span> Edit</button>
          <a href={messageVendorHref(vendor)} onClick={close} className={item}><span className="material-symbols-outlined text-[20px] text-on-surface-variant">chat</span> Message vendor</a>
          <div className="border-t border-outline-variant/40 mt-1 pt-1">
            {vendor.status === 'Pending' && <>
              <button onClick={() => { close(); onAction('approve'); }} className={`${item} text-green-700`}><span className="material-symbols-outlined text-[20px]">check_circle</span> Approve vendor</button>
              <button onClick={() => { close(); onAction('reject'); }} className={`${item} text-brand-red`}><span className="material-symbols-outlined text-[20px]">block</span> Reject</button>
            </>}
            {vendor.status === 'Active' && <button onClick={() => { close(); onAction('suspend'); }} className={`${item} text-brand-red`}><span className="material-symbols-outlined text-[20px]">block</span> Suspend vendor</button>}
            {(vendor.status === 'Suspended' || vendor.status === 'Inactive') && <button onClick={() => { close(); onAction('reactivate'); }} className={`${item} text-green-700`}><span className="material-symbols-outlined text-[20px]">check_circle</span> Reactivate</button>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminVendors() {
  const { triggerToast } = useToast();
  useCurrencySettings(); // re-render when Settings > Currency changes
  const [initial] = useState(readUrl);

  const [tab, setTab] = useState<VendorTab>(initial.tab);
  const [searchInput, setSearchInput] = useState(initial.search);
  const [search, setSearch] = useState(initial.search);
  const [status, setStatus] = useState<VendorStatus | 'All'>('All');
  const [category, setCategory] = useState<string | 'All'>('All');
  const [country, setCountry] = useState<string | 'All'>('All');
  const [sort, setSort] = useState<VendorQuery['sort']>({ key: 'joinedAt', dir: 'asc' });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [reloadKey, setReloadKey] = useState(0);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<{ mode: 'add' } | { mode: 'edit'; vendor: AdminVendor } | null>(null);
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState<StatusAction | null>(null);

  // Waits until typing pauses before searching, and goes back to page 1
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const query: VendorQuery = useMemo(() => ({ tab, search, status, category, country, sort, page, perPage }), [tab, search, status, category, country, sort, page, perPage]);
  const queryKey = JSON.stringify(query) + reloadKey;

  const [result, setResult] = useState<{ key: string; data: VendorListResult } | null>(null);
  const [listError, setListError] = useState<{ key: string; message: string } | null>(null);
  useEffect(() => {
    let cancelled = false;
    listVendors(query)
      .then((data) => { if (!cancelled) setResult({ key: queryKey, data }); })
      .catch((e) => { if (!cancelled) setListError({ key: queryKey, message: e?.message || 'Could not load vendors' }); });
    return () => { cancelled = true; };
  }, [query, queryKey]);
  const loading = result?.key !== queryKey && listError?.key !== queryKey;
  const error = listError?.key === queryKey ? listError.message : '';
  const data = result?.data;

  const [summary, setSummary] = useState<VendorSummary | null>(null);
  useEffect(() => {
    let cancelled = false;
    getVendorSummary().then((s) => { if (!cancelled) setSummary(s); }).catch(() => {});
    return () => { cancelled = true; };
  }, [reloadKey]);

  const [detail, setDetail] = useState<{ key: string; vendor: VendorDetail | null; error: string } | null>(null);
  const detailKey = `${activeId}:${reloadKey}`;
  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    getVendor(activeId)
      .then((vendor) => { if (!cancelled) setDetail({ key: detailKey, vendor, error: '' }); })
      .catch((e) => { if (!cancelled) setDetail({ key: detailKey, vendor: null, error: e?.message || 'Could not load this vendor' }); });
    return () => { cancelled = true; };
  }, [activeId, detailKey]);
  const shownVendor = detail && detail.key.startsWith(`${activeId}:`) ? detail.vendor : null;

  const withPageReset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1); };
  const onTab = withPageReset(setTab);
  const onStatus = withPageReset(setStatus);
  const onCategory = withPageReset(setCategory);
  const onCountry = withPageReset(setCountry);
  const onPerPage = withPageReset(setPerPage);
  const filtersActive = search || status !== 'All' || category !== 'All' || country !== 'All';
  const resetFilters = () => {
    setSearchInput(''); setSearch(''); setStatus('All'); setCategory('All'); setCountry('All');
    setSort({ key: 'joinedAt', dir: 'asc' }); setPage(1); setSelected(new Set());
  };
  const onSort = (key: VendorSortKey) => {
    setSort((s) => (s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }));
    setPage(1);
  };
  const refresh = () => setReloadKey((k) => k + 1);

  /* Actions */
  const ask = (ids: string[], kind: StatusAction['kind'], label: string) => {
    const to: Record<StatusAction['kind'], VendorStatus> = { approve: 'Active', reject: 'Inactive', suspend: 'Suspended', reactivate: 'Active' };
    setPending({ ids, to: to[kind], label, kind });
  };

  const applyStatus = async (note = '') => {
    if (!pending) return;
    const { ids, to, label, kind } = pending;
    setBusy(true);
    try {
      await setVendorStatus(ids, to, note);
      const done = { approve: 'approved', reject: 'rejected', suspend: 'suspended', reactivate: 'reactivated' }[kind];
      triggerToast(`${label} ${done}`);
      setSelected(new Set());
      refresh();
    } catch {
      triggerToast('Could not change the vendor status');
    } finally {
      setBusy(false);
      setPending(null);
    }
  };

  const saveForm = async (values: NewVendor) => {
    if (!form) return;
    setBusy(true); setFormError('');
    try {
      if (form.mode === 'add') {
        const created = await createVendor(values);
        triggerToast(`${created.name} added`);
        setActiveId(created.id);
      } else {
        await updateVendor(form.vendor.id, values);
        triggerToast(`${values.name} updated`);
      }
      setForm(null);
      refresh();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Could not save this vendor');
    } finally {
      setBusy(false);
    }
  };
  const openEdit = (v: AdminVendor) => { setFormError(''); setForm({ mode: 'edit', vendor: v }); };

  /* Selection */
  const pageIds = data?.rows.map((v) => v.id) ?? [];
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
  const selectedLabel = `${selected.size} vendor${selected.size === 1 ? '' : 's'}`;

  const counts = data?.tabCounts;
  const columns = 11;
  const cards = [
    { key: 'total', label: 'Total Vendors', icon: 'groups', tint: 'bg-blue-50 text-blue-700', value: summary?.total, change: summary?.totalChangePercent, onClick: () => { onTab('All'); onStatus('All'); } },
    { key: 'active', label: 'Active Vendors', icon: 'check_circle', tint: 'bg-green-50 text-green-600', value: summary?.active, onClick: () => { onTab('All'); onStatus('Active'); } },
    { key: 'pending', label: 'Pending Approval', icon: 'schedule', tint: 'bg-orange-50 text-orange-500', value: summary?.pending, onClick: () => { onStatus('All'); onTab('Pending'); } },
    { key: 'suspended', label: 'Suspended', icon: 'block', tint: 'bg-red-50 text-brand-red', value: summary?.suspended, onClick: () => { onStatus('All'); onTab('Suspended'); } },
    { key: 'new', label: 'New This Year', icon: 'group_add', tint: 'bg-slate-100 text-slate-700', value: summary?.newThisYear, onClick: () => { setSort({ key: 'joinedAt', dir: 'desc' }); setPage(1); } },
  ];

  const confirmCopy: Record<StatusAction['kind'], { title: string; text: string; button: string }> = {
    approve: { title: 'Approve', text: 'They will be able to list products and receive orders straight away.', button: 'Approve' },
    reactivate: { title: 'Reactivate', text: 'Their products will be visible in the store again and they can receive orders.', button: 'Reactivate' },
    suspend: { title: 'Suspend', text: 'Their products will be hidden from the store and they cannot receive new orders.', button: 'Suspend' },
    reject: { title: 'Reject', text: 'The application will be closed and the vendor will not be able to sell.', button: 'Reject' },
  };

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
                <span className="text-on-surface">Vendors</span>
              </nav>
              <h1 className="text-[30px] sm:text-[34px] font-bold text-on-surface leading-tight mt-1">Vendors</h1>
         </div>
            <button onClick={() => { setFormError(''); setForm({ mode: 'add' }); }} className="h-11 px-5 flex items-center justify-center gap-2 rounded-xl bg-brand-red text-white text-[14px] font-medium hover:bg-[#b8231d] shrink-0">
              <span className="material-symbols-outlined text-[20px]">add</span> Add Vendor
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
            {cards.map((c) => (
              <button key={c.key} onClick={c.onClick} className="bg-white rounded-2xl border border-outline-variant/50 p-4 flex items-center gap-3 text-left transition-all hover:shadow-md">
                <span className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${c.tint}`}>
                  <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>{c.icon}</span>
                </span>
                <span className="flex flex-col min-w-0">
                  <span className="text-[22px] font-bold text-on-surface leading-none tabular-nums">{c.value !== undefined ? c.value.toLocaleString('en-US') : '–'}</span>
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
            <div role="tablist" aria-label="Vendor lists" className="flex gap-1 overflow-x-auto border-b border-outline-variant/50">
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
                <input type="search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search vendors..." aria-label="Search vendors by name, email, city or category"
                  className="h-11 w-full pl-10 pr-3 rounded-xl border border-outline-variant/70 bg-white text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
              </div>
              <FilterSelect label="Vendor Status" value={status} options={VENDOR_STATUSES} onChange={onStatus} />
              <FilterSelect label="Category" value={category} options={VENDOR_CATEGORIES} onChange={onCategory} />
              <FilterSelect label="Country" value={country} options={VENDOR_COUNTRIES} onChange={onCountry} />
              <button onClick={resetFilters} disabled={!filtersActive} className="h-11 px-4 rounded-xl border border-outline-variant/70 bg-white text-[14px] font-medium text-primary hover:bg-primary/5 disabled:text-on-surface-variant/50 disabled:hover:bg-white">Reset</button>
            </div>

            {selected.size > 0 && (
              <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl bg-brand-green-dark text-white">
                <span className="text-[14px] font-medium">{selected.size} selected</span>
                <button onClick={() => ask([...selected], 'approve', selectedLabel)} className="h-10 px-4 rounded-xl bg-green-600 text-[14px] font-medium hover:bg-green-700">Approve / Reactivate</button>
                <button onClick={() => ask([...selected], 'suspend', selectedLabel)} className="h-10 px-4 rounded-xl bg-brand-red text-[14px] font-medium">Suspend</button>
                <button onClick={() => setSelected(new Set())} className="h-10 px-4 rounded-xl text-[14px] text-white/80 hover:text-white ml-auto">Clear selection</button>
              </div>
            )}

            <div className="overflow-x-auto -mx-4">
              <table className="w-full min-w-[980px] text-left text-[13px]">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant">
                    <th className="pl-4 pr-2 py-3 w-10">
                      <input type="checkbox" checked={allOnPage} ref={(el) => { if (el) el.indeterminate = someOnPage && !allOnPage; }} onChange={togglePage} aria-label="Select all vendors on this page" className="w-4 h-4 accent-[var(--color-primary)]" />
                    </th>
                    <SortHeader label="Vendor" sortKey="name" sort={sort} onSort={onSort} />
                    <th className="font-semibold px-3 py-3 whitespace-nowrap">Category (Main)</th>
                    <SortHeader label="Products" sortKey="products" sort={sort} onSort={onSort} />
                    <SortHeader label="Total Orders" sortKey="totalOrders" sort={sort} onSort={onSort} />
                    <SortHeader label="Fulfilled %" sortKey="fulfilledPct" sort={sort} onSort={onSort} />
                    <SortHeader label="Rating" sortKey="rating" sort={sort} onSort={onSort} />
                    <th className="font-semibold px-3 py-3">Status</th>
                    <SortHeader label="Joined On" sortKey="joinedAt" sort={sort} onSort={onSort} />
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
                      <span className="material-symbols-outlined text-[36px] block mb-2">storefront</span>
                      {tab === 'Inactive' && !filtersActive ? 'No inactive vendors.' : 'No vendors match these filters.'}
                      {filtersActive && <button onClick={resetFilters} className="ml-1 text-primary font-medium hover:underline">Reset filters</button>}
                    </td></tr>
                  ) : data.rows.map((v) => (
                    <tr key={v.id} onClick={() => setActiveId(v.id)} className={`cursor-pointer transition-colors ${activeId === v.id ? 'bg-primary/5' : selected.has(v.id) ? 'bg-surface-container-low/70' : 'hover:bg-surface-container-low/60'}`}>
                      <td className="pl-4 pr-2 py-2" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selected.has(v.id)} onChange={() => toggleOne(v.id)} aria-label={`Select ${v.name}`} className="w-4 h-4 accent-[var(--color-primary)]" />
                      </td>
                      <td className="px-3 py-2"><span className="flex items-center gap-2.5"><VendorLogo name={v.name} pending={v.status === 'Pending'} /><span className="font-semibold text-on-surface whitespace-nowrap">{v.name}</span></span></td>
                      <td className="px-3 py-2 whitespace-nowrap">{v.categories[0]}</td>
                      <td className="px-3 py-2 tabular-nums">{v.products}</td>
                      <td className="px-3 py-2 tabular-nums">{v.totalOrders}</td>
                      <td className={`px-3 py-2 tabular-nums font-medium ${v.fulfilledPct >= 90 ? 'text-green-700' : v.fulfilledPct ? 'text-amber-700' : 'text-on-surface-variant'}`}>{v.fulfilledPct ? `${v.fulfilledPct}%` : '—'}</td>
                      <td className="px-3 py-2"><Stars rating={v.rating} /></td>
                      <td className="px-3 py-2"><StatusBadge status={v.status} /></td>
                      <td className="px-3 py-2 whitespace-nowrap">{formatDay(v.joinedAt)}</td>
                      <td className="pl-3 py-2"><button onClick={(e) => { e.stopPropagation(); setActiveId(v.id); }} className="h-8 px-3.5 rounded-lg border border-outline-variant text-primary text-[13px] font-medium hover:bg-primary/5">View</button></td>
                      <td className="pr-3 py-1.5"><RowMenu vendor={v} onView={() => setActiveId(v.id)} onEdit={() => openEdit(v)} onAction={(k) => ask([v.id], k, v.name)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {data && <Pagination page={page} perPage={perPage} total={data.total} noun="vendors" onPage={setPage} onPerPage={onPerPage} />}
        </div>
      </div>

      {activeId && (
        <SidePanel label="Vendor details" onClose={() => setActiveId(null)}>
          <VendorDetailPanel
            key={activeId}
            vendor={shownVendor}
            loading={detail?.key !== detailKey && !shownVendor}
            error={detail?.key === detailKey ? detail.error : ''}
            busy={busy}
            onClose={() => setActiveId(null)}
            onEdit={() => { if (shownVendor) openEdit(shownVendor); }}
            onApprove={() => shownVendor && ask([shownVendor.id], 'approve', shownVendor.name)}
            onReject={() => shownVendor && ask([shownVendor.id], 'reject', shownVendor.name)}
            onSuspend={() => shownVendor && ask([shownVendor.id], 'suspend', shownVendor.name)}
            onReactivate={() => shownVendor && ask([shownVendor.id], 'reactivate', shownVendor.name)}
          />
        </SidePanel>
      )}

      {form && (
        <VendorFormDialog
          title={form.mode === 'add' ? 'Add Vendor' : `Edit ${form.vendor.name}`}
          initial={form.mode === 'edit' ? { name: form.vendor.name, email: form.vendor.email, phone: form.vendor.phone, city: form.vendor.city, country: form.vendor.country, categories: form.vendor.categories } : undefined}
          busy={busy}
          error={formError}
          onCancel={() => setForm(null)}
          onSave={saveForm}
        />
      )}

      {/* Suspend and reject ask for a reason the vendor will see; approve and reactivate just confirm */}
      {pending && (pending.kind === 'suspend' || pending.kind === 'reject') && (
        <PromptDialog
          title={`${confirmCopy[pending.kind].title} ${pending.label}?`}
          text={confirmCopy[pending.kind].text}
          label="Reason (shared with the vendor)"
          placeholder={pending.kind === 'suspend' ? 'e.g. Too many late deliveries this month' : 'e.g. Business documents could not be verified'}
          confirmLabel={confirmCopy[pending.kind].button}
          danger
          busy={busy}
          onCancel={() => setPending(null)}
          onConfirm={(note) => applyStatus(note)}
        />
      )}
      {pending && (pending.kind === 'approve' || pending.kind === 'reactivate') && (
        <ConfirmDialog
          title={`${confirmCopy[pending.kind].title} ${pending.label}?`}
          text={confirmCopy[pending.kind].text}
          confirmLabel={confirmCopy[pending.kind].button}
          busy={busy}
          onCancel={() => setPending(null)}
          onConfirm={() => applyStatus()}
        />
      )}
    </div>
  );
}
