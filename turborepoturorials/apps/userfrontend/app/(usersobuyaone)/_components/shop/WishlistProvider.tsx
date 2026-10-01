'use client';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '@/services/api';
import type { WishlistItem } from '@/services/catalog.types';
import { useToast } from '@/components/ToastProvider';

interface WishlistContextValue {
  items: WishlistItem[] | null; // null until loaded
  has: (productId: string) => boolean;
  toggle: (productId: string, name?: string) => Promise<void>;
  remove: (productId: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used inside <WishlistProvider>');
  return ctx;
};

export default function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { triggerToast } = useToast();
  const [items, setItems] = useState<WishlistItem[] | null>(null);

  useEffect(() => {
    api.getWishlist().then(setItems).catch(() => setItems([]));
  }, []);

  const ids = useMemo(() => new Set(items?.map((w) => w.product.id)), [items]);

  const remove = useCallback(async (productId: string) => {
    setItems((prev) => prev?.filter((w) => w.product.id !== productId) ?? prev); // optimistic
    try { setItems(await api.removeFromWishlist(productId)); } catch { triggerToast('Could not update your wishlist'); }
  }, [triggerToast]);

  const toggle = useCallback(async (productId: string, name?: string) => {
    if (ids.has(productId)) return remove(productId);
    try {
      setItems(await api.addToWishlist(productId));
      triggerToast(name ? `${name} saved to your wishlist` : 'Saved to your wishlist');
    } catch {
      triggerToast('Could not update your wishlist');
    }
  }, [ids, remove, triggerToast]);

  const value = useMemo(() => ({ items, has: (id: string) => ids.has(id), toggle, remove }), [items, ids, toggle, remove]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}
