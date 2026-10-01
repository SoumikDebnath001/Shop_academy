'use client';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { PageLoader } from '@/components/Loader';
import { useToast } from '@/components/ToastProvider';
import { PageHeader, StorePage } from '../_components/StorePage';
import { AcademyMember } from '../_components/product/PurchasePanel';
import { CART_TRUST, CartLineList, CartSummary, TrustIcons } from '../_components/shop/CartLines';
import { useCart } from '../_components/shop/CartProvider';

/** Full cart page ("View Cart"): same lines and summary as the drawer, with room for the academy discount. */
export default function CartPage() {
  const { cart } = useCart();
  const { triggerToast } = useToast();

  if (!cart) return <PageLoader label="Loading cart" />;

  return (
    <StorePage>
      <PageHeader title={`Your Cart (${cart.itemCount})`} crumbs={[{ label: 'Home', href: '/' }, { label: 'Cart' }]} />

      {cart.lines.length === 0 ? (
        <div className="py-16 md:py-24 flex flex-col items-center text-center">
          <Icon name="shopping_cart" size={64} weight={200} className="text-obuya-muted" />
          <p className="mt-4 font-headline-lg text-[26px] font-bold text-obuya-ink">Your cart is empty</p>
          <p className="mt-1 text-[14px] text-obuya-muted">Gear up yourself, or kit out a young athlete.</p>
          <div className="mt-7 flex gap-3">
            <Link href="/sports" className="h-12 px-6 flex items-center rounded-md bg-obuya-gold text-white text-[15px] font-semibold">Shop Sports</Link>
            <Link href="/apparels" className="h-12 px-6 flex items-center rounded-md border border-obuya-line text-obuya-ink text-[15px] font-semibold">Shop Apparel</Link>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_400px] gap-8 lg:gap-10 items-start">
          <section aria-label="Cart items" className="rounded-md bg-obuya-panel border border-obuya-line/30 px-4 sm:px-6 py-2">
            <CartLineList cart={cart} large />
          </section>

          <aside className="lg:sticky lg:top-[94px] space-y-4">
            <div className="rounded-md bg-obuya-panel border border-obuya-line/30 border-t-2 border-t-obuya-gold p-5 sm:p-6 space-y-5">
              <h2 className="font-headline-lg text-[22px] font-bold text-obuya-ink">Order summary</h2>
              <CartSummary cart={cart} />
              <button
                type="button"
                onClick={() => triggerToast('Checkout is coming soon')}
                className="w-full h-12 flex items-center justify-center gap-2 rounded-md bg-obuya-gold text-white text-[16px] font-semibold hover:brightness-95 transition"
              >
                Checkout <Icon name="arrow_forward" size={20} />
              </button>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/sports" className="h-11 flex items-center justify-center rounded-md border border-obuya-line text-[14px] text-obuya-ink hover:border-obuya-gold">Shop Sports</Link>
                <Link href="/apparels" className="h-11 flex items-center justify-center rounded-md border border-obuya-line text-[14px] text-obuya-ink hover:border-obuya-gold">Shop Apparel</Link>
              </div>
              <TrustIcons items={CART_TRUST} />
            </div>
            <AcademyMember />
          </aside>
        </div>
      )}
    </StorePage>
  );
}
