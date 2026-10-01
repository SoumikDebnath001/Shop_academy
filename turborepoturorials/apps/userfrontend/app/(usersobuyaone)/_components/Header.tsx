"use client";
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Icon from '@/components/Icon';
import UserAvatar from './UserAvatar';
import DesktopSearch from './search/DesktopSearch';
import MobileSearch from './search/MobileSearch';
import { useTheme } from '@/components/useTheme';
import { STORE_NAV, isNavActive } from './navigation';
import { useCart } from './shop/CartProvider';

const iconBtn =
  'relative w-10 h-10 flex items-center justify-center rounded-full text-obuya-ink hover:bg-obuya-ink/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-obuya-gold';

function Brand() {
  return (
    <Link href="/" aria-label="Obuya One home" className="flex items-center gap-2.5 shrink-0">
      <Image src="/logo-shop.png" alt="" width={40} height={40} priority className="h-10 w-10 md:h-9 md:w-9 rounded-full object-contain" />
      <span className="font-headline-sm text-[24px] md:text-[23px] font-bold leading-none text-obuya-ink">
        Obuya <span className="text-obuya-gold">One</span>
      </span>
    </Link>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button type="button" onClick={toggleTheme} aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} className={iconBtn}>
      <Icon name={isDark ? 'light_mode' : 'dark_mode'} />
    </button>
  );
}

// Opens the slide-in cart; the badge counts every unit (for you + donations).
function CartButton() {
  const { cart, openCart } = useCart();
  const count = cart?.itemCount ?? 0;
  return (
    <button type="button" onClick={openCart} aria-label={count ? `Open cart, ${count} items` : 'Open cart'} className={iconBtn}>
      <Icon name="shopping_cart" />
      {count > 0 && (
        <span className="absolute top-0.5 right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-obuya-gold text-[10px] font-bold leading-[17px] text-center text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}

function AccountButton() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="w-9 h-9 rounded-full bg-obuya-ink/10 animate-pulse" />;
  if (!user) {
    return (
      <Link href="/auth" aria-label="Sign in" className={iconBtn}>
        <Icon name="person" />
      </Link>
    );
  }
  return (
    <Link href="/profile" aria-label="Your profile" className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-obuya-gold">
      <UserAvatar name={user.name} picture={user.picture} size={36} />
    </Link>
  );
}

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 inset-x-0 z-50 pt-safe bg-obuya-glass backdrop-blur-xl border-b border-obuya-line">
      {/* Mobile: brand + quick actions. Section links live in the bottom nav. */}
      <div className="md:hidden h-16 px-margin-mobile flex items-center justify-between">
        <Brand />
        <div className="flex items-center gap-1">
          <MobileSearch />
          <ThemeToggle />
          <CartButton />
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:grid grid-cols-[1fr_auto_1fr] items-center h-[70px] max-w-[1328px] mx-auto px-6">
        <Brand />
        <nav aria-label="Main" className="flex items-center gap-8">
          {STORE_NAV.map(({ label, href }) => {
            const active = isNavActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`relative py-2 text-[15px] font-medium transition-colors ${active ? 'text-obuya-gold' : 'text-obuya-ink hover:text-obuya-gold'}`}
              >
                {label}
                {active && <span className="absolute -bottom-1 inset-x-0 h-[2px] rounded-full bg-obuya-gold" />}
              </Link>
            );
          })}
          <DesktopSearch />
        </nav>
        <div className="flex items-center justify-end gap-3">
          <ThemeToggle />
          <Link href="/wishlist" aria-label="Wishlist" className={iconBtn}>
            <Icon name="favorite" />
          </Link>
          <AccountButton />
          <CartButton />
        </div>
      </div>
    </header>
  );
}
