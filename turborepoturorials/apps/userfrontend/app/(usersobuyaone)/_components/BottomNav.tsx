"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Icon from '@/components/Icon';
import { STORE_NAV, isNavActive, type NavLink } from './navigation';

// Mobile only: desktop shows these links in the header.
export default function BottomNav() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  const tabs: NavLink[] = [
    ...STORE_NAV,
    { label: 'Profile', href: isAuthenticated ? '/profile' : '/auth', icon: 'person' },
  ];
  const activeIndex = tabs.findIndex((tab) => isNavActive(pathname, tab.href));
  const tabWidth = `((100% - 16px) / ${tabs.length})`;

  return (
    <nav aria-label="Main" className="md:hidden fixed bottom-5 inset-x-0 z-50 pb-safe px-margin-mobile">
      <div className="relative mx-auto max-w-[480px] h-16 px-2 flex items-center rounded-full bg-obuya-glass backdrop-blur-xl border border-obuya-line/60 shadow-[0_10px_30px_rgba(122,29,46,0.14)]">
        {/* Sliding active pill; hidden on pages that are not a tab (cart, product, ...) */}
        {activeIndex !== -1 && (
          <span
            aria-hidden
            className="absolute top-2 bottom-2 rounded-full bg-obuya-maroon shadow-[0_4px_12px_rgba(122,29,46,0.35)] transition-[left] duration-300 ease-out"
            style={{ width: `calc${tabWidth}`, left: `calc(8px + ${activeIndex} * ${tabWidth})` }}
          />
        )}
        {tabs.map((tab, index) => {
          const active = index === activeIndex;
          return (
            <Link
              key={tab.label}
              href={tab.href}
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
              className={`relative z-10 flex-1 h-full flex items-center justify-center transition-colors duration-300 ${active ? 'text-obuya-gold' : 'text-obuya-ink/80 hover:text-obuya-gold'}`}
            >
              <Icon name={tab.icon} size={26} filled={active} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
