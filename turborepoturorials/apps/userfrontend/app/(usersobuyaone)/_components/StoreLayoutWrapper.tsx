"use client";
import React from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import Footer from './Footer';

const Header = dynamic(() => import('./Header'), { ssr: false });
const BottomNav = dynamic(() => import('./BottomNav'), { ssr: false });
const AdminReturnButton = dynamic(() => import('./AdminReturnButton'), { ssr: false });

export default function StoreLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Only used by the (usersobuyaone) store layout; the auth page has its own full-screen design
  const isStoreRoute = !pathname?.startsWith('/auth');

  return (
    <>
      {isStoreRoute && <Header />}
      {children}
      {isStoreRoute && pathname !== '/' && <Footer /> /* home has its own ending; footer design is for every other page */}
      {isStoreRoute && <BottomNav />}
      {isStoreRoute && <AdminReturnButton />}
    </>
  );
}
