"use client";
import React from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ADMIN_BASE_PATH } from '../services/adminRoutes';

const Header = dynamic(() => import('./Header'), { ssr: false });
const BottomNav = dynamic(() => import('./BottomNav'), { ssr: false });
const AdminReturnButton = dynamic(() => import('./AdminReturnButton'), { ssr: false });

export default function StoreLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Do not show store Header/BottomNav on admin or auth pages
  const isStoreRoute = !pathname?.startsWith(ADMIN_BASE_PATH) && !pathname?.startsWith('/auth');

  return (
    <>
      {isStoreRoute && <Header />}
      {children}
      {isStoreRoute && <BottomNav />}
      {isStoreRoute && <AdminReturnButton />}
    </>
  );
}
