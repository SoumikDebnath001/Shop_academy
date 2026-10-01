"use client";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ADMIN_BASE_PATH } from '../../../services/adminRoutes';
import { currencyCode, formatMoney, moneyForCsv, useCurrencySettings } from '../../../services/currency';
import {
  ACCOUNT_STATUSES, AccountStatus, AdminCustomer, CUSTOMER_COUNTRIES, CUSTOMER_TYPES, CustomerDetail, CustomerListResult,
  CustomerQuery, CustomerSortKey, CustomerSummary, CustomerTab, CustomerType, JOINED_FILTERS, JoinedFilter, NewCustomer,
  addCustomerNote, createCustomer, getCustomer, getCustomerSummary, listCustomers, setCustomerStatus, updateCustomer,
} from '../../../services/adminCustomers';
import { useToast } from '../../../components/ToastProvider';
import { GlobalSearch, NotificationBell, ProfileMenu } from '../_dashboard/DashboardHeader';
import { ConfirmDialog, Skeleton, StatusBadge, useDismiss } from '../_dashboard/ui';
import { FilterSelect, Pagination, SidePanel, SortHeader, downloadCsv } from '../_dashboard/table';
import CustomerDetailPanel, { Avatar, CustomerFormDialog, formatDay, messageHref } from './_components/CustomerDetailPanel';

const readUrl = () => {
  // The admin layout only renders pages in the browser (after the session check), so window is available here
  const params = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);
  return { search: params.get('q') ?? '' };
};

const TABS: { key: CustomerTab; label: string }[] = [
  { key: 'All', label: 'All Customers' },
  { key: 'Individual', label: 'Individuals' },
  { key: 'School / Institution', label: 'Schools / Institutions' },
  { key: 'Foundation Sponsor', label: 'Foundation Sponsors' },
];

/* "..." menu on each row */
function RowMenu({ customer, onView, onEdit, onToggle, onCopy }: {
  customer: AdminCustomer; onView: () => void; onEdit: () => void; onToggle: () => void; onCopy: () => void;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss<HTMLDivElement>(open, close);
  const item = 'w-full flex items-center gap-3 px-4 h-10 text-[14px] text-on-surface hover:bg-surface-container-low';
  const disabled = customer.status === 'Disabled';

  return (
    <div ref={ref} className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <button onClick={() => setOpen((o) => !o)} aria-label={`Actions for ${customer.name}`} aria-expanded={open} className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface hover:bg-surface-container-high">
        <span className="material-symbols-outlined text-[22px]">more_horiz</span>
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-52 bg-white rounded-2xl border border-outline-variant/50 shadow-xl py-2 text-left">
          <button onClick={() => { close(); onView(); }} className={item}><span className="material-symbols-outlined text-[20px] text-on-surface-variant">visibility</span> View details</button>
          <button onClick={() => { close(); onEdit(); }} className={item}><span className="material-symbols-outlined text-[20px] text-on-surface-variant">edit</span> Edit</button>
          <a href={messageHref(customer)} onClick={close} className={item}><span className="material-symbols-outlined text-[20px] text-on-surface-variant">mail</span> Send message</a>
          <button onClick={() => { close(); onCopy(); }} className={item}><span className="material-symbols-outlined text-[20px] text-on-surface-variant">content_copy</span> Copy email</button>
          <button onClick={() => { close(); onToggle(); }} className={`${item} border-t border-outline-variant/40 mt-1 ${disabled ? 'text-green-700' : 'text-brand-red'}`}>
            <span className="material-symbols-outlined text-[20px]">{disabled ? 'check_circle' : 'block'}</span> {disabled ? 'Enable account' : 'Disable account'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminCustomers() {
  const { triggerToast } = useToast();
  useCurrencySettings(); // re-render when Settings > Currency changes
  const [initial] = useState(readUrl);

  const [tab, setTab] = useState<CustomerTab>('All');
  const [searchInput, setSearchInput] = useState(initial.search);
  const [search, setSearch] = useState(initial.search);
  const [type, setType] = useState<CustomerType | 'All'>('All');
  const [status, setStatus] = useState<AccountStatus | 'All'>('All');
  const [country, setCountry] = useState<string | 'All'>('All');
  const [joined, setJoined] = useState<JoinedFilter | 'All'>('All');
  const [sort, setSort] = useState<CustomerQuery['sort']>({ key: 'joinedAt', dir: 'asc' });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [reloadKey, setReloadKey] = useState(0);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<{ mode: 'add' } | { mode: 'edit'; customer: AdminCustomer } | null>(null);
  const [formError, setFormError] = useState('');
  const [confirm, setConfirm] = useState<{ ids: string[]; to: AccountStatus; label: string } | null>(null);

  // Waits until typing pauses before searching, and goes back to page 1
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const query: CustomerQuery = useMemo(() => ({ tab, search, type, status, country, joined, sort, page, perPage }), [tab, search, type, status, country, joined, sort, page, perPage]);
  const queryKey = JSON.stringify(query) + reloadKey;

  /* List (the result remembers its query, so "loading" means "result is for an older query") */
  const [result, setResult] = useState<{ key: string; data: CustomerListResult } | null>(null);
  const [listError, setListError] = useState<{ key: string; message: string } | null>(null);
  useEffect(() => {
    let cancelled = false;
    listCustomers(query)
      .then((data) => { if (!cancelled) setResult({ key: queryKey, data }); })
      .catch((e) => { if (!cancelled) setListError({ key: queryKey, message: e?.message || 'Could not load customers' }); });
    return () => { cancelled = true; };
  }, [query, queryKey]);
  const loading = result?.key !== queryKey && listError?.key !== queryKey;
  const error = listError?.key === queryKey ? listError.message : '';
  const data = result?.data;

  const [summary, setSummary] = useState<CustomerSummary | null>(null);
  useEffect(() => {
    let cancelled = false;
    getCustomerSummary().then((s) => { if (!cancelled) setSummary(s); }).catch(() => {});
    return () => { cancelled = true; };
  }, [reloadKey]);

  /* Detail panel */
  const [detail, setDetail] = useState<{ key: string; customer: CustomerDetail | null; error: string } | null>(null);
  const detailKey = `${activeId}:${reloadKey}`;
  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    getCustomer(activeId)
      .then((customer) => { if (!cancelled) setDetail({ key: detailKey, customer, error: '' }); })
      .catch((e) => { if (!cancelled) setDetail({ key: detailKey, customer: null, error: e?.message || 'Could not load this customer' }); });
    return () => { cancelled = true; };
  }, [activeId, detailKey]);
  const shownCustomer = detail && detail.key.startsWith(`${activeId}:`) ? detail.customer : null;

  /* Filters: every change goes back to page 1 */
  const withPageReset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1); };
  const onTab = withPageReset(setTab);
  const onType = withPageReset(setType);
  const onStatus = withPageReset(setStatus);
  const onCountry = withPageReset(setCountry);
  const onJoined = withPageReset(setJoined);
  const onPerPage = withPageReset(setPerPage);
  const filtersActive = search || type !== 'All' || status !== 'All' || country !== 'All' || joined !== 'All';
  const resetFilters = () => {
    setSearchInput(''); setSearch(''); setType('All'); setStatus('All'); setCountry('All'); setJoined('All');
    setSort({ key: 'joinedAt', dir: 'asc' }); setPage(1); setSelected(new Set());
  };
  const onSort = (key: CustomerSortKey) => {
    setSort((s) => (s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }));
    setPage(1);
  };

  /* Actions */
  const refresh = () => setReloadKey((k) => k + 1);

  const saveForm = async (values: NewCustomer) => {
    if (!form) return;
    setBusy(true); setFormError('');
    try {
      if (form.mode === 'add') {
        const created = await createCustomer(values);
        triggerToast(`${created.name} added`);
        setActiveId(created.id);
      } else {
        await updateCustomer(form.customer.id, values);
        triggerToast(`${values.name} updated`);
      }
      setForm(null);
      refresh();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Could not save this customer');
    } finally {
      setBusy(false);
    }
  };

  const askToggle = (ids: string[], currentlyDisabled: boolean, label: string) =>
    setConfirm({ ids, to: currentlyDisabled ? 'Active' : 'Disabled', label });

  const applyStatus = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      await setCustomerStatus(confirm.ids, confirm.to);
      triggerToast(`${confirm.label} ${confirm.to === 'Disabled' ? 'disabled' : 'enabled'}`);
      setSelected(new Set());
      refresh();
    } catch {
      triggerToast('Could not change the account status');
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const copyEmail = async (c: AdminCustomer) => {
    try { await navigator.clipboard.writeText(c.email); triggerToast('Email copied'); } catch { triggerToast(c.email); }
  };

  // Export the selected customers (every row, across pages, that is ticked)
  const exportSelected = async () => {
    const rows = await Promise.all([...selected].map((id) => getCustomer(id)));
    downloadCsv(`customers-${rows.length}.csv`, [
      ['Name', 'Type', 'Email', 'Phone', 'City', 'Country', 'Joined', 'Status', 'Total orders', `Total spent (${currencyCode()})`],
      ...rows.map((c) => [c.name, c.type, c.email, c.phone, c.city, c.country, c.joinedAt, c.status, c.totalOrders, moneyForCsv(c.totalSpent)]),
    ]);
    triggerToast(`Exported ${rows.length} customer${rows.length === 1 ? '' : 's'}`);
  };

  /* Selection */
  const pageIds = data?.rows.map((c) => c.id) ?? [];
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
  const columns = 11;
  const cards = [
    { key: 'total', label: 'Total Customers', icon: 'groups', tint: 'bg-blue-50 text-blue-700', value: summary?.total, change: summary?.change.total, onClick: () => { onTab('All'); onType('All'); } },
    { key: 'individuals', label: 'Individual Customers', icon: 'person', tint: 'bg-blue-50 text-blue-700', value: summary?.individuals, change: summary?.change.individuals, onClick: () => onTab('Individual') },
    { key: 'schools', label: 'Schools / Institutions', icon: 'account_balance', tint: 'bg-green-50 text-green-700', value: summary?.schools, change: summary?.change.schools, onClick: () => onTab('School / Institution') },
    { key: 'repeat', label: 'Repeat Customers', icon: 'star', tint: 'bg-amber-50 text-amber-500', value: summary?.repeat, change: summary?.change.repeat, onClick: () => { setSort({ key: 'totalOrders', dir: 'desc' }); setPage(1); } },
    { key: 'new', label: 'New This Month', icon: 'person_add', tint: 'bg-slate-100 text-slate-700', value: summary?.newThisMonth, onClick: () => onJoined('This month') },
  ];

  return (
    <div className="flex w-full min-h-screen">
      <div className="flex-1 min-w-0">
        <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8 flex flex-col gap-5">
          {/* Top bar */}
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1 md:max-w-xl"><GlobalSearch /></div>
            <div className="flex items-center gap-2 md:ml-auto">
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
                <span className="text-on-surface">Customers</span>
              </nav>
              <h1 className="text-[30px] sm:text-[34px] font-bold text-on-surface leading-tight mt-1">Customers</h1>
        </div>
            <button onClick={() => { setFormError(''); setForm({ mode: 'add' }); }} className="h-11 px-5 flex items-center justify-center gap-2 rounded-xl bg-brand-red text-white text-[14px] font-medium hover:bg-[#b8231d] shrink-0">
              <span className="material-symbols-outlined text-[20px]">add</span> Add Customer
            </button>
          </div>

          {/* Summary cards */}
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

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 min-w-[200px] basis-full sm:basis-auto">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant pointer-events-none">search</span>
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search customers..."
                aria-label="Search customers by name, email, phone or city"
                className="h-11 w-full pl-10 pr-3 rounded-xl border border-outline-variant/70 bg-white text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </div>
            <FilterSelect label="Customer Type" value={type} options={CUSTOMER_TYPES} onChange={onType} />
            <FilterSelect label="Account Status" value={status} options={ACCOUNT_STATUSES} onChange={onStatus} />
            <FilterSelect label="Country" value={country} options={CUSTOMER_COUNTRIES} onChange={onCountry} />
            <FilterSelect label="Joined Date" value={joined} options={JOINED_FILTERS} onChange={onJoined} />
            <button onClick={resetFilters} disabled={!filtersActive} className="h-11 px-4 rounded-xl border border-outline-variant/70 bg-white text-[14px] font-medium text-primary hover:bg-primary/5 disabled:text-on-surface-variant/50 disabled:hover:bg-white">
              Reset
            </button>
          </div>

          {/* Tabs */}
          <div role="tablist" aria-label="Customer types" className="flex gap-1 overflow-x-auto border-b border-outline-variant/50">
            {TABS.map((t) => (
              <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => onTab(t.key)} className={`relative h-11 px-4 text-[14px] whitespace-nowrap ${tab === t.key ? 'text-brand-red font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`}>
                {t.label} ({counts ? counts[t.key].toLocaleString('en-US') : '…'})
                {tab === t.key && <span className="absolute left-2 right-2 -bottom-px h-0.5 rounded-full bg-brand-red" />}
              </button>
            ))}
          </div>

          {/* Bulk actions */}
          {selected.size > 0 && (
            <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl bg-brand-green-dark text-white">
              <span className="text-[14px] font-medium">{selected.size} selected</span>
              <button onClick={exportSelected} className="h-10 px-4 rounded-xl border border-white/30 text-[14px] hover:bg-white/10">Export CSV</button>
              <button onClick={() => askToggle([...selected], false, `${selected.size} customer${selected.size === 1 ? '' : 's'}`)} className="h-10 px-4 rounded-xl bg-brand-red text-[14px] font-medium">Disable accounts</button>
              <button onClick={() => askToggle([...selected], true, `${selected.size} customer${selected.size === 1 ? '' : 's'}`)} className="h-10 px-4 rounded-xl border border-white/30 text-[14px] hover:bg-white/10">Enable accounts</button>
              <button onClick={() => setSelected(new Set())} className="h-10 px-4 rounded-xl text-[14px] text-white/80 hover:text-white ml-auto">Clear selection</button>
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-2xl border border-outline-variant/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] text-left text-[13px]">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant">
                    <th className="pl-4 pr-2 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allOnPage}
                        ref={(el) => { if (el) el.indeterminate = someOnPage && !allOnPage; }}
                        onChange={togglePage}
                        aria-label="Select all customers on this page"
                        className="w-4 h-4 accent-[var(--color-primary)]"
                      />
                    </th>
                    <SortHeader label="Name" sortKey="name" sort={sort} onSort={onSort} />
                    <th className="font-semibold px-3 py-3">Type</th>
                    <th className="font-semibold px-3 py-3">Email</th>
                    <th className="font-semibold px-3 py-3">Phone</th>
                    <SortHeader label="Total Orders" sortKey="totalOrders" sort={sort} onSort={onSort} />
                    <SortHeader label="Total Spent" sortKey="totalSpent" sort={sort} onSort={onSort} />
                    <SortHeader label="Joined On" sortKey="joinedAt" sort={sort} onSort={onSort} />
                    <th className="font-semibold px-3 py-3">Status</th>
                    <th className="font-semibold px-3 py-3 text-center" colSpan={2}>Action</th>
                  </tr>
                </thead>
                <tbody className={`divide-y divide-outline-variant/40 transition-opacity ${loading && data ? 'opacity-50' : ''}`}>
                  {error ? (
                    <tr><td colSpan={columns} className="px-4 py-12 text-center text-error">
                      {error} <button onClick={refresh} className="ml-2 underline">Try again</button>
                    </td></tr>
                  ) : !data ? (
                    Array.from({ length: 10 }).map((_, i) => <tr key={i}><td colSpan={columns} className="px-4 py-2"><Skeleton className="h-9" /></td></tr>)
                  ) : data.rows.length === 0 ? (
                    <tr><td colSpan={columns} className="px-4 py-16 text-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-[36px] block mb-2">group_off</span>
                      No customers match these filters.
                      {filtersActive && <button onClick={resetFilters} className="ml-1 text-primary font-medium hover:underline">Reset filters</button>}
                    </td></tr>
                  ) : data.rows.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setActiveId(c.id)}
                      className={`cursor-pointer transition-colors ${activeId === c.id ? 'bg-primary/5' : selected.has(c.id) ? 'bg-surface-container-low/70' : 'hover:bg-surface-container-low/60'}`}
                    >
                      <td className="pl-4 pr-2 py-2" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleOne(c.id)} aria-label={`Select ${c.name}`} className="w-4 h-4 accent-[var(--color-primary)]" />
                      </td>
                      <td className="px-3 py-2">
                        <span className="flex items-center gap-2.5"><Avatar name={c.name} /><span className="font-medium text-on-surface">{c.name}</span></span>
                      </td>
                      <td className="px-3 py-2"><StatusBadge status={c.type} /></td>
                      <td className="px-3 py-2 max-w-[220px] truncate">{c.email}</td>
                      <td className="px-3 py-2 whitespace-nowrap tabular-nums">{c.phone}</td>
                      <td className="px-3 py-2 tabular-nums">{c.totalOrders}</td>
                      <td className="px-3 py-2 tabular-nums whitespace-nowrap">{formatMoney(c.totalSpent)}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{formatDay(c.joinedAt)}</td>
                      <td className="px-3 py-2"><StatusBadge status={c.status} /></td>
                      <td className="pl-3 py-2">
                        <button onClick={(e) => { e.stopPropagation(); setActiveId(c.id); }} className="h-8 px-3.5 rounded-lg border border-outline-variant text-primary text-[13px] font-medium hover:bg-primary/5">View</button>
                      </td>
                      <td className="pr-3 py-1.5">
                        <RowMenu
                          customer={c}
                          onView={() => setActiveId(c.id)}
                          onEdit={() => { setFormError(''); setForm({ mode: 'edit', customer: c }); }}
                          onToggle={() => askToggle([c.id], c.status === 'Disabled', c.name)}
                          onCopy={() => copyEmail(c)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {data && <Pagination page={page} perPage={perPage} total={data.total} noun="customers" onPage={setPage} onPerPage={onPerPage} />}
        </div>
      </div>

      {activeId && (
        <SidePanel label="Customer details" onClose={() => setActiveId(null)}>
          <CustomerDetailPanel
            key={activeId}
            customer={shownCustomer}
            loading={detail?.key !== detailKey && !shownCustomer}
            error={detail?.key === detailKey ? detail.error : ''}
            busy={busy}
            onClose={() => setActiveId(null)}
            onEdit={() => { if (shownCustomer) { setFormError(''); setForm({ mode: 'edit', customer: shownCustomer }); } }}
            onToggleStatus={() => { if (shownCustomer) askToggle([shownCustomer.id], shownCustomer.status === 'Disabled', shownCustomer.name); }}
            onAddNote={async (text) => { await addCustomerNote(activeId, text); triggerToast('Note saved'); refresh(); }}
          />
        </SidePanel>
      )}

      {form && (
        <CustomerFormDialog
          title={form.mode === 'add' ? 'Add Customer' : `Edit ${form.customer.name}`}
          initial={form.mode === 'edit' ? { name: form.customer.name, email: form.customer.email, phone: form.customer.phone, type: form.customer.type, city: form.customer.city, country: form.customer.country } : undefined}
          busy={busy}
          error={formError}
          onCancel={() => setForm(null)}
          onSave={saveForm}
        />
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.to === 'Disabled' ? `Disable ${confirm.label}?` : `Enable ${confirm.label}?`}
          text={confirm.to === 'Disabled'
            ? 'They will not be able to sign in or place orders until the account is enabled again. Their order history is kept.'
            : 'They will be able to sign in and place orders again.'}
          confirmLabel={confirm.to === 'Disabled' ? 'Disable' : 'Enable'}
          danger={confirm.to === 'Disabled'}
          busy={busy}
          onCancel={() => setConfirm(null)}
          onConfirm={applyStatus}
        />
      )}
    </div>
  );
}
