'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/Icon';
import { useToast } from '@/components/ToastProvider';
import type { ProductDetail } from '@/services/catalog.types';
import { formatPrice } from '../format';
import { useCart } from '../shop/CartProvider';
import { useWishlist } from '../shop/WishlistProvider';
import { FOUNDATION_URL, SQUAD_SIZE } from '../shop/links';
import QuantityStepper from '../shop/QuantityStepper';

type Product = Pick<ProductDetail, 'id' | 'name' | 'price' | 'inStock'>;

const MAX_QTY = 10;
const DONATE_PRESETS = [2, 5, 10];

const goldBtn =
  'h-11 sm:h-12 flex items-center justify-center gap-2 rounded-md bg-obuya-gold text-white text-[14px] sm:text-[15px] font-semibold hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition';

/** "Two ways to play your part": buy for yourself, donate to a young athlete, or both; plus academy discount. */
export default function PurchasePanel({ product }: { product: Product }) {
  const forYouRef = useRef<HTMLDivElement>(null);
  return (
    <section aria-labelledby="play-your-part" className="mt-10 md:mt-20">
      <div className="text-center mb-6 md:mb-10">
        <p className="text-[11px] md:text-[12px] font-bold tracking-[0.3em] text-obuya-gold uppercase">Two ways to play your part</p>
        <h2 id="play-your-part" className="mt-2 md:mt-3 font-headline-lg text-[22px] md:text-[36px] font-bold leading-tight text-obuya-ink">
          Gear up yourself. Kit out someone else.
        </h2>
        <span aria-hidden className="block mx-auto mt-4 h-[3px] w-[46px] rounded-full bg-linear-to-r from-obuya-maroon to-obuya-gold" />
      </div>

      <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-3 lg:gap-6 items-stretch">
        <div ref={forYouRef} className="flex">
          <ForYouCard product={product} />
        </div>
        <div className="flex lg:flex-col items-center justify-center gap-3" aria-hidden>
          <span className="flex-1 h-px lg:h-auto lg:w-px bg-obuya-line/50" />
          <span className="w-9 h-9 md:w-12 md:h-12 rounded-full border border-obuya-gold/50 bg-obuya-bg flex items-center justify-center font-headline-lg text-[17px] md:text-[22px] text-obuya-gold">&amp;</span>
          <span className="flex-1 h-px lg:h-auto lg:w-px bg-obuya-line/50" />
        </div>
        <DonateCard product={product} />
      </div>
      <MobileBuyBar product={product} watch={forYouRef} />

      <BuyBothBar product={product} />

      <div className="mt-3 md:mt-4 grid lg:grid-cols-[1.15fr_1fr] gap-3 md:gap-4">
        <AcademyMember />
        <div className="rounded-md bg-obuya-panel border border-obuya-line/30 px-3 py-4 md:px-5 md:py-6 flex items-center">
          <ul className="grid grid-cols-3 gap-3 w-full">
            {[
              { icon: 'local_shipping', label: 'Delivery across Kenya & beyond' },
              { icon: 'verified_user', label: 'Secure Payments' },
              { icon: 'published_with_changes', label: 'Easy Returns' },
            ].map((t) => (
              <li key={t.label} className="flex flex-col sm:flex-row items-center sm:items-start gap-2 text-center sm:text-left text-[11px] sm:text-[12px] leading-tight text-obuya-muted">
                <Icon name={t.icon} size={24} weight={300} className="text-obuya-gold shrink-0" />
                {t.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function ForYouCard({ product }: { product: Product }) {
  const router = useRouter();
  const { add, busy, quantityOf, openCart } = useCart();
  const { has, toggle } = useWishlist();
  const { triggerToast } = useToast();
  const [qty, setQty] = useState(1);
  const inCart = quantityOf(product.id, 'self');
  const saved = has(product.id);

  const addToCart = async () => {
    if (await add(product.id, qty, 'self')) triggerToast(`${qty} × ${product.name} added to your cart`);
  };
  const buyNow = async () => {
    if (await add(product.id, qty, 'self')) router.push('/cart');
  };

  return (
    <div className="w-full rounded-md bg-obuya-panel border border-obuya-line/30 border-t-2 border-t-obuya-maroon p-4 md:p-7 flex flex-col">
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-obuya-gold text-white flex items-center justify-center shrink-0">
          <Icon name="shopping_bag" size={22} />
        </span>
        <div className="flex-1">
          <h3 className="text-[17px] md:text-[19px] font-semibold text-obuya-ink">For you</h3>
          <p className="text-[13px] text-obuya-muted">Delivered to your door.</p>
        </div>
        <button
          type="button"
          onClick={() => toggle(product.id, product.name)}
          aria-pressed={saved}
          aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
          className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${saved ? 'border-obuya-maroon bg-obuya-maroon text-white' : 'border-obuya-line text-obuya-ink hover:text-obuya-maroon'}`}
        >
          <Icon name="favorite" size={20} filled={saved} />
        </button>
      </div>

      <div className="mt-4 md:mt-6 flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[11px] font-bold tracking-[0.12em] uppercase text-obuya-gold">Quantity</p>
          <QuantityStepper value={qty} onChange={setQty} max={MAX_QTY} disabled={!product.inStock} label={`Quantity of ${product.name}`} />
        </div>
        <div className="text-right">
          <p className="text-[11px] text-obuya-muted">Total</p>
          <p className="text-[20px] md:text-[24px] font-bold text-obuya-gold tabular-nums">{formatPrice(product.price * qty)}</p>
        </div>
      </div>

      <div className="mt-auto pt-5 md:pt-8 grid grid-cols-2 gap-2.5 md:gap-3">
        <button type="button" onClick={addToCart} disabled={!product.inStock || busy} className={goldBtn}>
          <Icon name="add_shopping_cart" size={20} /> {product.inStock ? 'Add to cart' : 'Out of stock'}
        </button>
        <button
          type="button"
          onClick={buyNow}
          disabled={!product.inStock || busy}
          className="h-11 sm:h-12 rounded-md border border-obuya-line bg-obuya-bg/50 text-[14px] sm:text-[15px] font-medium text-obuya-ink hover:border-obuya-gold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Buy now
        </button>
      </div>
      <p className="mt-3 md:mt-4 flex items-center gap-2 text-[12px] md:text-[13px] text-obuya-muted">
        <Icon name="check_circle" size={17} filled={inCart > 0} className={inCart ? 'text-obuya-avatar' : ''} />
        {inCart ? (
          <>
            {inCart} in your cart ·{' '}
            <button type="button" onClick={openCart} className="text-obuya-gold font-medium hover:underline">View</button>
          </>
        ) : (
          'Nothing in your cart yet'
        )}
      </p>
    </div>
  );
}

function DonateCard({ product }: { product: Product }) {
  const { add, busy, quantityOf } = useCart();
  const { triggerToast } = useToast();
  const [preset, setPreset] = useState<number | 'other'>(2);
  const [other, setOther] = useState('3');
  const count = preset === 'other' ? Math.min(99, Math.max(1, Number.parseInt(other, 10) || 0)) : preset;
  const donated = quantityOf(product.id, 'donation');

  const donate = async () => {
    if (await add(product.id, count, 'donation')) triggerToast(`Thank you! ${count} added for young athletes`);
  };
  const openFoundation = () => (FOUNDATION_URL ? window.open(FOUNDATION_URL, '_blank', 'noopener') : triggerToast('The Foundation page is coming soon'));

  const chip = (active: boolean) =>
    `h-10 md:h-11 min-w-10 md:min-w-11 px-3 rounded-md text-[14px] md:text-[15px] font-semibold transition-colors ${active ? 'bg-[#f2c037] text-[#3a1219]' : 'border border-white/25 text-white hover:border-white/60'}`;

  return (
    <div className="rounded-md bg-linear-to-br from-[#7a1d2e] to-[#4d1320] text-white p-4 md:p-7 shadow-[0_20px_40px_-20px_rgba(122,29,46,0.6)] flex flex-col">
      <div className="flex items-start gap-3">
        <span className="w-11 h-11 md:w-14 md:h-14 rounded-full bg-white flex items-center justify-center shrink-0 ring-2 ring-[#f2c037]/60">
          <Image src="/logo-shop.png" alt="" width={48} height={48} className="rounded-full" />
        </span>
        <div>
          <h3 className="text-[17px] md:text-[19px] font-semibold">For a young athlete</h3>
          <p className="text-[12px] md:text-[13px] text-white/75 leading-snug">
            Purchase this item and we&apos;ll donate 1 to a young athlete through the{' '}
            <button type="button" onClick={openFoundation} className="text-[#f2c037] underline underline-offset-2">Obuya Foundation</button>.
          </p>
        </div>
      </div>

      <p className="mt-4 md:mt-6 mb-2 text-[11px] font-bold tracking-[0.12em] uppercase text-[#f2c037]">How many to donate</p>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="How many to donate">
          {DONATE_PRESETS.map((n) => (
            <button key={n} type="button" role="radio" aria-checked={preset === n} onClick={() => setPreset(n)} className={chip(preset === n)}>
              {n}
            </button>
          ))}
          {preset === 'other' ? (
            <input
              autoFocus
              type="number"
              inputMode="numeric"
              min={1}
              max={99}
              value={other}
              onChange={(e) => setOther(e.target.value)}
              aria-label="Number to donate"
              className="h-10 md:h-11 w-16 md:w-20 px-3 rounded-md bg-[#f2c037] text-[#3a1219] text-[15px] font-semibold focus:outline-none focus:ring-2 focus:ring-white"
            />
          ) : (
            <button type="button" role="radio" aria-checked={false} onClick={() => setPreset('other')} className={`${chip(false)} text-white/70 font-normal`}>
              Other
            </button>
          )}
        </div>
        <div className="text-right">
          <p className="text-[11px] text-white/70">Total</p>
          <p className="text-[20px] md:text-[24px] font-bold text-[#f2c037] tabular-nums">{formatPrice(product.price * count)}</p>
        </div>
      </div>

      <div className="mt-4 md:mt-6 grid grid-cols-2 gap-2.5 md:gap-3">
        <button type="button" onClick={donate} disabled={!product.inStock || busy} className="h-11 md:h-12 px-2 flex items-center justify-center gap-1.5 md:gap-2 rounded-md bg-[#f2c037] text-[#3a1219] text-[13px] md:text-[15px] font-semibold hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition">
          <Icon name="volunteer_activism" size={20} /> {product.inStock ? 'Add for donation' : 'Out of stock'}
        </button>
        <button type="button" onClick={openFoundation} className="h-11 md:h-12 px-2 flex items-center justify-center gap-1.5 md:gap-2 rounded-md border border-white/30 text-[13px] md:text-[15px] font-medium hover:bg-white/10 transition-colors">
          <span className="sm:hidden">Foundation</span><span className="hidden sm:inline">Donate to the Foundation</span> <Icon name="open_in_new" size={16} />
        </button>
      </div>

      <div className="mt-4 md:mt-5">
        <div className="flex items-center justify-between text-[12px] md:text-[13px]">
          <span className="flex items-center gap-2 text-white/90"><Icon name="groups" size={18} className="text-[#f2c037]" /> Kit out a squad</span>
          <span className="text-white/70 tabular-nums">{donated >= SQUAD_SIZE ? 'Squad complete!' : `${donated} of ${SQUAD_SIZE} players`}</span>
        </div>
        <div className="mt-2 h-1 rounded-full bg-white/15 overflow-hidden" aria-hidden>
          <div className="h-full bg-[#f2c037] transition-[width] duration-500" style={{ width: `${Math.min(100, (donated / SQUAD_SIZE) * 100)}%` }} />
        </div>
      </div>
      <p className="mt-3 md:mt-4 flex items-center gap-2 text-[11px] md:text-[12px] text-white/65">
        <Icon name="favorite" size={16} /> Paid with your order, never delivered to you
      </p>
    </div>
  );
}

function BuyBothBar({ product }: { product: Product }) {
  const { add, busy, cart, openCart } = useCart();
  const { triggerToast } = useToast();

  const addBoth = async () => {
    if ((await add(product.id, 1, 'self')) && (await add(product.id, 1, 'donation'))) {
      triggerToast('Added 1 for you and 1 for a young athlete');
    }
  };

  return (
    <div className="mt-4 md:mt-6 rounded-md bg-linear-to-r from-obuya-maroon/10 via-obuya-card-to to-obuya-maroon/15 border border-obuya-line/30 p-4 md:px-7 md:py-5 flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
      <div className="flex items-center gap-4 flex-1">
        <span className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-obuya-maroon text-[#f2c037] flex items-center justify-center shrink-0">
          <Icon name="handshake" size={22} />
        </span>
        <div>
          <p className="text-[15px] md:text-[16px] font-semibold text-obuya-ink">Buy one, give one</p>
          <p className="text-[12px] md:text-[13px] text-obuya-muted">Add 1 for you and 1 for a young athlete in one tap — double the story of your order.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:flex gap-2.5 md:gap-3">
        <button type="button" onClick={addBoth} disabled={!product.inStock || busy} className="h-11 md:h-12 px-2 md:px-5 flex items-center justify-center gap-1.5 md:gap-2 rounded-md bg-obuya-maroon text-white text-[13px] md:text-[15px] font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition">
          <span className="hidden sm:flex"><Icon name="add_shopping_cart" size={18} /></span> Add both · {formatPrice(product.price * 2)}
        </button>
        <button type="button" onClick={openCart} className="h-11 md:h-12 px-2 md:px-5 flex items-center justify-center gap-1.5 md:gap-2 rounded-md border border-obuya-line bg-obuya-bg/40 text-[13px] md:text-[15px] font-medium text-obuya-ink hover:border-obuya-gold transition-colors">
          <span className="hidden sm:flex"><Icon name="shopping_cart" size={18} /></span> View cart ({cart?.itemCount ?? 0})
        </button>
      </div>
    </div>
  );
}

export function AcademyMember() {
  const { cart, applyAcademyId, removeAcademyId, busy } = useCart();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const discount = cart?.discount;

  const apply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return setError('Enter your academy ID');
    setError(await applyAcademyId(value));
  };

  return (
    <div className="rounded-md bg-obuya-panel border border-obuya-line/30 p-4 md:p-5">
      <div className="flex items-start gap-3">
        <Icon name="school" size={24} className="text-obuya-gold shrink-0" />
        <div>
          <p className="text-[14px] md:text-[15px] font-semibold text-obuya-ink">Are you an academy member?</p>
          <p className="text-[12px] md:text-[13px] text-obuya-muted">Enter your registered academy ID to get your member discount.</p>
        </div>
      </div>
      {discount ? (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-obuya-avatar/40 bg-obuya-avatar/10 px-4 py-3">
          <p className="text-[13px] text-obuya-ink">
            <Icon name="verified" size={17} filled className="text-obuya-avatar align-[-3px] mr-1" />
            <strong>{discount.academyId}</strong> · {discount.percent}% off items for you
          </p>
          <button type="button" onClick={removeAcademyId} disabled={busy} className="text-[13px] font-medium text-obuya-maroon hover:underline">Remove</button>
        </div>
      ) : (
        <form onSubmit={apply} className="mt-4 flex gap-2" noValidate>
          <input
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(null); }}
            placeholder="Enter Academy ID"
            aria-label="Academy ID"
            aria-invalid={!!error}
            aria-describedby={error ? 'academy-error' : undefined}
            className="flex-1 min-w-0 h-11 px-3 rounded-md border border-obuya-line/60 bg-obuya-bg text-[14px] text-obuya-ink placeholder:text-obuya-muted/70 focus:outline-none focus:border-obuya-gold"
          />
          <button type="submit" disabled={busy} className="h-11 px-5 rounded-md border border-obuya-line bg-obuya-bg text-[14px] font-semibold text-obuya-ink hover:border-obuya-gold disabled:opacity-50 transition-colors">
            Apply
          </button>
        </form>
      )}
      {error && <p id="academy-error" role="alert" className="mt-2 text-[12px] text-obuya-maroon">{error}</p>}
    </div>
  );
}

/**
 * Phones only: a slim bar above the bottom nav with "Donate" and "Add to cart" (1 each), shown while the
 * "For you" card is off screen, so buying or donating never needs a scroll. Hidden once the card is visible.
 */
function MobileBuyBar({ product, watch }: { product: Product; watch: React.RefObject<HTMLDivElement | null> }) {
  const { add, busy, quantityOf } = useCart();
  const { triggerToast } = useToast();
  const [visible, setVisible] = useState(false);
  const inCart = quantityOf(product.id, 'self');
  const donated = quantityOf(product.id, 'donation');

  useEffect(() => {
    const el = watch.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), { rootMargin: '0px 0px -80px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [watch]);

  const addOne = async (kind: 'self' | 'donation') => {
    if (await add(product.id, 1, kind)) {
      triggerToast(kind === 'self' ? `${product.name} added to your cart` : 'Thank you! 1 added for a young athlete');
    }
  };

  const status = [inCart && `${inCart} in cart`, donated && `${donated} donated`].filter(Boolean).join(' · ');
  const btn = 'h-11 px-3 flex items-center justify-center gap-1.5 rounded-md text-[13px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition';

  return (
    <div
      className={`md:hidden fixed inset-x-0 bottom-[calc(92px+env(safe-area-inset-bottom))] z-40 px-margin-mobile transition-[transform,opacity] duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
      }`}
      inert={!visible}
    >
      <div className="mx-auto max-w-[480px] flex items-center gap-2 rounded-xl bg-obuya-glass backdrop-blur-xl border border-obuya-line/50 shadow-[0_10px_30px_rgba(40,10,15,0.18)] p-2 pl-3">
        <div className="flex-1 min-w-0">
          <p className="text-[16px] font-bold text-obuya-gold tabular-nums leading-tight">{formatPrice(product.price)}</p>
          <p className="text-[11px] text-obuya-muted truncate">{status || product.name}</p>
        </div>
        <button type="button" onClick={() => addOne('donation')} disabled={!product.inStock || busy} aria-label="Donate Cart: add 1 for a young athlete" className={`${btn} bg-obuya-maroon text-white`}>
          <Icon name="volunteer_activism" size={18} className="text-[#f2c037]" /> Donate Cart
        </button>
        <button type="button" onClick={() => addOne('self')} disabled={!product.inStock || busy} aria-label="My Cart: add 1 for you" className={`${btn} bg-obuya-gold text-white`}>
          <Icon name="add_shopping_cart" size={18} /> {product.inStock ? 'My Cart' : 'Out of stock'}
        </button>
      </div>
    </div>
  );
}
