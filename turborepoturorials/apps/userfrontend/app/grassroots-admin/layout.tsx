"use client";
import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '../../services/api';
import { ADMIN_LOGIN_PATH } from '../../services/adminRoutes';
import AdminSidebar, { activeSectionLabel } from './AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === ADMIN_LOGIN_PATH;
  const [sessionChecked, setSessionChecked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Every admin page (except login) needs a valid admin session from the server
  useEffect(() => {
    if (isLoginPage) {
      setSessionChecked(false);
      return;
    }
    let cancelled = false;
    api.adminMe()
      .then(() => { if (!cancelled) setSessionChecked(true); })
      .catch(() => { if (!cancelled) router.replace(ADMIN_LOGIN_PATH); });
    return () => { cancelled = true; };
  }, [pathname, isLoginPage, router]);

  // Close the phone menu with Escape, and stop the page behind it from scrolling while open
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    try {
      await api.adminLogout();
    } finally {
      router.replace(ADMIN_LOGIN_PATH);
    }
  };

  if (isLoginPage) {
    return (
      <div className="bg-surface font-body-md text-body-md text-on-surface flex flex-col min-h-screen">
        <main className="flex-1 flex flex-col relative w-full bg-surface min-h-screen">{children}</main>
      </div>
    );
  }

  if (!sessionChecked) {
    return (
      <div className="bg-surface flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface min-h-screen">
      <AdminSidebar pathname={pathname} open={menuOpen} onClose={() => setMenuOpen(false)} onLogout={handleLogout} />

      {/* Phone header, the sidebar is always visible on large screens */}
      <header className="print:hidden lg:hidden fixed top-0 inset-x-0 z-30 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-4 flex items-center gap-3">
          <button onClick={() => setMenuOpen(true)} aria-label="Open menu" className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>
          <span className="font-semibold text-[17px] text-on-surface truncate">{activeSectionLabel(pathname)}</span>
          <img alt="Obuya GrassRoots Logo" className="h-9 w-9 object-contain ml-auto" src="/obuya-grassroots-logo.png" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex flex-col w-full min-h-screen pt-16 lg:pt-0 lg:pl-64 print:p-0 bg-surface">
        {children}
      </main>
    </div>
  );
}
