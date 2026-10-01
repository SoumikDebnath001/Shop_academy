'use client';
import Link from 'next/link';
import { useState } from 'react';
import Icon from '@/components/Icon';
import Loader from '@/components/Loader';
import { useToast } from '@/components/ToastProvider';
import type { WishlistItem } from '@/services/catalog.types';
import { formatPrice } from '../_components/format';
import { ArtTile } from '../_components/catalog/ProductArt';
import StarRating from '../_components/catalog/StarRating';
import { useCart } from '../_components/shop/CartProvider';
import { productHref } from '../_components/shop/links';
import { useWishlist } from '../_components/shop/WishlistProvider';

type Side = 'sports' | 'apparel';

const SIDES: { key: Side; label: string; icon: string; shopHref: string }[] = [
  { key: 'sports', label: 'Sports', icon: 'sports_cricket', shopHref: '/sports' },
  { key: 'apparel', label: 'Apparel', icon: 'apparel', shopHref: '/apparels' },
];

/** Wishlist: Sports on the left, Apparel on the right; on phones a sliding toggle at the top picks one side. */
export default function WishlistPage() {
  const { items } = useWishlist();
  const [side, setSide] = useState<Side>('sports');

  const bySide = (key: Side) => (items ?? []).filter((w) => w.product.ref.section === key);
  const counts = { sports: bySide('sports').length, apparel: bySide('apparel').length };

  return (
    <main className="obuya-page flex-1 min-h-screen bg-obuya-bg text-obuya-ink pb-12 md:pb-20">
      {/* Header band from the design: cream fading into maroon */}
      <div className="pt-[88px] md:pt-[70px] bg-linear-to-r from-obuya-bg from-35% via-obuya-maroon/40 to-[#4d1320]">
        <div className="max-w-[1328px] mx-auto px-margin-mobile md:px-6 py-8 md:py-12">
          <p className="text-[11px] md:text-[12px] font-bold tracking-[0.3em] uppercase text-obuya-gold">Saved for later</p>
          <h1 className="mt-2 font-headline-lg text-[34px] md:text-[48px] font-bold leading-tight">Wishlist</h1>
          <span aria-hidden className="block mt-3 h-[3px] w-[46px] rounded-full bg-linear-to-r from-obuya-maroon to-obuya-gold" />
        </div>
      </div>

      <div className="max-w-[1328px] mx-auto px-margin-mobile md:px-6 pt-6 md:pt-10">
        {/* Phone: sliding segmented toggle */}
        <div className="md:hidden sticky top-[72px] z-30 -mx-1 mb-5">
          <div role="tablist" aria-label="Wishlist section" className="relative grid grid-cols-2 p-1 rounded-full bg-obuya-panel border border-obuya-line/40 shadow-sm">
            <span
              aria-hidden
              className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-obuya-maroon shadow transition-transform duration-300 ease-out"
              style={{ transform: side === 'apparel' ? 'translateX(100%)' : 'none' }}
            />
            {SIDES.map((s) => (
              <button
                key={s.key}
                role="tab"
                type="button"
                aria-selected={side === s.key}
                onClick={() => setSide(s.key)}
                className={`relative z-10 h-10 flex items-center justify-center gap-1.5 text-[14px] font-semibold transition-colors ${side === s.key ? 'text-obuya-gold' : 'text-obuya-ink'}`}
              >
                <Icon name={s.icon} size={18} filled={side === s.key} /> {s.label} ({counts[s.key]})
              </button>
            ))}
          </div>
        </div>

        {!items ? (
          <Loader label="Loading wishlist" size={96} className="py-24" />
        ) : (
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {SIDES.map((s) => (
              <section key={s.key} aria-labelledby={`wl-${s.key}`} className={side === s.key ? '' : 'hidden md:block'}>
                <div className="hidden md:flex items-center gap-2 pb-4 mb-5 border-b border-obuya-line/40">
                  <Icon name={s.icon} size={24} className="text-obuya-gold" />
                  <h2 id={`wl-${s.key}`} className="font-headline-lg text-[24px] font-bold">{s.label}</h2>
                  <span className="ml-1 text-[14px] text-obuya-muted">({counts[s.key]})</span>
                </div>
                <h2 className="sr-only md:hidden">{s.label}</h2>
                <WishlistColumn items={bySide(s.key)} side={s} />
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function WishlistColumn({ items, side }: { items: WishlistItem[]; side: (typeof SIDES)[number] }) {
  if (!items.length) {
    return (
      <div className="rounded-md border border-dashed border-obuya-line/60 py-14 px-6 text-center">
        <Icon name="favorite" size={40} weight={200} className="text-obuya-muted" />
        <p className="mt-2 text-[15px] text-obuya-ink">No {side.label.toLowerCase()} items saved yet</p>
        <p className="mt-1 text-[13px] text-obuya-muted">Tap the heart on any product to save it here.</p>
        <Link href={side.shopHref} className="mt-5 inline-flex h-10 px-5 items-center rounded-md bg-obuya-gold text-white text-[14px] font-semibold">
          Browse {side.label}
        </Link>
      </div>
    );
  }
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-6">
      {items.map((w) => (
        <li key={w.product.id} className="obuya-fade-up">
          <WishlistCard item={w} />
        </li>
      ))}
    </ul>
  );
}

function WishlistCard({ item: { product } }: { item: WishlistItem }) {
  const { add, busy } = useCart();
  const { remove } = useWishlist();
  const { triggerToast } = useToast();
  const href = productHref(product.id, product.ref);

  const moveToCart = async () => {
    if (await add(product.id, 1, 'self')) triggerToast(`${product.name} added to your cart`);
  };

  return (
    <article className="group">
      <div className="relative">
        <Link href={href} aria-label={product.name}>
          <ArtTile image={product.image} icon={product.icon} iconSize={44} className="transition-shadow group-hover:shadow-[0_18px_36px_-14px_rgba(122,29,46,0.3)]" />
        </Link>
        <button
          type="button"
          onClick={() => remove(product.id)}
          aria-label={`Remove ${product.name} from wishlist`}
          className="absolute top-2 right-2 w-9 h-9 rounded-full bg-obuya-bg/90 text-obuya-maroon flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
        >
          <Icon name="favorite" size={19} filled />
        </button>
        {!product.inStock && (
          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-obuya-bg/90 text-[11px] font-medium text-obuya-muted">Out of stock</span>
        )}
      </div>
      <p className="mt-3 text-[11px] uppercase tracking-[0.06em] text-obuya-muted">{product.brand}</p>
      <Link href={href} className="mt-0.5 block text-[14px] font-medium text-obuya-ink line-clamp-1 hover:text-obuya-gold">{product.name}</Link>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="text-[14px] font-bold text-obuya-gold">{formatPrice(product.price)}</span>
        <span className="hidden sm:flex items-center gap-1 text-[12px] text-obuya-muted">
          <StarRating value={product.rating} size={12} /> {product.rating.toFixed(1)}
        </span>
      </div>
      <button
        type="button"
        onClick={moveToCart}
        disabled={!product.inStock || busy}
        className="mt-3 w-full h-10 flex items-center justify-center gap-1.5 rounded-md border border-obuya-gold text-[13px] font-semibold text-obuya-ink hover:bg-obuya-gold hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Icon name="add_shopping_cart" size={18} /> {product.inStock ? 'Add to cart' : 'Out of stock'}
      </button>
    </article>
  );
}
