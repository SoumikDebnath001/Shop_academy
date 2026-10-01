"use client";
import React from 'react';
import Link from 'next/link';
import { ADMIN_BASE_PATH, adminPath } from '../../services/adminRoutes';

// Every admin section. Add a new entry here and a matching folder in app/grassroots-admin
const NAV_GROUPS = [
  {
    title: 'Store',
    items: [
      { label: 'Dashboard', href: ADMIN_BASE_PATH, icon: 'dashboard' },
      { label: 'Orders', href: adminPath('/orders'), icon: 'receipt_long' },
      { label: 'Inventory', href: adminPath('/inventory'), icon: 'inventory_2' },
    ],
  },
  {
    title: 'People',
    items: [
      { label: 'Vendors', href: adminPath('/vendors'), icon: 'storefront' },
      { label: 'Customers', href: adminPath('/customers'), icon: 'group' },
      { label: 'Quotations', href: adminPath('/quotations'), icon: 'request_quote' },
      { label: 'Vendor Support', href: adminPath('/vendor-support'), icon: 'support_agent' },
    ],
  },
  {
    title: 'Insights',
    items: [
      { label: 'Analytics', href: adminPath('/analytics'), icon: 'monitoring' },
      { label: 'Settings', href: adminPath('/settings'), icon: 'settings' },
    ],
  },
];

// Dashboard only matches its exact URL, other sections also match their sub pages (e.g. /inventory/new)
const isActive = (pathname: string | null, href: string) =>
  href === ADMIN_BASE_PATH ? pathname === href : pathname === href || !!pathname?.startsWith(`${href}/`);

type Props = {
  pathname: string | null;
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
};

export default function AdminSidebar({ pathname, open, onClose, onLogout }: Props) {
  return (
    <>
      {/* Dark overlay behind the drawer on phones */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`print:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      <aside
        className={`print:hidden fixed inset-y-0 left-0 z-50 w-72 lg:w-64 flex flex-col bg-brand-green-dark text-white pt-safe pb-safe shadow-[4px_0_24px_rgba(15,59,36,0.25)] lg:shadow-none transition-transform duration-300 ease-out lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Admin navigation"
      >
        {/* Brand */}
        <div className="h-20 px-5 flex items-center justify-between border-b border-white/10 shrink-0">
          <Link href={ADMIN_BASE_PATH} className="flex items-center gap-3">
            <img alt="Obuya GrassRoots Logo" className="h-10 w-10 object-contain" src="/obuya-grassroots-logo.png" />
            <div className="flex flex-col">
              <span className="font-semibold text-[15px] tracking-tight leading-none">Obuya GrassRoots</span>
              <span className="text-[11px] text-brand-gold uppercase tracking-wider mt-1">Admin Console</span>
            </div>
          </Link>
          <button onClick={onClose} aria-label="Close menu" className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Sections */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="px-3 mb-2 text-[11px] font-medium uppercase tracking-wider text-white/40">{group.title}</p>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        aria-current={active ? 'page' : undefined}
                        className={`relative flex items-center gap-3 h-11 px-3 rounded-xl text-[14px] transition-colors ${active ? 'bg-brand-gold/15 text-brand-gold font-medium' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
                      >
                        {active && <span className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full bg-brand-gold" />}
                        <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer actions */}
        <div className="px-3 py-4 border-t border-white/10 space-y-1 shrink-0">
          <Link href="/" className="flex items-center gap-3 h-11 px-3 rounded-xl text-[14px] text-white/70 hover:bg-white/5 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[22px]">open_in_new</span>
            Back to Storefront
          </Link>
          <button onClick={onLogout} className="w-full flex items-center gap-3 h-11 px-3 rounded-xl text-[14px] text-white/70 hover:bg-brand-red/15 hover:text-[#ff8a84] transition-colors">
            <span className="material-symbols-outlined text-[22px]">logout</span>
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

// Page title for the phone header, taken from the active section
export const activeSectionLabel = (pathname: string | null) =>
  NAV_GROUPS.flatMap((group) => group.items).find((item) => isActive(pathname, item.href))?.label ?? 'Admin';
