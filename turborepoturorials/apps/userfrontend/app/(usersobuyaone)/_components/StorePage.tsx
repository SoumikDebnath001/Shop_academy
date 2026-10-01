import Link from 'next/link';
import React from 'react';
import Icon from '@/components/Icon';

// Page shell for the redesigned store pages: theme colours, room for the fixed header and the mobile bottom nav,
// and the same 1328px column as the header so content lines up with the logo.
export function StorePage({ children }: { children: React.ReactNode }) {
  return (
    <main className="obuya-page flex-1 min-h-screen bg-obuya-bg text-obuya-ink pt-[88px] md:pt-[94px] pb-12 md:pb-20">
      <div className="max-w-[1328px] mx-auto px-margin-mobile md:px-6">{children}</div>
    </main>
  );
}

export interface Crumb {
  label: string;
  href?: string; // omitted for the current page
}

export function Breadcrumbs({ crumbs, className = '' }: { crumbs: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1 text-[13px] text-obuya-muted">
        {crumbs.map((crumb, i) => (
          <li key={`${crumb.label}-${i}`} className="flex items-center gap-1 min-w-0">
            {i > 0 && <Icon name="chevron_right" size={16} />}
            {crumb.href ? (
              <Link href={crumb.href} className="hover:text-obuya-gold transition-colors">{crumb.label}</Link>
            ) : (
              <span aria-current="page" className="text-obuya-ink truncate">{crumb.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHeader({ title, crumbs }: { title: string; crumbs?: Crumb[] }) {
  return (
    <header className="mb-6 md:mb-7">
      {crumbs && <Breadcrumbs crumbs={crumbs} className="mb-3" />}
      <h1 className="font-headline-lg text-[30px] md:text-[36px] font-bold leading-tight">{title}</h1>
      <span aria-hidden className="block mt-3 h-[3px] w-[46px] rounded-full bg-linear-to-r from-obuya-maroon to-obuya-gold" />
    </header>
  );
}
