"use client";
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ADMIN_BASE_PATH, adminPath } from '../../../services/adminRoutes';
import { DateRange, formatMoney } from '../../../services/adminDashboard';
import {
  AnalyticsOverview, CountryRow, GrowthPoint, KpiKey, MonthlyTrendPoint, ProductRow, RankItem, RankMetric, TrendMonths, VendorRow,
  getAnalyticsOverview, getCustomerGrowth, getRevenueTrend, getSalesByCountry, getSalesBySport, getTopCategories, getTopProducts, getTopVendors,
} from '../../../services/adminAnalytics';
import { useToast } from '../../../components/ToastProvider';
import { currencyCode, moneyForCsv, useCurrencySettings } from '../../../services/currency';
import { DateRangePicker, GlobalSearch, NotificationBell, ProfileMenu, defaultRange } from '../_dashboard/DashboardHeader';
import { DataTable, Panel, Skeleton, useDismiss } from '../_dashboard/ui';
import {
  CUSTOMER_TYPE_COLORS, Donut, GrowthLines, Legend, MetricSelect, RankBars, RevenueOrdersTrend, SERIES_BLUE, SERIES_RED, STATUS_COLORS, STATUS_ORDER,
} from './_components/charts';

/* ---------- Loading helper: re-runs when its inputs change, ignores late answers ---------- */

function useData<T>(load: () => Promise<T>, deps: React.DependencyList) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); // eslint-disable-line react-hooks/set-state-in-effect -- shows the loading state for each new request
    load()
      .then((d) => { if (!cancelled) { setData(d); setError(''); } })
      .catch((e) => { if (!cancelled) setError(e?.message || 'Could not load this section'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the caller lists the inputs of `load`
  }, [...deps, attempt]);

  return { data, loading, error, retry: () => setAttempt((a) => a + 1) };
}

/* ---------- Options ---------- */

const MONTH_OPTIONS: { value: TrendMonths; label: string }[] = [
  { value: 6, label: 'Last 6 Months' }, { value: 9, label: 'Last 9 Months' }, { value: 12, label: 'Last 12 Months' },
];
const RANK_OPTIONS: { value: RankMetric; label: string }[] = [
  { value: 'revenue', label: 'By Revenue' }, { value: 'quantity', label: 'By Quantity' }, { value: 'orders', label: 'By Orders' },
];

const KPI_CARDS: Record<KpiKey, { label: string; icon: string; tint: string; money?: boolean }> = {
  orders: { label: 'Total Orders', icon: 'shopping_cart', tint: 'bg-blue-50 text-blue-700' },
  revenue: { label: 'Total Revenue', icon: 'payments', tint: 'bg-green-50 text-green-700', money: true },
  customers: { label: 'Total Customers', icon: 'groups', tint: 'bg-blue-50 text-blue-700' },
  vendors: { label: 'Active Vendors', icon: 'storefront', tint: 'bg-blue-50 text-blue-700' },
  products: { label: 'Total Products', icon: 'sell', tint: 'bg-red-50 text-brand-red' },
};

const icon = (name: string) => <span className="material-symbols-outlined text-[18px] text-on-surface-variant">{name}</span>;
const formatRank = (by: RankMetric, v: number) => (by === 'revenue' ? formatMoney(v) : `${v.toLocaleString('en-US')} ${by === 'quantity' ? 'units' : 'orders'}`);

/* ---------- Small building blocks ---------- */

function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="px-5 pb-5 flex flex-col items-center gap-2 py-8 text-center text-[13px] text-on-surface-variant">
      <span className="material-symbols-outlined text-error">error</span>
      {message}
      <button onClick={onRetry} className="h-8 px-3 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-low">Try again</button>
    </div>
  );
}

function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return <div className="px-5 pb-5 space-y-2">{Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-9" />)}</div>;
}

/* Export: a CSV of everything on the page, or the browser print dialog (Save as PDF) */
function ExportMenu({ onCsv }: { onCsv: () => void }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss<HTMLDivElement>(open, close);

  return (
    <div ref={ref} className="relative print:hidden">
      <div className="flex h-11 rounded-xl border border-outline-variant bg-white overflow-hidden">
        <button onClick={() => { onCsv(); setOpen(false); }} className="flex items-center gap-2 px-4 text-[14px] font-medium text-on-surface hover:bg-surface-container-low">
          <span className="material-symbols-outlined text-[20px]">download</span> Export Report
        </button>
        <button onClick={() => setOpen((o) => !o)} aria-label="More export options" aria-expanded={open} className="px-2.5 border-l border-outline-variant text-on-surface-variant hover:bg-surface-container-low">
          <span className="material-symbols-outlined text-[20px]">expand_more</span>
        </button>
      </div>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-56 bg-white rounded-2xl border border-outline-variant/50 shadow-xl py-2">
          <button onClick={() => { onCsv(); setOpen(false); }} className="w-full flex items-center gap-3 px-4 h-10 text-[14px] text-on-surface hover:bg-surface-container-low">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">table_view</span> Download CSV
          </button>
          <button onClick={() => { setOpen(false); setTimeout(() => window.print(), 50); }} className="w-full flex items-center gap-3 px-4 h-10 text-[14px] text-on-surface hover:bg-surface-container-low">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">picture_as_pdf</span> Print / Save as PDF
          </button>
        </div>
      )}
    </div>
  );
}

// Quotes commas and line breaks so the CSV opens correctly in Excel and Google Sheets
const csvCell = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/* ---------- Page ---------- */

export default function AdminAnalytics() {
  const { triggerToast } = useToast();
  useCurrencySettings(); // re-render when Settings > Currency changes
  const [range, setRange] = useState<DateRange>(defaultRange);
  const [trendMonths, setTrendMonths] = useState<TrendMonths>(9);
  const [growthMonths, setGrowthMonths] = useState<TrendMonths>(9);
  const [categoryBy, setCategoryBy] = useState<RankMetric>('revenue');
  const [sportBy, setSportBy] = useState<RankMetric>('revenue');
  const [vendorBy, setVendorBy] = useState<'revenue' | 'orders'>('revenue');
  const [productBy, setProductBy] = useState<'quantity' | 'revenue'>('quantity');
  const [countryBy, setCountryBy] = useState<'revenue' | 'orders'>('revenue');

  const overview = useData<AnalyticsOverview>(() => getAnalyticsOverview(range), [range]);
  const trend = useData<MonthlyTrendPoint[]>(() => getRevenueTrend(range, trendMonths), [range, trendMonths]);
  const growth = useData<GrowthPoint[]>(() => getCustomerGrowth(range, growthMonths), [range, growthMonths]);
  const categories = useData<RankItem[]>(() => getTopCategories(range, categoryBy), [range, categoryBy]);
  const sports = useData<RankItem[]>(() => getSalesBySport(range, sportBy), [range, sportBy]);
  const vendors = useData<VendorRow[]>(() => getTopVendors(range, vendorBy), [range, vendorBy]);
  const products = useData<ProductRow[]>(() => getTopProducts(range, productBy), [range, productBy]);
  const countries = useData<CountryRow[]>(() => getSalesByCountry(range, countryBy), [range, countryBy]);

  const exportCsv = () => {
    const cur = currencyCode();
    const rows: (string | number)[][] = [['Obuya Foundation Shop - Analytics report'], ['Period', range.from, range.to], ['Currency', cur], []];
    const section = (title: string, header: string[], body: (string | number)[][] | undefined) => {
      rows.push([title], header, ...(body ?? []), []);
    };
    section('Summary', ['Metric', 'Value', 'Change %'], overview.data?.kpis.map((k) => [KPI_CARDS[k.key].label, KPI_CARDS[k.key].money ? moneyForCsv(k.value) : k.value, k.changePercent]));
    section('Orders by status', ['Status', 'Orders'], overview.data?.ordersByStatus.map((s) => [s.key, s.count]));
    section('Orders by customer type', ['Type', 'Orders'], overview.data?.ordersByCustomerType.map((s) => [s.key, s.count]));
    section('Revenue and orders by month', ['Month', `Revenue (${cur})`, 'Orders'], trend.data?.map((p) => [p.month, moneyForCsv(p.revenue), p.orders]));
    section('Customer growth', ['Month', 'New customers', 'Total customers'], growth.data?.map((p) => [p.month, p.newCustomers, p.totalCustomers]));
    section(`Top categories (${categoryBy})`, ['Category', categoryBy === 'revenue' ? `revenue (${cur})` : categoryBy], categories.data?.map((c) => [c.label, categoryBy === 'revenue' ? moneyForCsv(c.value) : c.value]));
    section(`Sales by sport (${sportBy})`, ['Sport', sportBy === 'revenue' ? `revenue (${cur})` : sportBy], sports.data?.map((c) => [c.label, sportBy === 'revenue' ? moneyForCsv(c.value) : c.value]));
    section('Top vendors', ['Vendor', 'Orders', `Revenue (${cur})`], vendors.data?.map((v) => [v.name, v.orders, moneyForCsv(v.revenue)]));
    section('Top products', ['Product', 'Quantity sold', `Revenue (${cur})`], products.data?.map((p) => [p.name, p.quantity, moneyForCsv(p.revenue)]));
    section('Sales by country', ['Country', `Revenue (${cur})`, 'Orders'], countries.data?.map((c) => [c.name, moneyForCsv(c.revenue), c.orders]));

    const csv = rows.map((r) => r.map(csvCell).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${range.from}-to-${range.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast('Analytics report downloaded');
  };

  const statusSlices = overview.data
    ? STATUS_ORDER.map((key) => ({ label: key, color: STATUS_COLORS[key], count: overview.data!.ordersByStatus.find((s) => s.key === key)?.count ?? 0 }))
    : [];
  const typeSlices = overview.data?.ordersByCustomerType.map((s) => ({ label: s.key, color: CUSTOMER_TYPE_COLORS[s.key], count: s.count })) ?? [];
  const totalOrders = overview.data?.kpis.find((k) => k.key === 'orders')?.value ?? 0;

  return (
    <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8 flex flex-col gap-6">
      {/* Top bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 print:hidden">
        <div className="flex-1 md:max-w-xl"><GlobalSearch /></div>
        <div className="flex items-center gap-2 md:ml-auto">
          <div className="flex-1 md:flex-none"><DateRangePicker value={range} onChange={setRange} /></div>
          <NotificationBell />
          <ProfileMenu />
        </div>
      </div>

      {/* Title and KPIs */}
      <div className="grid grid-cols-1 gap-6">
        <div className="flex flex-col gap-5 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
            <div>
              <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[13px] text-on-surface-variant">
                <Link href={ADMIN_BASE_PATH} className="hover:text-primary hover:underline">Admin Panel</Link>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                <span className="text-on-surface">Analytics</span>
              </nav>
              <h1 className="text-[30px] sm:text-[34px] font-bold text-on-surface leading-tight mt-1">Analytics</h1>
          </div>
            <ExportMenu onCsv={exportCsv} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            {overview.loading && !overview.data
              ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[104px] rounded-2xl" />)
              : overview.data?.kpis.map((k) => {
                const card = KPI_CARDS[k.key];
                const up = k.changePercent >= 0;
                return (
                  <div key={k.key} className={`bg-white rounded-2xl border border-outline-variant/50 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 flex gap-3 transition-opacity ${overview.loading ? 'opacity-50' : ''}`}>
                    <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${card.tint}`}>
                      <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>{card.icon}</span>
                    </span>
                    <span className="flex flex-col min-w-0">
                      <span className="text-[20px] font-bold text-on-surface leading-tight tabular-nums truncate">{card.money ? formatMoney(k.value) : k.value.toLocaleString('en-US')}</span>
                      <span className="text-[13px] text-on-surface-variant">{card.label}</span>
                      <span className={`flex items-center gap-0.5 mt-1 text-[13px] font-semibold ${up ? 'text-green-700' : 'text-brand-red'}`}>
                        <span className="material-symbols-outlined text-[16px]">{up ? 'arrow_upward' : 'arrow_downward'}</span>
                        {Math.abs(k.changePercent)}%<span className="sr-only">{up ? 'increase' : 'decrease'}</span>
                      </span>
                      <span className="text-[11px] text-on-surface-variant/80">vs. previous period</span>
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
        <Panel title="Revenue & Orders Trend" action={<MetricSelect label="Trend period" value={trendMonths} options={MONTH_OPTIONS} onChange={setTrendMonths} />}>
          <div className="px-5 pb-2"><Legend items={[{ color: SERIES_RED, label: 'Revenue' }, { color: SERIES_BLUE, label: 'Orders', line: true }]} /></div>
          {trend.error ? <SectionError message={trend.error} onRetry={trend.retry} />
            : !trend.data ? <div className="px-5 pb-5"><Skeleton className="h-[280px]" /></div>
            : <div className={trend.loading ? 'opacity-50 transition-opacity' : ''}><RevenueOrdersTrend points={trend.data} /></div>}
        </Panel>

        <Panel title="Orders by Status" viewAllHref={adminPath('/orders')}>
          {overview.error ? <SectionError message={overview.error} onRetry={overview.retry} />
            : !overview.data ? <div className="px-5 pb-5"><Skeleton className="h-[168px]" /></div>
            : <Donut slices={statusSlices} centerCaption="Total Orders" />}
        </Panel>

        <Panel title="Top Selling Categories" action={<MetricSelect label="Rank categories" value={categoryBy} options={RANK_OPTIONS} onChange={setCategoryBy} />}>
          {categories.error ? <SectionError message={categories.error} onRetry={categories.retry} />
            : !categories.data ? <ListSkeleton rows={6} />
            : <RankBars loading={categories.loading} rows={categories.data.map((c) => ({ id: c.id, label: c.label, icon: icon(c.icon), value: c.value, display: formatRank(categoryBy, c.value) }))} />}
        </Panel>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
        <Panel title="Sales by Sport" action={<MetricSelect label="Rank sports" value={sportBy} options={RANK_OPTIONS} onChange={setSportBy} />}>
          {sports.error ? <SectionError message={sports.error} onRetry={sports.retry} />
            : !sports.data ? <ListSkeleton rows={6} />
            : <RankBars loading={sports.loading} rows={sports.data.map((c) => ({ id: c.id, label: c.label, icon: icon(c.icon), value: c.value, display: formatRank(sportBy, c.value) }))} />}
        </Panel>

        <Panel
          title="Top Vendors"
          action={<MetricSelect label="Rank vendors" value={vendorBy} options={[{ value: 'revenue', label: 'By Revenue' }, { value: 'orders', label: 'By Orders' }]} onChange={setVendorBy} />}
        >
          {vendors.error ? <SectionError message={vendors.error} onRetry={vendors.retry} />
            : !vendors.data ? <ListSkeleton />
            : (
              <div className={vendors.loading ? 'opacity-50 transition-opacity' : ''}>
                <DataTable columns={['#', 'Vendor', 'Orders', 'Revenue']} minWidth={380}>
                  {vendors.data.map((v, i) => (
                    <tr key={v.id}>
                      <td className="px-3 py-2.5 text-on-surface-variant tabular-nums">{i + 1}</td>
                      <td className="px-3 py-2.5">
                        <span className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-md bg-brand-black text-white text-[11px] font-semibold flex items-center justify-center shrink-0">
                            {v.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                          <span className="text-on-surface whitespace-nowrap">{v.name}</span>
                        </span>
                      </td>
                      <td className={`px-3 py-2.5 tabular-nums ${vendorBy === 'orders' ? 'font-semibold text-on-surface' : ''}`}>{v.orders.toLocaleString('en-US')}</td>
                      <td className={`px-3 py-2.5 tabular-nums whitespace-nowrap ${vendorBy === 'revenue' ? 'font-semibold text-on-surface' : ''}`}>{formatMoney(v.revenue)}</td>
                    </tr>
                  ))}
                </DataTable>
                <div className="px-5 pb-4 -mt-1 flex justify-end">
                  <Link href={adminPath('/vendors')} className="flex items-center gap-1 text-[13px] font-medium text-primary hover:underline">View All Vendors <span className="material-symbols-outlined text-[18px]">arrow_forward</span></Link>
                </div>
              </div>
            )}
        </Panel>

        <Panel
          title="Top Products"
          action={<MetricSelect label="Rank products" value={productBy} options={[{ value: 'quantity', label: 'By Quantity' }, { value: 'revenue', label: 'By Revenue' }]} onChange={setProductBy} />}
        >
          {products.error ? <SectionError message={products.error} onRetry={products.retry} />
            : !products.data ? <ListSkeleton />
            : (
              <div className={products.loading ? 'opacity-50 transition-opacity' : ''}>
                <ul className="px-5 divide-y divide-outline-variant/40">
                  {products.data.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 py-2">
                      <span className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[22px] text-on-surface-variant">{p.icon}</span>
                      </span>
                      <span className="flex-1 min-w-0 text-[13px] text-on-surface truncate">{p.name}</span>
                      <span className="text-[13px] text-on-surface-variant tabular-nums whitespace-nowrap">
                        {productBy === 'quantity' ? `${p.quantity.toLocaleString('en-US')} sold` : formatMoney(p.revenue)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="px-5 py-4 flex justify-end">
                  <Link href={adminPath('/inventory')} className="flex items-center gap-1 text-[13px] font-medium text-primary hover:underline">View All Products <span className="material-symbols-outlined text-[18px]">arrow_forward</span></Link>
                </div>
              </div>
            )}
        </Panel>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
        <Panel title="Customer Growth" action={<MetricSelect label="Growth period" value={growthMonths} options={MONTH_OPTIONS} onChange={setGrowthMonths} />}>
          <div className="px-5 pb-2"><Legend items={[{ color: SERIES_RED, label: 'New Customers', line: true }, { color: SERIES_BLUE, label: 'Total Customers', line: true }]} /></div>
          {growth.error ? <SectionError message={growth.error} onRetry={growth.retry} />
            : !growth.data ? <div className="px-5 pb-5"><Skeleton className="h-[190px]" /></div>
            : <div className={growth.loading ? 'opacity-50 transition-opacity' : ''}><GrowthLines points={growth.data} /></div>}
        </Panel>

        <Panel title="Orders by Customer Type" viewAllHref={adminPath('/customers')}>
          {overview.error ? <SectionError message={overview.error} onRetry={overview.retry} />
            : !overview.data ? <div className="px-5 pb-5"><Skeleton className="h-[168px]" /></div>
            : <Donut slices={typeSlices} centerCaption="Total Orders" />}
        </Panel>

        <Panel
          title="Sales by Country"
          action={<MetricSelect label="Rank countries" value={countryBy} options={[{ value: 'revenue', label: 'By Revenue' }, { value: 'orders', label: 'By Orders' }]} onChange={setCountryBy} />}
        >
          {countries.error ? <SectionError message={countries.error} onRetry={countries.retry} />
            : !countries.data ? <ListSkeleton />
            : (
              <RankBars
                loading={countries.loading}
                rows={countries.data.map((c) => ({
                  id: c.code,
                  label: c.name,
                  icon: <span className="text-[10px] font-bold text-on-surface-variant">{c.code}</span>,
                  value: c[countryBy],
                  display: countryBy === 'revenue' ? formatMoney(c.revenue) : `${c.orders.toLocaleString('en-US')} orders`,
                }))}
              />
            )}
        </Panel>
      </div>

      <footer className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[12px] text-on-surface-variant">
        <span>
          Last updated: {overview.data ? new Date(overview.data.updatedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '…'}
          {' · '}{totalOrders.toLocaleString('en-US')} orders in this period
        </span>
      </footer>
    </div>
  );
}
