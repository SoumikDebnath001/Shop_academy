'use client';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/services/api';
import type { Cart, CartLineKind } from '@/services/catalog.types';
import { useToast } from '@/components/ToastProvider';
import CartDrawer from './CartDrawer';

interface CartContextValue {
  cart: Cart | null; // null until the first load finishes
  busy: boolean; // a cart change is in flight
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  add: (productId: string, quantity?: number, kind?: CartLineKind) => Promise<boolean>;
  setQuantity: (lineId: string, quantity: number) => Promise<void>;
  remove: (lineId: string) => Promise<void>;
  applyAcademyId: (academyId: string) => Promise<string | null>; // error message, or null when applied
  removeAcademyId: () => Promise<void>;
  quantityOf: (productId: string, kind: CartLineKind) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
};

/** Store-wide cart state (header badge, drawer, product page, cart page) backed by the cart API. */
export default function CartProvider({ children }: { children: React.ReactNode }) {
  const { triggerToast } = useToast();
  const [cart, setCart] = useState<Cart | null>(null);
  const [pending, setPending] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const queue = useRef<Promise<unknown>>(Promise.resolve()); // run changes one at a time, in order

  useEffect(() => {
    api.getCart().then(setCart).catch(() => setCart(null));
  }, []);

  const run = useCallback(
    <T,>(task: () => Promise<Cart>, onError?: (e: Error) => T): Promise<Cart | T | undefined> => {
      setPending((n) => n + 1);
      const next = queue.current.then(task).then(
        (updated) => {
          setCart(updated);
          return updated;
        },
        (e: Error) => (onError ? onError(e) : (triggerToast(e.message || 'Something went wrong'), undefined)),
      );
      queue.current = next.finally(() => setPending((n) => n - 1));
      return next;
    },
    [triggerToast],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      busy: pending > 0,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      add: async (productId, quantity = 1, kind = 'self') => !!(await run(() => api.addToCart(productId, quantity, kind))),
      setQuantity: async (lineId, quantity) => void (await run(() => api.updateCartItem(lineId, quantity))),
      remove: async (lineId) => void (await run(() => api.removeFromCart(lineId))),
      applyAcademyId: async (academyId) => {
        let error: string | null = null;
        await run(() => api.applyAcademyId(academyId), (e) => (error = e.message));
        return error;
      },
      removeAcademyId: async () => void (await run(() => api.removeAcademyId())),
      quantityOf: (productId, kind) => cart?.lines.find((l) => l.product.id === productId && l.kind === kind)?.quantity ?? 0,
    }),
    [cart, pending, isOpen, run],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer />
    </CartContext.Provider>
  );
}
