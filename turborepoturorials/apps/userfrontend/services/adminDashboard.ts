/* =========================
   ADMIN DASHBOARD DATA
   Every function here returns DEMO data with a short fake delay.
   To connect the backend, replace the body of each function with the API call
   written in its "Backend:" comment. The types stay the same, so the UI does not change.
========================= */

import { adminPath } from './adminRoutes';
import { formatMoney } from './currency';

/* ---------- Types ---------- */

export type DateRange = { from: string; to: string }; // yyyy-mm-dd, both days included

export type OrderStatus = 'New' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
export type QuotationStatus = 'New' | 'In Discussion' | 'Quote Sent' | 'Accepted' | 'Declined';
export type SupportStatus = 'Open' | 'In Progress' | 'Resolved';

export type StatKey =
  | 'totalOrders' | 'pendingVendorAck' | 'pendingDispatch'
  | 'pendingQuotations' | 'pendingProductApprovals' | 'openSupportQueries';

export type Stat = { key: StatKey; value: number; changePercent: number };

export type Order = {
  id: string; customer: string; email: string; date: string;
  items: number; amount: number; status: OrderStatus; vendor: string; address: string;
};

export type PendingProduct = {
  id: string; name: string; vendor: string; reason: 'New product' | 'Price change' | 'Details update';
  image: string; price: number; submittedOn: string;
};

export type PendingVendor = {
  id: string; name: string; contact: string; email: string; category: string; appliedOn: string;
};

export type Quotation = {
  id: string; organization: string; contact: string; items: number;
  status: QuotationStatus; date: string; note: string;
};

export type SupportQuery = {
  id: string; vendor: string; subject: string; status: SupportStatus; date: string; message: string;
};

export type DashboardData = {
  stats: Stat[];
  recentOrders: Order[];
  pendingProducts: PendingProduct[];
  pendingVendors: PendingVendor[];
  quotations: Quotation[];
  supportQueries: SupportQuery[];
};

export type SnapshotMetric = 'orders' | 'revenue' | 'quotations' | 'customers';
export type SnapshotPoint = { date: string; value: number };

export type SearchResult = { id: string; type: 'Order' | 'Vendor' | 'Product' | 'Customer' | 'Quotation' | 'Support'; title: string; subtitle: string; href: string };

export type AdminNotification = { id: string; icon: string; title: string; time: string; href: string; read: boolean };

/* ---------- Helpers ---------- */

// Money is formatted by the currency setting (Settings > Currency), amounts here are in KSh
export { formatMoney };

export const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Demo helpers, also used by adminAnalytics.ts
export const delay = <T>(value: T, ms = 350) => new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

// Same range always gives the same numbers, so the demo does not jump around on every render
export const seeded = (seed: string) => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
};

export const daysBetween = (range: DateRange) => {
  const days: string[] = [];
  const cur = new Date(`${range.from}T00:00:00`);
  const end = new Date(`${range.to}T00:00:00`);
  while (cur <= end && days.length < 366) {
    days.push(toIso(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
};

/* ---------- Demo data (kept in memory so actions stick until the page reloads) ---------- */

const demo = {
  orders: [
    { id: '#OB10234', customer: 'John Mwangi', email: 'john.mwangi@example.com', date: '2026-09-16', items: 3, amount: 12500, status: 'New', vendor: 'SprintGear Ltd', address: 'Westlands, Nairobi' },
    { id: '#OB10233', customer: 'Priya Sharma', email: 'priya.sharma@example.com', date: '2026-09-16', items: 1, amount: 4200, status: 'Processing', vendor: 'PlayPro Sports', address: 'Andheri, Mumbai' },
    { id: '#OB10232', customer: 'Nairobi Sports Club', email: 'orders@nairobisc.example.com', date: '2026-09-15', items: 10, amount: 52000, status: 'Shipped', vendor: 'FieldMasters', address: 'Kilimani, Nairobi' },
    { id: '#OB10231', customer: "Alex D'Souza", email: 'alex.dsouza@example.com', date: '2026-09-15', items: 2, amount: 8900, status: 'Delivered', vendor: 'Swift Athletics', address: 'Panaji, Goa' },
    { id: '#OB10230', customer: 'Kenya Youth Academy', email: 'store@kya.example.com', date: '2026-09-14', items: 5, amount: 21000, status: 'Processing', vendor: 'SprintGear Ltd', address: 'Kisumu' },
  ] as Order[],
  pendingProducts: [
    { id: 'P-201', name: 'Cricket Training Bat', vendor: 'SprintGear Ltd', reason: 'New product', image: 'sports_cricket', price: 3499, submittedOn: '2026-09-16' },
    { id: 'P-202', name: 'Football Jersey (Blue)', vendor: 'PlayPro Sports', reason: 'Price change', image: 'apparel', price: 1299, submittedOn: '2026-09-15' },
    { id: 'P-203', name: 'Running Shoes', vendor: 'Swift Athletics', reason: 'New product', image: 'steps', price: 4599, submittedOn: '2026-09-15' },
    { id: 'P-204', name: 'Batting Gloves', vendor: 'FieldMasters', reason: 'Details update', image: 'back_hand', price: 1899, submittedOn: '2026-09-14' },
  ] as PendingProduct[],
  pendingVendors: [
    { id: 'V-031', name: 'Coastline Sports', contact: 'Amina Hassan', email: 'amina@coastline.example.com', category: 'Footwear', appliedOn: '2026-09-16' },
    { id: 'V-032', name: 'Highland Gear Co.', contact: 'Peter Otieno', email: 'peter@highland.example.com', category: 'Cricket equipment', appliedOn: '2026-09-15' },
    { id: 'V-033', name: 'Urban Kits', contact: 'Rahul Menon', email: 'rahul@urbankits.example.com', category: 'Team uniforms', appliedOn: '2026-09-13' },
  ] as PendingVendor[],
  quotations: [
    { id: '#BQ-0012', organization: 'Greenfield School', contact: 'Mrs. Wanjiku', items: 12, status: 'New', date: '2026-09-16', note: '12 cricket kits for the junior team, delivery before October.' },
    { id: '#BQ-0011', organization: 'Nairobi Academy', contact: 'Coach Kamau', items: 25, status: 'In Discussion', date: '2026-09-15', note: 'Football jerseys with school crest, sizes S to XL.' },
    { id: '#BQ-0010', organization: 'Sports for All Kenya', contact: 'Grace Achieng', items: 40, status: 'Quote Sent', date: '2026-09-14', note: 'Mixed equipment for a community tournament.' },
    { id: '#BQ-0009', organization: 'Rising Stars Club', contact: 'Daniel Mutua', items: 18, status: 'New', date: '2026-09-14', note: 'Training cones, balls and bibs.' },
  ] as Quotation[],
  supportQueries: [
    { id: '#VS-0043', vendor: 'SprintGear Ltd', subject: 'Product update', status: 'Open', date: '2026-09-16', message: 'We need to update photos for 3 bats that are already live.' },
    { id: '#VS-0042', vendor: 'PlayPro Sports', subject: 'Order delay', status: 'Open', date: '2026-09-15', message: 'Courier pickup for #OB10233 was missed, please advise.' },
    { id: '#VS-0041', vendor: 'FieldMasters', subject: 'Inventory sync', status: 'In Progress', date: '2026-09-14', message: 'Stock counts on the dashboard do not match our warehouse.' },
    { id: '#VS-0040', vendor: 'Swift Athletics', subject: 'Payment query', status: 'Open', date: '2026-09-14', message: 'August payout is missing two orders.' },
  ] as SupportQuery[],
  notifications: [
    { id: 'n1', icon: 'shopping_cart', title: 'New order #OB10234 from John Mwangi', time: '10 min ago', href: adminPath('/orders'), read: false },
    { id: 'n2', icon: 'request_quote', title: 'Greenfield School asked for a bulk quotation', time: '1 hour ago', href: adminPath('/quotations'), read: false },
    { id: 'n3', icon: 'support_agent', title: 'SprintGear Ltd opened a support query', time: '3 hours ago', href: adminPath('/vendor-support'), read: false },
    { id: 'n4', icon: 'inventory_2', title: 'Running Shoes is waiting for approval', time: 'Yesterday', href: adminPath('/inventory'), read: true },
  ] as AdminNotification[],
};

/* ---------- Dashboard ---------- */

// Backend: GET /admin/dashboard?from=&to=
export async function getDashboard(range: DateRange): Promise<DashboardData> {
  const rand = seeded(`${range.from}:${range.to}`);
  const scale = Math.max(1, daysBetween(range).length) / 30;
  const vary = (base: number) => Math.max(0, Math.round(base * scale * (0.85 + rand() * 0.3)));
  const change = () => Math.round((rand() * 30 - 8) * 10) / 10;

  const stats: Stat[] = [
    { key: 'totalOrders', value: vary(524), changePercent: change() },
    { key: 'pendingVendorAck', value: vary(38), changePercent: change() },
    { key: 'pendingDispatch', value: vary(27), changePercent: change() },
    { key: 'pendingQuotations', value: demo.quotations.filter((q) => q.status === 'New' || q.status === 'In Discussion').length + vary(4), changePercent: change() },
    { key: 'pendingProductApprovals', value: demo.pendingProducts.length + 10, changePercent: change() },
    { key: 'openSupportQueries', value: demo.supportQueries.filter((q) => q.status !== 'Resolved').length + 3, changePercent: change() },
  ];

  return delay({
    stats,
    recentOrders: demo.orders.map((o) => ({ ...o })),
    pendingProducts: demo.pendingProducts.map((p) => ({ ...p })),
    pendingVendors: demo.pendingVendors.map((v) => ({ ...v })),
    quotations: demo.quotations.map((q) => ({ ...q })),
    supportQueries: demo.supportQueries.map((s) => ({ ...s })),
  });
}

// Backend: GET /admin/dashboard/snapshot?metric=&from=&to=
export async function getSnapshot(range: DateRange, metric: SnapshotMetric): Promise<SnapshotPoint[]> {
  const rand = seeded(`${metric}:${range.from}:${range.to}`);
  const base = { orders: 90, revenue: 150000, quotations: 6, customers: 25 }[metric];
  const points = daysBetween(range).map((date, i, all) => {
    const trend = 0.6 + (i / Math.max(1, all.length - 1)) * 0.8; // gently rising, like the demo image
    return { date, value: Math.round(base * trend * (0.5 + rand())) };
  });
  return delay(points, 250);
}

/* ---------- Approvals ---------- */

// Backend: POST /admin/products/:id/approve  or  /reject  (body: { reason })
export async function reviewProduct(id: string, decision: 'approve' | 'reject'): Promise<void> {
  void decision; // the demo just removes it from the queue, the real API decides what happens next
  demo.pendingProducts = demo.pendingProducts.filter((p) => p.id !== id);
  return delay(undefined, 300);
}

// Backend: POST /admin/vendors/:id/approve  or  /reject  (body: { reason })
export async function reviewVendor(id: string, decision: 'approve' | 'reject'): Promise<void> {
  void decision;
  demo.pendingVendors = demo.pendingVendors.filter((v) => v.id !== id);
  return delay(undefined, 300);
}

/* ---------- Status changes ---------- */

// Backend: PATCH /admin/orders/:id  (body: { status })
export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  demo.orders = demo.orders.map((o) => (o.id === id ? { ...o, status } : o));
  return delay(undefined, 250);
}

// Backend: PATCH /admin/quotations/:id  (body: { status })
export async function updateQuotationStatus(id: string, status: QuotationStatus): Promise<void> {
  demo.quotations = demo.quotations.map((q) => (q.id === id ? { ...q, status } : q));
  return delay(undefined, 250);
}

// Backend: PATCH /admin/support/:id  (body: { status })
export async function updateSupportStatus(id: string, status: SupportStatus): Promise<void> {
  demo.supportQueries = demo.supportQueries.map((s) => (s.id === id ? { ...s, status } : s));
  return delay(undefined, 250);
}

/* ---------- Search ---------- */

// Backend: GET /admin/search?q=
export async function searchAdmin(query: string): Promise<SearchResult[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const has = (...values: string[]) => values.some((v) => v.toLowerCase().includes(q));
  const results: SearchResult[] = [];
  const vendors = new Set<string>();

  for (const o of demo.orders) {
    if (has(o.id, o.customer, o.email)) results.push({ id: `o-${o.id}`, type: 'Order', title: o.id, subtitle: `${o.customer} · ${formatMoney(o.amount)}`, href: adminPath(`/orders?q=${encodeURIComponent(o.id)}`) });
    if (has(o.customer)) results.push({ id: `c-${o.email}`, type: 'Customer', title: o.customer, subtitle: o.email, href: adminPath(`/customers?q=${encodeURIComponent(o.customer)}`) });
    if (has(o.vendor)) vendors.add(o.vendor);
  }
  for (const p of demo.pendingProducts) {
    if (has(p.name, p.vendor)) results.push({ id: `p-${p.id}`, type: 'Product', title: p.name, subtitle: `By ${p.vendor}`, href: adminPath(`/inventory?q=${encodeURIComponent(p.name)}`) });
  }
  for (const v of demo.pendingVendors) if (has(v.name, v.contact)) vendors.add(v.name);
  for (const s of demo.supportQueries) {
    if (has(s.vendor)) vendors.add(s.vendor);
    if (has(s.id, s.subject, s.vendor)) results.push({ id: `s-${s.id}`, type: 'Support', title: `${s.id} · ${s.subject}`, subtitle: s.vendor, href: adminPath(`/vendor-support?q=${encodeURIComponent(s.id)}`) });
  }
  for (const qt of demo.quotations) {
    if (has(qt.id, qt.organization, qt.contact)) results.push({ id: `q-${qt.id}`, type: 'Quotation', title: `${qt.id} · ${qt.organization}`, subtitle: `${qt.items} items · ${qt.status}`, href: adminPath(`/quotations?q=${encodeURIComponent(qt.id)}`) });
  }
  vendors.forEach((name) => results.push({ id: `v-${name}`, type: 'Vendor', title: name, subtitle: 'Vendor', href: adminPath(`/vendors?q=${encodeURIComponent(name)}`) }));

  // Customers can appear once per order, keep the first
  const unique = results.filter((r, i) => results.findIndex((x) => x.id === r.id) === i);
  return delay(unique.slice(0, 12), 150);
}

/* ---------- Notifications ---------- */

// Backend: GET /admin/notifications
export async function getNotifications(): Promise<AdminNotification[]> {
  return delay(demo.notifications.map((n) => ({ ...n })), 200);
}

// Backend: POST /admin/notifications/read  (body: { ids } , no ids = all)
export async function markNotificationsRead(ids?: string[]): Promise<void> {
  demo.notifications = demo.notifications.map((n) => (!ids || ids.includes(n.id) ? { ...n, read: true } : n));
  return delay(undefined, 150);
}
