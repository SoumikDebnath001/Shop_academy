"use client";
import React from 'react';
import Link from 'next/link';
import { useAuth } from './AuthProvider';

export default function Header() {
  const { user, isLoading } = useAuth();

  return (
    <header className="fixed top-0 w-full z-50 pt-safe bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
      <div className="h-16 px-margin-mobile flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <Link href="/" aria-label="Obuya GrassRoots home">
            <img alt="Obuya GrassRoots Logo" className="h-10 w-10 object-contain" src="/obuya-grassroots-logo.png" />
          </Link>
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm text-on-surface leading-tight">Obuya GrassRoots</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant hidden">Home</span>
          </div>
        </div>
        <div className="flex items-center gap-space-xs">
          <button aria-label="Search" className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container-high/60 transition-colors focus:outline-none">
            <span className="material-symbols-outlined text-[22px]">search</span>
          </button>
          <div className="pl-space-2xs">
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-surface-container animate-pulse"></div>
            ) : user ? (
              <Link href="/profile">
                {user.picture ? (
                  <img src={user.picture} alt={user.name} referrerPolicy="no-referrer" className="w-8 h-8 rounded-full object-cover shadow-sm" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold shadow-sm">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
              </Link>
            ) : (
              <Link href="/auth" className="px-4 py-1.5 rounded-full bg-primary text-on-primary font-label-lg text-label-lg hover:bg-primary-container transition-colors">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
