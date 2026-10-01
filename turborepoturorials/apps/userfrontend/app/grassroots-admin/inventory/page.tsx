"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { api } from '../../../services/api';
import { ADMIN_BASE_PATH, adminPath } from '../../../services/adminRoutes';
import { formatMoney, useCurrencySettings } from '../../../services/currency';
import {
  AdminProduct, IMPORT_COLUMNS, ImportResult, PRODUCT_CATEGORIES, PRODUCT_SPORTS, PRODUCT_STATUSES, PRODUCT_VENDORS,
  ProductListResult, ProductQuery, ProductSortKey, ProductStatus, ProductSummary, ProductTab, ReviewDecision,
  getProduct, getProductSummary, importProducts, listProducts, reviewProducts, setProductPublished,
} from '../../../services/adminProducts';
import { useToast } from '../../../components/ToastProvider';
import { GlobalSearch, NotificationBell, ProfileMenu } from '../_dashboard/DashboardHeader';
import { Skeleton, StatusBadge, useDismiss } from '../_dashboard/ui';
import { FilterSelect, Pagination, SidePanel, SortHeader, downloadCsv } from '../_dashboard/table';
import ProductDetailPanel, { ProductThumb, ReasonDialog } from './_components/ProductDetailPanel';
import ProductsSection from './ProductsSection';
import CategoriesSection from './CategoriesSection';

/* The page has three views: the new product review screen (demo data), and the two
   screens already connected to the backend: category manager and live catalog. */
type View = 'review' | 'categories' | 'catalog';

const readUrl = () => {
  // The admin layout only renders pages in the browser (after the session check), so window is available here
  const params = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);
  const view = params.get('view');
  const status = params.get('status');
  return {
    view: (view === 'categories' || view === 'catalog' ? view : 'review') as View,
    search: params.get('q') ?? '',
    tab: (status === 'pending' ? 'Pending' : status === 'unpublished' ? 'Unpublished' : 'All') as ProductTab,
  };
};

const formatDay = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const TABS: { key: ProductTab; label: string }[] = [
  { key: 'All', label: 'All Products' },
  { key: 'Pending', label: 'Pending Approval' },
  { key: 'Unpublished', label: 'Unpublished' },
];

/* ---------- Import popup ---------- */

function ImportDialog({ onClose, onDone }: { onClose: () => void; onDone: (r: ImportResult) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const template = () => downloadCsv('products-import-template.csv', [
    [...IMPORT_COLUMNS],
    ['Cricket Practice Ball', 'SGL-CPB-001', 'SprintGear Ltd', 'Cricket', 'Cricket', 'SG', 650, 120, 'Leather practice ball for nets'],
  ]);

  const upload = async () => {
    if (!file) return;
    setBusy(true); setError('');
    try {
      const r = await importProducts(await file.text());
      setResult(r);
      onDone(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read this file');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label="Import products" className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 pb-safe">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[18px] font-semibold text-on-surface">Import Products</h3>
            <p className="text-[13px] text-on-surface-variant mt-0.5">Upload a CSV file. Imported products wait in Pending Approval until you review them.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 -mr-2 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {result ? (
          <div className="mt-5 space-y-3">
            <p className="flex items-center gap-2 text-[14px] text-green-700 font-medium">
              <span className="material-symbols-outlined">check_circle</span>
              {result.added} product{result.added === 1 ? '' : 's'} added to Pending Approval
            </p>
            {result.skipped.length > 0 && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-[13px] text-amber-900 max-h-40 overflow-y-auto">
                <p className="font-medium mb-1">{result.skipped.length} row{result.skipped.length === 1 ? '' : 's'} skipped:</p>
                <ul className="list-disc pl-5 space-y-0.5">{result.skipped.map((s) => <li key={s.line}>Line {s.line}: {s.reason}</li>)}</ul>
              </div>
            )}
            <div className="flex justify-end"><button onClick={onClose} className="h-11 px-5 rounded-xl bg-brand-green-dark text-white text-[14px] font-medium">Done</button></div>
          </div>
        ) : (
          <>
            <button
              onClick={() => inputRef.current?.click()}
              className="mt-5 w-full flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-outline-variant p-6 text-center hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <span className="material-symbols-outlined text-[36px] text-on-surface-variant">upload_file</span>
              <span className="text-[14px] font-medium text-on-surface">{file ? file.name : 'Choose a CSV file'}</span>
              <span className="text-[12px] text-on-surface-variant">Columns: {IMPORT_COLUMNS.join(', ')}. Prices in KSh.</span>
            </button>
            <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError(''); }} />
            {error && <p className="mt-3 text-[13px] text-error">{error}</p>}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2 mt-5">
              <button onClick={template} className="h-11 px-3 flex items-center gap-2 rounded-xl text-[14px] font-medium text-primary hover:bg-primary/5">
                <span className="material-symbols-outlined text-[20px]">download</span> Download template
              </button>
              <button onClick={upload} disabled={!file || busy} className="h-11 px-5 rounded-xl bg-brand-red text-white text-[14px] font-medium disabled:opacity-40">
                {busy ? 'Importing…' : 'Import'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Row "..." menu ---------- */

function RowMenu({ product, onView, onReview, onPublish }: {
  product: AdminProduct; onView: () => void; onReview: (d: ReviewDecision) => void; onPublish: (published: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss<HTMLDivElement>(open, close);
  const reviewable = product.status === 'Pending' || product.status === 'Changes Requested' || product.status === 'Rejected';
  const item = 'w-full flex items-center gap-3 px-4 h-10 text-[14px] text-on-surface hover:bg-surface-container-low';

  return (
    <div ref={ref} className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <button onClick={() => setOpen((o) => !o)} aria-label={`Actions for ${product.name}`} aria-expanded={open} className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface hover:bg-surface-container-high">
        <span className="material-symbols-outlined text-[22px]">more_horiz</span>
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-56 bg-white rounded-2xl border border-outline-variant/50 shadow-xl py-2 text-left">
          <button onClick={() => { close(); onView(); }} className={item}><span className="material-symbols-outlined text-[20px] text-on-surface-variant">visibility</span> View details</button>
          {reviewable && <button onClick={() => { close(); onReview('approve'); }} className={item}><span className="material-symbols-outlined text-[20px] text-green-700">check_circle</span> Approve &amp; Publish</button>}
          {reviewable && product.status !== 'Rejected' && <button onClick={() => { close(); onReview('reject'); }} className={item}><span className="material-symbols-outlined text-[20px] text-brand-red">cancel</span> Reject</button>}
          {reviewable && <button onClick={() => { close(); onReview('request-changes'); }} className={item}><span className="material-symbols-outlined text-[20px] text-on-surface-variant">chat</span> Request changes</button>}
          {!reviewable && (
            <button onClick={() => { close(); onPublish(product.status !== 'Live'); }} className={item}>
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">{product.status === 'Live' ? 'visibility_off' : 'visibility'}</span>
              {product.status === 'Live' ? 'Unpublish' : 'Publish'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Page ---------- */

export default function AdminInventory() {
  const { triggerToast } = useToast();
  useCurrencySettings(); // re-render when Settings > Currency changes
  const [initial] = useState(readUrl);
  const [view, setViewState] = useState<View>(initial.view);

  // Keep the address in sync so a refresh or shared link opens the same view
  const setView = (v: View) => {
    setViewState(v);
    const url = new URL(window.location.href);
    if (v === 'review') url.searchParams.delete('view'); else url.searchParams.set('view', v);
    window.history.replaceState(null, '', url);
  };

  const [tab, setTab] = useState<ProductTab>(initial.tab);
  const [searchInput, setSearchInput] = useState(initial.search);
  const [search, setSearch] = useState(initial.search);
  const [category, setCategory] = useState<string | 'All'>('All');
  const [sport, setSport] = useState<string | 'All'>('All');
  const [vendor, setVendor] = useState<string | 'All'>('All');
  const [status, setStatus] = useState<ProductStatus | 'All'>('All');
  const [sort, setSort] = useState<ProductQuery['sort']>({ key: 'submittedAt', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [reloadKey, setReloadKey] = useState(0);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState<{ ids: string[]; decision: Exclude<ReviewDecision, 'approve'> } | null>(null);
  const [importing, setImporting] = useState(false);

  // Waits until typing pauses before searching, and goes back to page 1
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const query: ProductQuery = useMemo(() => ({ tab, search, category, sport, vendor, status, sort, page, perPage }), [tab, search, category, sport, vendor, status, sort, page, perPage]);
  const queryKey = JSON.stringify(query) + reloadKey;

  /* List (the result remembers its query, so "loading" means "result is for an older query") */
  const [result, setResult] = useState<{ key: string; data: ProductListResult } | null>(null);
  const [listError, setListError] = useState<{ key: string; message: string } | null>(null);
  useEffect(() => {
    let cancelled = false;
    listProducts(query)
      .then((data) => { if (!cancelled) setResult({ key: queryKey, data }); })
      .catch((e) => { if (!cancelled) setListError({ key: queryKey, message: e?.message || 'Could not load products' }); });
    return () => { cancelled = true; };
  }, [query, queryKey]);
  const loading = result?.key !== queryKey && listError?.key !== queryKey;
  const error = listError?.key === queryKey ? listError.message : '';
  const data = result?.data;

  /* Summary cards (+ the real category count from the backend) */
  const [summary, setSummary] = useState<ProductSummary | null>(null);
  const [categoryCount, setCategoryCount] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    getProductSummary().then((s) => { if (!cancelled) setSummary(s); }).catch(() => {});
    return () => { cancelled = true; };
  }, [reloadKey]);
  useEffect(() => {
    let cancelled = false;
    api.getCategories()
      .then((c: unknown) => { if (!cancelled && Array.isArray(c)) setCategoryCount(c.length); })
      .catch(() => { if (!cancelled) setCategoryCount(PRODUCT_CATEGORIES.length); });
    return () => { cancelled = true; };
  }, [view]);

  /* Detail panel */
  const [detail, setDetail] = useState<{ key: string; product: AdminProduct | null; error: string } | null>(null);
  const detailKey = `${activeId}:${reloadKey}`;
  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    getProduct(activeId)
      .then((product) => { if (!cancelled) setDetail({ key: detailKey, product, error: '' }); })
      .catch((e) => { if (!cancelled) setDetail({ key: detailKey, product: null, error: e?.message || 'Could not load this product' }); });
    return () => { cancelled = true; };
  }, [activeId, detailKey]);
  const shownProduct = detail && detail.key.startsWith(`${activeId}:`) ? detail.product : null;

  /* Filters: every change goes back to page 1 */
  const withPageReset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1); };
  const onTab = withPageReset(setTab);
  const onCategory = withPageReset(setCategory);
  const onSport = withPageReset(setSport);
  const onVendor = withPageReset(setVendor);
  const onStatus = withPageReset(setStatus);
  const onPerPage = withPageReset(setPerPage);
  const filtersActive = search || category !== 'All' || sport !== 'All' || vendor !== 'All' || status !== 'All';
  const resetFilters = () => {
    setSearchInput(''); setSearch(''); setCategory('All'); setSport('All'); setVendor('All'); setStatus('All');
    setSort({ key: 'submittedAt', dir: 'desc' }); setPage(1); setSelected(new Set());
  };
  const onSort = (key: ProductSortKey) => {
    setSort((s) => (s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }));
    setPage(1);
  };

  /* Actions */
  const run = async (action: () => Promise<void>, message: string) => {
    setBusy(true);
    try {
      await action();
      triggerToast(message);
      setReloadKey((k) => k + 1);
    } catch {
      triggerToast('Something went wrong, please try again');
    } finally {
      setBusy(false);
    }
  };
  const names = (ids: string[]) => (ids.length === 1 ? (data?.rows.find((r) => r.id === ids[0])?.name ?? shownProduct?.name ?? '1 product') : `${ids.length} products`);

  // Approve right away; reject and request changes ask for a reason first
  const review = (ids: string[], decision: ReviewDecision, note?: string) => {
    if (decision !== 'approve' && note === undefined) { setAsking({ ids, decision }); return; }
    const label = names(ids);
    const done = { approve: `${label} approved and published`, reject: `${label} rejected`, 'request-changes': `Changes requested for ${label}` }[decision];
    return run(() => reviewProducts(ids, decision, note), done).then(() => setSelected(new Set()));
  };
  const publish = (id: string, published: boolean) =>
    run(() => setProductPublished(id, published), `${names([id])} ${published ? 'published' : 'unpublished'}`);

  /* Selection */
  const pageIds = data?.rows.map((p) => p.id) ?? [];
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
  const columns = 9;

  /* ---------- Backend-connected views ---------- */
  if (view !== 'review') {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8 flex flex-col gap-5">
        <div>
          <button onClick={() => setView('review')} className="flex items-center gap-1 text-[13px] text-primary font-medium hover:underline">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span> Back to Products
          </button>
          <h1 className="text-[28px] font-bold text-on-surface mt-2">{view === 'categories' ? 'Categories' : 'Live Catalog'}</h1>
          <p className="text-[14px] text-on-surface-variant">{view === 'categories' ? 'Add, rename and remove store categories.' : 'Products saved in the store database. Edit prices, stock and details here.'}</p>
        </div>
        {view === 'categories' ? <CategoriesSection /> : <ProductsSection />}
      </div>
    );
  }

  /* ---------- Review view (demo data) ---------- */
  const cards = [
    { key: 'live', label: 'Live Products', icon: 'shopping_bag', tint: 'bg-blue-50 text-blue-800', value: summary?.live, trend: summary?.liveChangePercent, onClick: () => { onStatus('Live'); onTab('All'); } },
    { key: 'pending', label: 'Pending Approval', icon: 'schedule', tint: 'bg-amber-100 text-amber-600', value: summary?.pending, highlight: true, onClick: () => { onStatus('All'); onTab('Pending'); } },
    { key: 'inactive', label: 'Inactive / Unpublished', icon: 'visibility_off', tint: 'bg-slate-100 text-slate-700', value: summary?.unpublished, onClick: () => { onStatus('All'); onTab('Unpublished'); } },
    { key: 'vendors', label: 'Total Vendors', icon: 'deployed_code', tint: 'bg-blue-50 text-blue-800', value: summary?.vendors, href: adminPath('/vendors') },
    { key: 'categories', label: 'Categories', icon: 'sell', tint: 'bg-slate-100 text-slate-700', value: categoryCount ?? undefined, onClick: () => setView('categories') },
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
                <span className="text-on-surface">Products</span>
              </nav>
              <h1 className="text-[30px] sm:text-[34px] font-bold text-on-surface leading-tight mt-1">Products</h1>
              <p className="text-[14px] text-on-surface-variant">Manage all products across vendors. Approve new products and keep the catalog up to date.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setView('catalog')} className="h-11 px-4 flex items-center gap-2 rounded-xl border border-outline-variant bg-white text-[14px] font-medium text-on-surface hover:bg-surface-container-low">
                <span className="material-symbols-outlined text-[20px]">inventory_2</span> Live Catalog
              </button>
              <Link href={adminPath('/inventory/new')} className="h-11 px-5 flex items-center gap-2 rounded-xl bg-brand-red text-white text-[14px] font-medium hover:bg-[#b8231d]">
                <span className="material-symbols-outlined text-[20px]">add</span> Add Product
              </Link>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
            {cards.map((c) => {
              const inner = (
                <>
                  <span className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${c.tint}`}>
                    <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>{c.icon}</span>
                  </span>
                  <span className="flex flex-col min-w-0">
                    <span className="text-[22px] font-bold text-on-surface leading-none tabular-nums">{c.value !== undefined ? c.value.toLocaleString('en-US') : '–'}</span>
                    <span className="text-[13px] text-on-surface-variant mt-1 leading-snug">{c.label}</span>
                    {c.trend !== undefined && (
                      <span className="flex items-center gap-0.5 text-[12px] font-semibold text-green-700 mt-0.5">
                        <span className="material-symbols-outlined text-[16px]">arrow_upward</span>{c.trend}%<span className="sr-only"> increase</span>
                      </span>
                    )}
                  </span>
                </>
              );
              const cls = `rounded-2xl border p-4 flex items-center gap-3 text-left transition-all hover:shadow-md ${c.highlight ? 'bg-amber-50/70 border-amber-200' : 'bg-white border-outline-variant/50'}`;
              return c.href
                ? <Link key={c.key} href={c.href} className={cls}>{inner}</Link>
                : <button key={c.key} onClick={c.onClick} className={cls}>{inner}</button>;
            })}
          </div>

          {/* Tabs + import */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div role="tablist" aria-label="Product lists" className="flex gap-1 overflow-x-auto">
              {TABS.map((t) => (
                <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => onTab(t.key)} className={`relative h-11 px-4 text-[14px] whitespace-nowrap ${tab === t.key ? 'text-brand-red font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`}>
                  {t.label} ({counts ? counts[t.key].toLocaleString('en-US') : '…'})
                  {tab === t.key && <span className="absolute left-2 right-2 bottom-0 h-0.5 rounded-full bg-brand-red" />}
                </button>
              ))}
            </div>
            <button onClick={() => setImporting(true)} className="h-11 px-4 flex items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white text-[14px] font-medium text-on-surface hover:bg-surface-container-low shrink-0">
              <span className="material-symbols-outlined text-[20px]">upload</span> Import Products
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 min-w-[200px] basis-full sm:basis-auto">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant pointer-events-none">search</span>
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search products..."
                aria-label="Search products by name, SKU, vendor or brand"
                className="h-11 w-full pl-10 pr-3 rounded-xl border border-outline-variant/70 bg-white text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </div>
            <FilterSelect label="Category" value={category} options={PRODUCT_CATEGORIES} onChange={onCategory} />
            <FilterSelect label="Sport" value={sport} options={PRODUCT_SPORTS} onChange={onSport} />
            <FilterSelect label="Vendor" value={vendor} options={PRODUCT_VENDORS} onChange={onVendor} />
            <FilterSelect label="Status" value={status} options={PRODUCT_STATUSES} onChange={onStatus} />
            <button onClick={resetFilters} disabled={!filtersActive} className="h-11 px-4 rounded-xl border border-outline-variant/70 bg-white text-[14px] font-medium text-primary hover:bg-primary/5 disabled:text-on-surface-variant/50 disabled:hover:bg-white">
              Reset
            </button>
          </div>

          {/* Bulk actions */}
          {selected.size > 0 && (
            <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl bg-brand-green-dark text-white">
              <span className="text-[14px] font-medium">{selected.size} selected</span>
              <button disabled={busy} onClick={() => review([...selected], 'approve')} className="h-10 px-4 rounded-xl bg-green-600 text-[14px] font-medium hover:bg-green-700 disabled:opacity-60">Approve &amp; Publish</button>
              <button disabled={busy} onClick={() => review([...selected], 'reject')} className="h-10 px-4 rounded-xl bg-brand-red text-[14px] font-medium disabled:opacity-60">Reject</button>
              <button disabled={busy} onClick={() => review([...selected], 'request-changes')} className="h-10 px-4 rounded-xl border border-white/30 text-[14px] hover:bg-white/10 disabled:opacity-60">Request changes</button>
              <button onClick={() => setSelected(new Set())} className="h-10 px-4 rounded-xl text-[14px] text-white/80 hover:text-white ml-auto">Clear selection</button>
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-2xl border border-outline-variant/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-[13px]">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant">
                    <th className="pl-4 pr-2 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allOnPage}
                        ref={(el) => { if (el) el.indeterminate = someOnPage && !allOnPage; }}
                        onChange={togglePage}
                        aria-label="Select all products on this page"
                        className="w-4 h-4 accent-[var(--color-primary)]"
                      />
                    </th>
                    <th className="font-semibold px-3 py-3">Product</th>
                    <th className="font-semibold px-3 py-3">Vendor</th>
                    <th className="font-semibold px-3 py-3">Category</th>
                    <SortHeader label="Price" sortKey="price" sort={sort} onSort={onSort} />
                    <SortHeader label="Stock" sortKey="stock" sort={sort} onSort={onSort} />
                    <SortHeader label="Submitted On" sortKey="submittedAt" sort={sort} onSort={onSort} />
                    <th className="font-semibold px-3 py-3">Status</th>
                    <th className="font-semibold px-3 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y divide-outline-variant/40 transition-opacity ${loading && data ? 'opacity-50' : ''}`}>
                  {error ? (
                    <tr><td colSpan={columns} className="px-4 py-12 text-center text-error">
                      {error} <button onClick={() => setReloadKey((k) => k + 1)} className="ml-2 underline">Try again</button>
                    </td></tr>
                  ) : !data ? (
                    Array.from({ length: 10 }).map((_, i) => <tr key={i}><td colSpan={columns} className="px-4 py-2"><Skeleton className="h-11" /></td></tr>)
                  ) : data.rows.length === 0 ? (
                    <tr><td colSpan={columns} className="px-4 py-16 text-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-[36px] block mb-2">inventory_2</span>
                      {tab === 'Pending' && !filtersActive ? 'No products are waiting for approval.' : 'No products match these filters.'}
                      {filtersActive && <button onClick={resetFilters} className="ml-1 text-primary font-medium hover:underline">Reset filters</button>}
                    </td></tr>
                  ) : data.rows.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => setActiveId(p.id)}
                      className={`cursor-pointer transition-colors ${activeId === p.id ? 'bg-primary/5' : selected.has(p.id) ? 'bg-surface-container-low/70' : 'hover:bg-surface-container-low/60'}`}
                    >
                      <td className="pl-4 pr-2 py-2" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} aria-label={`Select ${p.name}`} className="w-4 h-4 accent-[var(--color-primary)]" />
                      </td>
                      <td className="px-3 py-2">
                        <span className="flex items-center gap-3">
                          <ProductThumb icon={p.icon} size="sm" />
                          <span className="min-w-0">
                            <span className="block text-[13px] font-medium text-on-surface">{p.name}</span>
                            <span className="block text-[12px] text-on-surface-variant">SKU: {p.sku}</span>
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">{p.vendor}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{p.category}</td>
                      <td className="px-3 py-2 tabular-nums whitespace-nowrap">{formatMoney(p.price)}</td>
                      <td className={`px-3 py-2 tabular-nums ${p.stock === 0 ? 'text-error font-medium' : ''}`}>{p.stock === 0 ? 'Out of stock' : p.stock.toLocaleString('en-US')}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{formatDay(p.submittedAt)}</td>
                      <td className="px-3 py-2"><StatusBadge status={p.status} /></td>
                      <td className="px-3 py-1.5 text-center">
                        <RowMenu product={p} onView={() => setActiveId(p.id)} onReview={(d) => review([p.id], d)} onPublish={(pub) => publish(p.id, pub)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {data && <Pagination page={page} perPage={perPage} total={data.total} noun="products" onPage={setPage} onPerPage={onPerPage} />}
        </div>
      </div>

      {activeId && (
        <SidePanel label="Product details" onClose={() => setActiveId(null)}>
          <ProductDetailPanel
            key={activeId}
            product={shownProduct}
            loading={detail?.key !== detailKey && !shownProduct}
            error={detail?.key === detailKey ? detail.error : ''}
            busy={busy}
            onClose={() => setActiveId(null)}
            onReview={(d, note) => review([activeId], d, note)}
            onPublish={(pub) => publish(activeId, pub)}
          />
        </SidePanel>
      )}

      {asking && (
        <ReasonDialog
          decision={asking.decision}
          count={asking.ids.length}
          busy={busy}
          onCancel={() => setAsking(null)}
          onConfirm={(note) => { const a = asking; setAsking(null); review(a.ids, a.decision, note); }}
        />
      )}

      {importing && (
        <ImportDialog
          onClose={() => setImporting(false)}
          onDone={(r) => { if (r.added) { onTab('Pending'); setReloadKey((k) => k + 1); } }}
        />
      )}
    </div>
  );
}
