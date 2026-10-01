// TEMPORARY dummy order history (the site cannot place orders until checkout exists). Cancellations made in the UI
// are remembered in this browser. Shapes match services/catalog.types.ts (Order) and api.md.
import type { Order, OrderStatus } from '@/services/catalog.types';
import { buildDummyDetail, findDummyProduct } from './products';

const CANCELLED_KEY = 'obuya.dummy.cancelledOrders';

const SEED: { id: string; number: string; daysAgo: number; status: OrderStatus; lines: [string, 'self' | 'donation', number][]; discount?: boolean }[] = [
  { id: 'ord-3', number: 'OB-24817', daysAgo: 1, status: 'processing', lines: [['apparel-jerseys-1', 'self', 1], ['apparel-jerseys-1', 'donation', 2]] },
  { id: 'ord-2', number: 'OB-24602', daysAgo: 6, status: 'shipped', lines: [['cricket-bats-2', 'self', 1], ['cricket-balls-4', 'self', 3]], discount: true },
  { id: 'ord-1', number: 'OB-24155', daysAgo: 21, status: 'delivered', lines: [['apparel-t-shirts-2', 'self', 2], ['football-footballs-3', 'donation', 5]] },
];

const DAY = 86_400_000;
const SHIPPING = 350;

function readCancelled(): string[] {
  try { return JSON.parse(localStorage.getItem(CANCELLED_KEY) ?? '[]'); } catch { return []; }
}
export function cancelDummyOrder(id: string) {
  try { localStorage.setItem(CANCELLED_KEY, JSON.stringify([...new Set([...readCancelled(), id])])); } catch { /* ignore */ }
}

export function dummyOrders(now = Date.now()): Order[] {
  const cancelled = new Set(readCancelled());
  return SEED.map((o) => {
    const lines = o.lines.flatMap(([productId, kind, quantity]) => {
      const p = findDummyProduct(productId);
      if (!p) return [];
      const { id, name, brand, price, image, icon, ref, inStock } = p;
      return [{ kind, quantity, lineTotal: price * quantity, product: { id, name, brand, price, image, icon, ref, inStock, subtitle: buildDummyDetail(p).subtitle } }];
    });
    const sum = (kind: 'self' | 'donation') =>
      lines.filter((l) => l.kind === kind).reduce((a, l) => ({ count: a.count + l.quantity, total: a.total + l.lineTotal }), { count: 0, total: 0 });
    const self = sum('self');
    const donation = sum('donation');
    const discount = o.discount ? Math.round(self.total * 0.1) : 0;
    return {
      id: o.id,
      number: o.number,
      placedAt: new Date(now - o.daysAgo * DAY).toISOString(),
      status: cancelled.has(o.id) ? 'cancelled' : o.status,
      lines,
      self,
      donation,
      discount,
      shipping: self.count ? SHIPPING : 0,
      total: self.total - discount + donation.total + (self.count ? SHIPPING : 0),
      deliverTo: self.count ? 'Home · Ngong Road, Nairobi' : undefined,
    };
  });
}
