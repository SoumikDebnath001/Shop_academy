// Single source of truth for store navigation, shared by the desktop header and the mobile bottom nav.
export interface NavLink {
  label: string;
  href: string;
  icon: string; // Material Symbols name
}

export const STORE_NAV: NavLink[] = [
  { label: 'Home', href: '/', icon: 'home' },
  { label: 'Sports', href: '/sports', icon: 'sports_cricket' },
  { label: 'Apparel', href: '/apparels', icon: 'apparel' },
];

export const isNavActive = (pathname: string | null, href: string) =>
  href === '/' ? pathname === '/' : pathname === href || !!pathname?.startsWith(`${href}/`);
