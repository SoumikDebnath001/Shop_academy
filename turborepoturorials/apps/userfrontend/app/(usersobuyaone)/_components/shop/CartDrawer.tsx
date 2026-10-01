'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/Icon';
import Loader from '@/components/Loader';
import { useToast } from '@/components/ToastProvider';
import { useOverlay } from '../useOverlay';
import { CART_TRUST, CartLineList, CartSummary, TrustIcons } from './CartLines';
import { useCart } from './CartProvider';

/** Slide-in cart from the cart design. Full width on phones, 430px panel on larger screens. */
export default function CartDrawer() {
  const { cart, isOpen, closeCart } = useCart();
  const { triggerToast } = useToast();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [details, setDetails] = useState(false); // phones: price breakdown folded by default to keep items visible
  useOverlay(isOpen, closeCart);

  useEffect(() => {
    if (isOpen) closeRef.current?.focus();
  }, [isOpen]);

  const empty = cart && cart.lines.length === 0;

  return (
    <div className={`fixed inset-0 z-[70] ${isOpen ? '' : 'pointer-events-none'}`} inert={!isOpen}>
      <div onClick={closeCart} className={`absolute inset-0 bg-black/45 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Your cart"
        className={`absolute right-0 top-0 h-full w-full sm:w-[430px] flex flex-col bg-linear-to-b from-obuya-bg to-obuya-card-to border-t-[3px] border-obuya-gold shadow-[-20px_0_50px_-20px_rgba(0,0,0,0.35)] transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <header className="flex items-start justify-between px-4 sm:px-6 pt-4 sm:pt-6 pb-2 sm:pb-4">
          <div>
            <h2 className="font-headline-lg text-[24px] sm:text-[28px] font-bold text-obuya-ink leading-none">Your Cart ({cart?.itemCount ?? 0})</h2>
            <span aria-hidden className="block mt-2.5 sm:mt-3 h-[3px] w-[46px] rounded-full bg-obuya-gold" />
          </div>
          <button ref={closeRef} type="button" onClick={closeCart} aria-label="Close cart" className="w-10 h-10 -mr-2 flex items-center justify-center rounded-full text-obuya-ink hover:bg-obuya-ink/5">
            <Icon name="close" size={26} />
          </button>
        </header>

        {!cart ? (
          <Loader label="Loading cart" size={96} className="flex-1" />
        ) : empty ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            <Icon name="shopping_cart" size={52} weight={200} className="text-obuya-muted" />
            <p className="mt-3 font-headline-lg text-[22px] font-bold text-obuya-ink">Your cart is empty</p>
            <p className="mt-1 text-[14px] text-obuya-muted">Gear up yourself, or kit out a young athlete.</p>
            <div className="mt-6 flex gap-3">
              <Link href="/sports" onClick={closeCart} className="h-11 px-5 flex items-center rounded-md bg-obuya-gold text-white text-[14px] font-semibold">Shop Sports</Link>
              <Link href="/apparels" onClick={closeCart} className="h-11 px-5 flex items-center rounded-md border border-obuya-line text-obuya-ink text-[14px] font-semibold">Shop Apparel</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 overscroll-contain">
              <CartLineList cart={cart} onNavigate={closeCart} />
            </div>
            <footer className="px-4 sm:px-6 pt-3 sm:pt-5 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-obuya-line/50 space-y-3 sm:space-y-4 shadow-[0_-12px_24px_-18px_rgba(0,0,0,0.25)]">
              <button
                type="button"
                onClick={() => setDetails((d) => !d)}
                aria-expanded={details}
                className="sm:hidden w-full flex items-center justify-between text-[13px] text-obuya-muted"
              >
                {details ? 'Hide price details' : 'Show price details'}
                <Icon name={details ? 'expand_more' : 'expand_less'} size={20} />
              </button>
              <CartSummary cart={cart} breakdownClassName={details ? '' : 'hidden sm:block'} />
              <div className="grid grid-cols-[1fr_auto] sm:grid-cols-1 gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => triggerToast('Checkout is coming soon')}
                  className="h-12 flex items-center justify-center gap-2 rounded-md bg-obuya-gold text-white text-[15px] sm:text-[16px] font-semibold hover:brightness-95 transition"
                >
                  Checkout <Icon name="arrow_forward" size={20} />
                </button>
                <Link href="/cart" onClick={closeCart} className="h-12 px-4 flex items-center justify-center rounded-md border border-obuya-line text-obuya-ink text-[15px] sm:text-[16px] font-medium hover:bg-obuya-ink/5 transition-colors">
                  View Cart
                </Link>
              </div>
              <div className="hidden sm:block space-y-4">
                <TrustIcons items={CART_TRUST} />
                <Link href="/" onClick={closeCart} className="flex items-center gap-3 rounded-md border border-obuya-maroon/25 bg-obuya-maroon/10 px-4 h-12 text-[14px] text-obuya-ink hover:bg-obuya-maroon/15 transition-colors">
                  <Icon name="favorite" size={20} filled className="text-obuya-maroon" />
                  <span className="flex-1">Every purchase creates opportunity.</span>
                  <Icon name="arrow_forward" size={18} />
                </Link>
              </div>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
