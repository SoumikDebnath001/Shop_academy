"use client";
import React from 'react';
import Link from 'next/link';
import { adminPath } from '../../../services/adminRoutes';
import { Stat, StatKey } from '../../../services/adminDashboard';
import { Skeleton } from './ui';

// goodWhenUp decides the arrow color: more orders is good, more pending work is not
const CARDS: Record<StatKey, { label: string; icon: string; tint: string; href: string; goodWhenUp: boolean }> = {
  totalOrders: { label: 'Total Orders', icon: 'shopping_cart', tint: 'bg-red-50 text-brand-red', href: adminPath('/orders'), goodWhenUp: true },
  pendingVendorAck: { label: 'Pending Vendor Acknowledgement', icon: 'package_2', tint: 'bg-amber-50 text-amber-600', href: adminPath('/orders?status=awaiting-vendor'), goodWhenUp: false },
  pendingDispatch: { label: 'Pending Dispatch', icon: 'local_shipping', tint: 'bg-blue-50 text-blue-600', href: adminPath('/orders?status=pending-dispatch'), goodWhenUp: false },
  pendingQuotations: { label: 'Pending Quotations', icon: 'account_balance', tint: 'bg-green-50 text-primary', href: adminPath('/quotations'), goodWhenUp: true },
  pendingProductApprovals: { label: 'Pending Product Approvals', icon: 'groups', tint: 'bg-violet-50 text-violet-600', href: adminPath('/inventory?status=pending'), goodWhenUp: false },
  openSupportQueries: { label: 'Open Vendor Support Queries', icon: 'warning', tint: 'bg-red-50 text-brand-red', href: adminPath('/vendor-support'), goodWhenUp: false },
};

export default function StatCards({ stats, loading }: { stats: Stat[] | undefined; loading: boolean }) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 2xl:grid-cols-6 gap-3 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[132px] rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 2xl:grid-cols-6 gap-3 sm:gap-4">
      {stats.map((s) => {
        const card = CARDS[s.key];
        const up = s.changePercent >= 0;
        const good = up === card.goodWhenUp;
        return (
          <Link
            key={s.key}
            href={card.href}
            className="group bg-white rounded-2xl border border-outline-variant/50 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 sm:p-5 flex flex-col sm:flex-row gap-3 hover:border-primary/40 hover:shadow-md transition-all"
          >
            <span className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shrink-0 ${card.tint}`}>
              <span className="material-symbols-outlined text-[26px] sm:text-[30px]" style={{ fontVariationSettings: "'FILL' 1" }}>{card.icon}</span>
            </span>
            <span className="flex flex-col min-w-0">
              <span className="text-[26px] sm:text-[28px] font-bold leading-none text-on-surface tabular-nums">{s.value.toLocaleString('en-US')}</span>
              <span className="text-[13px] text-on-surface-variant mt-1.5 leading-snug">{card.label}</span>
              <span className={`flex items-center gap-0.5 mt-1.5 text-[13px] font-semibold ${good ? 'text-green-700' : 'text-brand-red'}`}>
                <span className="material-symbols-outlined text-[16px]">{up ? 'arrow_upward' : 'arrow_downward'}</span>
                {Math.abs(s.changePercent)}%
                <span className="sr-only">{up ? 'increase' : 'decrease'}</span>
              </span>
              <span className="text-[11px] text-on-surface-variant/80">vs last period</span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
