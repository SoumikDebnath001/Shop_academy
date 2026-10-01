'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import Loader from '@/components/Loader';
import { useToast } from '@/components/ToastProvider';
import { api } from '@/services/api';
import type { Order, OrderStatus } from '@/services/catalog.types';
import ConfirmDialog from '../ConfirmDialog';
import { formatPrice } from '../format';
import { ArtTile } from '../catalog/ProductArt';
import { useCart } from '../shop/CartProvider';
import { productHref } from '../shop/links';

const STATUS: Record<OrderStatus, { label: string; cls: string; icon: string }> = {
  processing: { label: 'Processing', cls: 'bg-obuya-gold/15 text-obuya-gold', icon: 'hourglass_top' },
  shipped: { label: 'On the way', cls: 'bg-[#2f6fb3]/15 text-[#3d7cc0]', icon: 'local_shipping' },
  delivered: { label: 'Delivered', cls: 'bg-obuya-avatar/15 text-obuya-avatar', icon: 'check_circle' },
  cancelled: { label: 'Cancelled', cls: 'bg-obuya-maroon/15 text-obuya-maroon', icon: 'cancel' },
};
const STEPS: OrderStatus[] = ['processing', 'shipped', 'delivered'];
const dateFmt = new Intl.DateTimeFormat('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });

/** Order history: status, items, totals; expand for tracking + lines; buy again; cancel while processing. */
export default function OrdersSection({ onCount }: { onCount?: (n: number) => void }) {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const { add } = useCart();
  const { triggerToast } = useToast();

  useEffect(() => {
    api.getOrders().then((o) => { setOrders(o); onCount?.(o.length); }).catch(() => setOrders([]));
  }, [onCount]);

  const buyAgain = async (order: Order) => {
    const lines = order.lines.filter((l) => l.kind === 'self' && l.product.inStock);
    if (!lines.length) return triggerToast('These items are out of stock right now');
    for (const l of lines) await add(l.product.id, l.quantity, 'self');
    triggerToast(`${lines.length === 1 ? 'Item' : 'Items'} from ${order.number} added to your cart`);
  };

  const cancel = async () => {
    if (!cancelId) return;
    setCancelling(true);
    try {
      setOrders(await api.cancelOrder(cancelId));
      triggerToast('Order cancelled. Your refund is on its way.');
    } catch (e) {
      triggerToast((e as Error).message);
    } finally {
      setCancelling(false);
      setCancelId(null);
    }
  };

  if (!orders) return <Loader label="Loading orders" size={88} className="py-16" />;

  if (!orders.length) {
    return (
      <div className="rounded-lg border border-dashed border-obuya-line/60 py-14 px-6 text-center">
        <Icon name="shopping_bag" size={44} weight={200} className="text-obuya-muted" />
        <p className="mt-2 text-[16px] font-semibold text-obuya-ink">No orders yet</p>
        <p className="mt-1 text-[13px] text-obuya-muted">Your order history will appear here.</p>
        <Link href="/sports" className="mt-5 inline-flex h-10 px-5 items-center rounded-md bg-obuya-gold text-white text-[14px] font-semibold">Start shopping</Link>
      </div>
    );
  }

  return (
    <>
      <ul className="space-y-3 md:space-y-4">
        {orders.map((order) => {
          const status = STATUS[order.status];
          const expanded = open === order.id;
          return (
            <li key={order.id} className="obuya-fade-up rounded-lg bg-obuya-panel border border-obuya-line/30 overflow-hidden">
              <button
                type="button"
                onClick={() => setOpen(expanded ? null : order.id)}
                aria-expanded={expanded}
                className="w-full text-left p-4 md:p-5 hover:bg-obuya-ink/[0.02] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[15px] md:text-[16px] font-semibold text-obuya-ink">{order.number}</p>
                    <p className="text-[12px] text-obuya-muted">Placed {dateFmt.format(new Date(order.placedAt))}</p>
                  </div>
                  <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-semibold ${status.cls}`}>
                    <Icon name={status.icon} size={14} filled /> {status.label}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex -space-x-2">
                    {order.lines.slice(0, 4).map((l, i) => (
                      <ArtTile key={i} image={l.product.image} icon={l.product.icon} iconSize={16} className="w-11 h-11 rounded-full! border-2 border-obuya-panel" />
                    ))}
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] text-obuya-muted">
                      {order.self.count} for you{order.donation.count ? ` · ${order.donation.count} donated` : ''}
                    </p>
                    <p className="text-[16px] font-bold text-obuya-ink tabular-nums">{formatPrice(order.total)}</p>
                  </div>
                </div>
                <span className="mt-2 flex items-center gap-1 text-[12px] font-medium text-obuya-gold">
                  {expanded ? 'Hide details' : 'View details'} <Icon name={expanded ? 'expand_less' : 'expand_more'} size={18} />
                </span>
              </button>

              {expanded && (
                <div className="obuya-fade-up border-t border-obuya-line/30 p-4 md:p-5 space-y-5">
                  {order.status !== 'cancelled' && <Tracker status={order.status} />}

                  <ul className="divide-y divide-obuya-line/30">
                    {order.lines.map((l, i) => (
                      <li key={i} className="flex items-center gap-3 py-3">
                        <Link href={productHref(l.product.id, l.product.ref)} className="w-14 shrink-0">
                          <ArtTile image={l.product.image} icon={l.product.icon} iconSize={20} />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={productHref(l.product.id, l.product.ref)} className="block text-[14px] font-medium text-obuya-ink truncate hover:text-obuya-gold">{l.product.name}</Link>
                          <p className="text-[12px] text-obuya-muted">
                            {l.kind === 'donation' ? 'Donation · not delivered' : l.product.subtitle} · Qty {l.quantity}
                          </p>
                        </div>
                        <span className="text-[14px] font-semibold text-obuya-ink tabular-nums">{formatPrice(l.lineTotal)}</span>
                      </li>
                    ))}
                  </ul>

                  <dl className="text-[13px] space-y-1.5">
                    <Row label={`Items for you (${order.self.count})`} value={formatPrice(order.self.total)} />
                    {order.discount > 0 && <Row label="Academy member discount" value={`−${formatPrice(order.discount)}`} />}
                    {order.donation.count > 0 && <Row label={`For donation (${order.donation.count})`} value={formatPrice(order.donation.total)} />}
                    {order.shipping > 0 && <Row label="Shipping" value={formatPrice(order.shipping)} />}
                    <div className="flex justify-between pt-2 text-[15px] font-bold text-obuya-ink"><dt>Total</dt><dd className="tabular-nums">{formatPrice(order.total)}</dd></div>
                  </dl>

                  {order.deliverTo && (
                    <p className="flex items-center gap-2 text-[13px] text-obuya-muted">
                      <Icon name="location_on" size={18} className="text-obuya-gold" /> Delivering to {order.deliverTo}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2.5">
                    {order.self.count > 0 && (
                      <button type="button" onClick={() => buyAgain(order)} className="h-10 px-4 flex items-center gap-1.5 rounded-md bg-obuya-gold text-white text-[13px] font-semibold hover:brightness-95">
                        <Icon name="replay" size={18} /> Buy again
                      </button>
                    )}
                    {order.status === 'processing' && (
                      <button type="button" onClick={() => setCancelId(order.id)} className="h-10 px-4 rounded-md border border-obuya-maroon/60 text-obuya-maroon text-[13px] font-semibold hover:bg-obuya-maroon hover:text-white transition-colors">
                        Cancel order
                      </button>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <ConfirmDialog
        open={!!cancelId}
        icon="cancel"
        title="Cancel this order?"
        message="We'll stop it before it ships and refund you in full. Donations in this order are cancelled too."
        confirmLabel="Cancel order"
        danger
        busy={cancelling}
        onConfirm={cancel}
        onClose={() => setCancelId(null)}
      />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-obuya-muted">
      <dt>{label}</dt>
      <dd className="text-obuya-ink tabular-nums">{value}</dd>
    </div>
  );
}

/** Placed → On the way → Delivered progress. */
function Tracker({ status }: { status: OrderStatus }) {
  const at = STEPS.indexOf(status);
  const labels = ['Placed', 'On the way', 'Delivered'];
  return (
    <ol className="grid grid-cols-3" aria-label="Order progress">
      {labels.map((label, i) => {
        const done = i <= at;
        return (
          <li key={label} className="relative flex flex-col items-center text-center">
            {i > 0 && <span aria-hidden className={`absolute top-3 right-1/2 w-full h-[2px] ${i <= at ? 'bg-obuya-gold' : 'bg-obuya-line/50'}`} />}
            <span className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center ${done ? 'bg-obuya-gold text-white' : 'bg-obuya-panel border-2 border-obuya-line/60'}`}>
              {done && <Icon name="check" size={15} />}
            </span>
            <span className={`mt-1.5 text-[11px] ${done ? 'text-obuya-ink font-medium' : 'text-obuya-muted'}`}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
