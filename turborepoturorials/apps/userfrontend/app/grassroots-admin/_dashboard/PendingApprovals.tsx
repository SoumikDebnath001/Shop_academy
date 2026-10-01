"use client";
import React, { useState } from 'react';
import { adminPath } from '../../../services/adminRoutes';
import { PendingProduct, PendingVendor, formatDate, formatMoney, reviewProduct, reviewVendor } from '../../../services/adminDashboard';
import { useToast } from '../../../components/ToastProvider';
import { Panel, Skeleton } from './ui';

type Tab = 'products' | 'vendors';
type Decision = 'approve' | 'reject';

function ReviewButtons({ busy, onDecide }: { busy: boolean; onDecide: (d: Decision) => void }) {
  return (
    <div className="flex gap-2 shrink-0">
      <button disabled={busy} onClick={() => onDecide('approve')} className="h-9 px-4 rounded-lg bg-primary text-white text-[13px] font-medium hover:bg-primary-container disabled:opacity-50 transition-colors">Approve</button>
      <button disabled={busy} onClick={() => onDecide('reject')} className="h-9 px-4 rounded-lg bg-red-50 text-brand-red border border-red-200 text-[13px] font-medium hover:bg-red-100 disabled:opacity-50 transition-colors">Reject</button>
    </div>
  );
}

export default function PendingApprovals({ products, vendors, setProducts, setVendors, onProductReviewed, loading }: {
  products: PendingProduct[]; vendors: PendingVendor[];
  setProducts: (p: PendingProduct[]) => void; setVendors: (v: PendingVendor[]) => void;
  onProductReviewed: () => void; loading: boolean;
}) {
  const { triggerToast } = useToast();
  const [tab, setTab] = useState<Tab>('products');
  const [busyId, setBusyId] = useState<string | null>(null);

  const decideProduct = async (p: PendingProduct, d: Decision) => {
    setBusyId(p.id);
    try {
      await reviewProduct(p.id, d);
      setProducts(products.filter((x) => x.id !== p.id));
      onProductReviewed();
      triggerToast(`${p.name} ${d === 'approve' ? 'approved' : 'rejected'}`);
    } catch {
      triggerToast(`Could not update ${p.name}`);
    } finally {
      setBusyId(null);
    }
  };

  const decideVendor = async (v: PendingVendor, d: Decision) => {
    setBusyId(v.id);
    try {
      await reviewVendor(v.id, d);
      setVendors(vendors.filter((x) => x.id !== v.id));
      triggerToast(`${v.name} ${d === 'approve' ? 'approved' : 'rejected'}`);
    } catch {
      triggerToast(`Could not update ${v.name}`);
    } finally {
      setBusyId(null);
    }
  };

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'products', label: 'Products', count: products.length },
    { key: 'vendors', label: 'Vendors', count: vendors.length },
  ];

  return (
    <Panel title="Pending Approvals" viewAllHref={tab === 'products' ? adminPath('/inventory?status=pending') : adminPath('/vendors?status=pending')}>
      <div role="tablist" className="flex gap-1 px-5 border-b border-outline-variant/50">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`relative h-10 px-3 text-[13px] font-medium transition-colors ${tab === t.key ? 'text-brand-red' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            {t.label} ({loading ? '…' : t.count})
            {tab === t.key && <span className="absolute left-0 right-0 -bottom-px h-0.5 rounded-full bg-brand-red" />}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-5 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <ul className="divide-y divide-outline-variant/40 px-5 pb-2 max-h-[340px] overflow-y-auto">
          {tab === 'products' && (products.length === 0 ? (
            <li className="py-10 text-center text-[13px] text-on-surface-variant">No products waiting for approval</li>
          ) : products.map((p) => (
            <li key={p.id} className="flex flex-col sm:flex-row sm:items-center gap-3 py-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="w-14 h-14 rounded-xl bg-surface-container-low flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[28px] text-on-surface-variant">{p.image}</span>
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-on-surface truncate">{p.name}</p>
                  <p className="text-[12px] text-on-surface-variant truncate">By {p.vendor} · {formatMoney(p.price)}</p>
                  <p className="text-[12px] text-on-surface-variant">{p.reason} · {formatDate(p.submittedOn)}</p>
                </div>
              </div>
              <ReviewButtons busy={busyId === p.id} onDecide={(d) => decideProduct(p, d)} />
            </li>
          )))}

          {tab === 'vendors' && (vendors.length === 0 ? (
            <li className="py-10 text-center text-[13px] text-on-surface-variant">No vendors waiting for approval</li>
          ) : vendors.map((v) => (
            <li key={v.id} className="flex flex-col sm:flex-row sm:items-center gap-3 py-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="w-14 h-14 rounded-xl bg-surface-container-low flex items-center justify-center shrink-0 text-[20px] font-semibold text-primary">
                  {v.name.charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-on-surface truncate">{v.name}</p>
                  <p className="text-[12px] text-on-surface-variant truncate">{v.contact} · {v.email}</p>
                  <p className="text-[12px] text-on-surface-variant">{v.category} · Applied {formatDate(v.appliedOn)}</p>
                </div>
              </div>
              <ReviewButtons busy={busyId === v.id} onDecide={(d) => decideVendor(v, d)} />
            </li>
          )))}
        </ul>
      )}
    </Panel>
  );
}
