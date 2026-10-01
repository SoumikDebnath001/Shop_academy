"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';

export default function BottomNav() {
  const pathname = usePathname();
  const { isAuthenticated: isLoggedIn } = useAuth();

  const tabs = [
    { name: 'Home', href: '/', icon: 'cottage' },
    { name: 'Cricket', href: '/gifts', icon: 'sports_cricket' },
    { name: 'Merchandise', href: '/crafts', icon: 'apparel' },
  ];

  if (isLoggedIn) {
    tabs.push({ name: 'Cart', href: '/cart', icon: 'local_mall' });
  }

  // Determine active index based on pathname
  let activeIndex = tabs.findIndex(tab => tab.href === pathname);
  if (activeIndex === -1) activeIndex = 0; // Default to first if none match

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pb-safe w-full max-w-[400px] px-4">
      <div className="relative flex items-center h-14 px-2 bg-white/40 backdrop-blur-3xl shadow-[0_8px_32px_rgba(27,122,67,0.14)] border border-white/60 rounded-full overflow-hidden">
        
        {/* Animated Background Pill */}
        <div 
          className="absolute h-10 top-2 bg-white/70 shadow-sm rounded-full transition-all duration-300 ease-out z-0"
          style={{ 
            width: `calc((100% - 16px) / ${tabs.length})`,
            left: `calc(8px + ${activeIndex} * ((100% - 16px) / ${tabs.length}))` 
          }}
        />

        {/* Tab Items */}
        {tabs.map((tab, index) => {
          const isActive = index === activeIndex;
          return (
            <Link 
              key={tab.name}
              href={tab.href}
              className={`relative z-10 flex flex-row items-center justify-center flex-1 h-full transition-colors duration-300 ${isActive ? 'text-primary drop-shadow-sm' : 'text-on-surface-variant/70 hover:text-primary'}`}
            >
              <span className={`material-symbols-outlined transition-all duration-300 ${isActive ? 'text-[24px]' : 'text-[22px]'}`} style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                {tab.icon}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
