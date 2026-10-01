"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../services/api';
import { ADMIN_BASE_PATH } from '../services/adminRoutes';
import { useAuth } from './AuthProvider';

// Shown on the store only while an admin session is active and no shopper is logged in, so an admin can get back to the panel
export default function AdminReturnButton() {
  const [isAdmin, setIsAdmin] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    let cancelled = false;
    api.adminMe()
      .then(() => { if (!cancelled) setIsAdmin(true); })
      .catch(() => { /* not signed in as admin, keep the button hidden */ });
    return () => { cancelled = true; };
  }, []);

  // A logged in shopper never sees the admin shortcut, even if the same browser also has an admin session
  if (!isAdmin || isLoading || isAuthenticated) return null;

  return (
    <Link
      href={ADMIN_BASE_PATH}
      className="fixed right-4 bottom-28 z-50 flex items-center gap-2 h-11 pl-3 pr-4 rounded-full bg-brand-green-dark text-brand-gold text-[14px] font-medium border border-brand-gold/30 shadow-[0_8px_24px_rgba(15,59,36,0.3)] hover:bg-brand-green-dark/90 transition-colors"
    >
      <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
      Admin panel
    </Link>
  );
}
