'use client';
import Link from 'next/link';
import type { Cart, CartLine } from '@/services/catalog.types';
import Icon from '@/components/Icon';
import { formatPrice } from '../format';
import { ArtTile } from '../catalog/ProductArt';
import { productHref } from './links';
import QuantityStepper from './QuantityStepper';
import { useCart } from './CartProvider';

/**
 * One cart line from the cart design. Compact on phones (72px art; name + delete on top, price + stepper below),
 * roomier from `sm` up.
 */
export function CartLineRow({ line, onNavigate, large }: { line: CartLine; onNavigate?: () => void; large?: boolean }) {
  const { setQuantity, remove, busy } = useCart();
  const donation = line.kind === 'donation';
  const href = productHref(line.product.id, line.product.ref);
  return (
    <li className="flex gap-3 sm:gap-4 py-3 sm:py-4">
      <Link href={href} onClick={onNavigate} className={`relative shrink-0 self-start w-[72px] ${large ? 'sm:w-32' : 'sm:w-[110px]'}`}>
        <ArtTile image={line.product.image} icon={line.product.icon} className="border border-obuya-line/40 shadow-[0_6px_14px_-8px_rgba(40,10,15,0.35)]" />
        {donation && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-obuya-maroon text-obuya-gold flex items-center justify-center shadow">
            <Icon name="favorite" size={12} filled />
          </span>
        )}
      </Link>
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-start gap-2">
          <Link
            href={href}
            onClick={onNavigate}
            className="flex-1 min-w-0 text-[14px] sm:text-[15px] font-semibold text-obuya-ink leading-snug line-clamp-2 hover:text-obuya-gold transition-colors"
          >
            {line.product.name}
          </Link>
          <button
            type="button"
            aria-label={`Remove ${line.product.name}`}
            disabled={busy}
            onClick={() => remove(line.id)}
            className="-mt-1.5 -mr-1.5 w-8 h-8 shrink-0 flex items-center justify-center rounded-full text-obuya-muted hover:text-obuya-maroon hover:bg-obuya-maroon/10 transition-colors disabled:opacity-50"
          >
            <Icon name="delete" size={19} />
          </button>
        </div>
        {donation ? (
          <span className="mt-1 self-start inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-obuya-maroon text-white text-[10px] sm:text-[11px] font-medium">
            <Icon name="volunteer_activism" size={12} /> Donation · not delivered
          </span>
        ) : (
          <span className="text-[12px] text-obuya-muted line-clamp-1">{line.product.subtitle}</span>
        )}
        <div className="mt-auto pt-2 flex items-center justify-between gap-2">
          <span className="text-[14px] font-semibold text-obuya-ink tabular-nums">{formatPrice(line.lineTotal)}</span>
          <QuantityStepper
            size="sm"
            value={line.quantity}
            disabled={busy}
            label={`Quantity of ${line.product.name}`}
            onChange={(q) => setQuantity(line.id, q)}
          />
        </div>
      </div>
    </li>
  );
}

/** Items for you, then the "For donation" notice and donation items. */
export function CartLineList({ cart, onNavigate, large }: { cart: Cart; onNavigate?: () => void; large?: boolean }) {
  const self = cart.lines.filter((l) => l.kind === 'self');
  const donations = cart.lines.filter((l) => l.kind === 'donation');
  return (
    <div>
      {self.length > 0 && (
        <ul className="divide-y divide-obuya-line/40">
          {self.map((l) => (
            <CartLineRow key={l.id} line={l} onNavigate={onNavigate} large={large} />
          ))}
        </ul>
      )}
      {donations.length > 0 && (
        <>
          <div
            className={`${self.length ? 'mt-2 sm:mt-3' : ''} flex gap-2.5 sm:gap-3 rounded-md border border-obuya-maroon/25 bg-obuya-maroon/10 p-3 sm:p-3.5`}
          >
            <Icon name="volunteer_activism" size={20} className="text-obuya-maroon shrink-0" />
            <div>
              <p className="text-[13px] sm:text-[14px] font-semibold text-obuya-ink">For donation</p>
              <p className="text-[11px] sm:text-[12px] text-obuya-muted leading-snug">
                You pay for these and they go to young athletes through the Obuya Foundation. They won&apos;t be delivered to you.
              </p>
            </div>
          </div>
          <ul className="divide-y divide-obuya-line/40">
            {donations.map((l) => (
              <CartLineRow key={l.id} line={l} onNavigate={onNavigate} large={large} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/** Price breakdown + total. `breakdownClassName` lets the drawer hide the breakdown on phones until asked. */
export function CartSummary({ cart, breakdownClassName = '' }: { cart: Cart; breakdownClassName?: string }) {
  const row = 'flex items-center justify-between text-[13px] sm:text-[14px]';
  return (
    <dl className="space-y-2.5">
      <div className={`space-y-2.5 ${breakdownClassName}`}>
        <div className={row}>
          <dt className="text-obuya-muted">Items for you ({cart.self.count})</dt>
          <dd className="font-medium text-obuya-ink">{formatPrice(cart.self.total)}</dd>
        </div>
        {cart.discount && (
          <div className={row}>
            <dt className="text-obuya-muted flex items-center gap-1.5">
              <Icon name="school" size={16} className="text-obuya-gold" /> Academy member ({cart.discount.percent}%)
            </dt>
            <dd className="font-medium text-obuya-avatar">−{formatPrice(cart.discount.amount)}</dd>
          </div>
        )}
        {cart.donation.count > 0 && (
          <div className={row}>
            <dt className="text-obuya-muted flex items-center gap-1.5">
              <Icon name="volunteer_activism" size={16} className="text-obuya-maroon" /> For donation ({cart.donation.count})
            </dt>
            <dd className="font-medium text-obuya-ink">{formatPrice(cart.donation.total)}</dd>
          </div>
        )}
        <div className={row}>
          <dt className="text-obuya-muted flex items-center gap-1">
            Estimated Shipping
            <span title="Shipping is worked out from your delivery address at checkout. Donated items ship free." className="inline-flex cursor-help">
              <Icon name="info" size={15} />
            </span>
          </dt>
          <dd className="text-obuya-muted">Calculated at checkout</dd>
        </div>
      </div>
      <div className="flex items-center justify-between pt-1 sm:pt-3">
        <dt className="text-[16px] sm:text-[18px] font-semibold text-obuya-ink">Total</dt>
        <dd className="text-[20px] sm:text-[22px] font-bold text-obuya-ink tabular-nums">{formatPrice(cart.total)}</dd>
      </div>
    </dl>
  );
}

export function TrustIcons({ items }: { items: { icon: string; label: string }[] }) {
  return (
    <ul className="grid grid-cols-3 gap-2">
      {items.map((t) => (
        <li key={t.label} className="flex items-center gap-2 text-[11px] leading-tight text-obuya-muted">
          <Icon name={t.icon} size={22} weight={300} className="text-obuya-ink/80 shrink-0" />
          {t.label}
        </li>
      ))}
    </ul>
  );
}

export const CART_TRUST = [
  { icon: 'local_shipping', label: 'Worldwide Shipping' },
  { icon: 'verified_user', label: 'Secure Payments' },
  { icon: 'eco', label: 'Supports Grassroots' },
];
