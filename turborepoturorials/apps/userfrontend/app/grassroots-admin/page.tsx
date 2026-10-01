"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminPath } from '../../services/adminRoutes';
import { DashboardData, DateRange, getDashboard } from '../../services/adminDashboard';
import { useCurrencySettings } from '../../services/currency';
import DashboardHeader, { defaultRange } from './_dashboard/DashboardHeader';
import StatCards from './_dashboard/StatCards';
import PendingApprovals from './_dashboard/PendingApprovals';
import SnapshotChart from './_dashboard/SnapshotChart';
import { LatestQuotations, OpenSupportQueries, RecentOrders } from './_dashboard/Tables';

// Demo data comes from services/adminDashboard.ts, swap those functions for API calls to go live
const QUICK_LINKS = [
  { title: 'View Detailed Analytics', text: 'Track sales, vendors, products, customers and more.', icon: 'bar_chart', tint: 'bg-surface-container-low text-brand-green-dark', href: adminPath('/analytics') },
  { title: 'Manage Platform Settings', text: 'Configure categories, policies, payment and more.', icon: 'settings', tint: 'bg-red-50 text-brand-red', href: adminPath('/settings') },
  { title: 'Support Vendors', text: 'Respond to vendor queries and keep operations smooth.', icon: 'forum', tint: 'bg-red-50 text-brand-red', href: adminPath('/vendor-support') },
];

export default function AdminDashboard() {
  useCurrencySettings(); // re-render when Settings > Currency changes
  const [range, setRange] = useState<DateRange>(defaultRange);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getDashboard(range)
      .then((d) => { if (!cancelled) { setData(d); setError(''); } })
      .catch((err) => { if (!cancelled) setError(err?.message || 'Could not load the dashboard'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [range, reloadKey]);

  const changeRange = (r: DateRange) => { setLoading(true); setRange(r); };
  const retry = () => { setLoading(true); setReloadKey((k) => k + 1); };

  // Small helper so each block can update its own list without reloading everything
  const patch = <K extends keyof DashboardData>(key: K) => (value: DashboardData[K]) =>
    setData((d) => (d ? { ...d, [key]: value } : d));

  // An approved or rejected product is no longer pending, so the stat card goes down by one
  const onProductReviewed = () => setData((d) => d && {
    ...d,
    stats: d.stats.map((s) => (s.key === 'pendingProductApprovals' ? { ...s, value: Math.max(0, s.value - 1) } : s)),
  });

  return (
    <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8 flex flex-col gap-6">
      <DashboardHeader range={range} onRangeChange={changeRange} />

      {error ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between rounded-2xl bg-red-50 border border-red-200 px-5 py-4 text-[14px] text-error">
          <span className="flex items-center gap-2"><span className="material-symbols-outlined">error</span>{error}</span>
          <button onClick={retry} className="h-9 px-4 rounded-lg bg-white border border-red-200 font-medium hover:bg-red-100">Try again</button>
        </div>
      ) : (
        <>
          <StatCards stats={data?.stats} loading={loading} />

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            <div className="xl:col-span-3 min-w-0">
              <RecentOrders orders={data?.recentOrders ?? []} setOrders={patch('recentOrders')} loading={loading} />
            </div>
            <div className="xl:col-span-2 min-w-0">
              <PendingApprovals
                products={data?.pendingProducts ?? []}
                vendors={data?.pendingVendors ?? []}
                setProducts={patch('pendingProducts')}
                setVendors={patch('pendingVendors')}
                onProductReviewed={onProductReviewed}
                loading={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 min-[1700px]:grid-cols-3 gap-6">
            <LatestQuotations quotations={data?.quotations ?? []} setQuotations={patch('quotations')} loading={loading} />
            <OpenSupportQueries queries={data?.supportQueries ?? []} setQueries={patch('supportQueries')} loading={loading} />
            <div className="lg:col-span-2 min-[1700px]:col-span-1 min-w-0">
              <SnapshotChart range={range} />
            </div>
          </div>
        </>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {QUICK_LINKS.map((q) => (
          <Link key={q.href} href={q.href} className="group flex items-center gap-4 bg-white rounded-2xl border border-outline-variant/50 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 hover:border-primary/40 hover:shadow-md transition-all">
            <span className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${q.tint}`}>
              <span className="material-symbols-outlined text-[30px]" style={{ fontVariationSettings: "'FILL' 1" }}>{q.icon}</span>
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[15px] font-semibold text-on-surface">{q.title}</span>
              <span className="block text-[13px] text-on-surface-variant mt-0.5">{q.text}</span>
            </span>
            <span className="material-symbols-outlined text-[22px] text-on-surface group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
