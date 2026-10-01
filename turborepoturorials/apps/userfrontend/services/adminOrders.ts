/* =========================
   ADMIN ORDERS DATA
   Every function here returns DEMO data with a short fake delay.
   To connect the backend, replace the body of each function with the API call
   written in its "Backend:" comment. The types stay the same, so the UI does not change.
   (api.ts already has getAdminOrders / getAdminOrderById / updateOrderStatus for the real endpoints.)
========================= */

import { DateRange, delay, seeded, toIso } from './adminDashboard';

/* ---------- Types ---------- */

export const ORDER_STATUSES = ['New', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Return/Refund'] as const;
export const PAYMENT_STATUSES = ['Paid', 'Pending', 'Failed', 'Refunded'] as const;
export const ORDER_TYPES = ['Normal', 'Bulk', 'Foundation'] as const;

export type OrderStatus = typeof ORDER_STATUSES[number];
export type PaymentStatus = typeof PAYMENT_STATUSES[number];
export type OrderType = typeof ORDER_TYPES[number];

export type OrderLine = { product: string; vendor: string; quantity: number; price: number };

export type AdminOrder = {
  id: string;
  placedAt: string; // ISO date time
  customer: { name: string; email: string; phone: string };
  address: { line: string; city: string; country: string };
  lines: OrderLine[];
  items: number;
  subtotal: number;
  shipping: number;
  total: number;
  paymentStatus: PaymentStatus;
  payment: { method: string; transactionId: string; paidAt: string | null };
  status: OrderStatus;
  type: OrderType;
  vendors: { name: string; items: number }[];
};

export type OrderSortKey = 'placedAt' | 'total' | 'items';

export type OrderQuery = {
  range: DateRange;
  search?: string;
  status?: OrderStatus | 'All';
  payment?: PaymentStatus | 'All';
  vendor?: string | 'All';
  type?: OrderType | 'All';
  sort?: { key: OrderSortKey; dir: 'asc' | 'desc' };
  page: number;
  perPage: number;
};

export type OrderListResult = {
  rows: AdminOrder[];
  total: number; // matching the filters, before paging
  statusCounts: Record<OrderStatus | 'All', number>; // for the tabs, with every filter except status applied
};

/* ---------- Demo data ---------- */

const PRODUCTS: { name: string; vendor: string; price: number }[] = [
  { name: 'Cricket Training Bat', vendor: 'SprintGear Ltd', price: 3500 },
  { name: 'Batting Gloves', vendor: 'SprintGear Ltd', price: 1800 },
  { name: 'Cricket Ball (Leather)', vendor: 'SprintGear Ltd', price: 900 },
  { name: 'Football Jersey (Blue)', vendor: 'PlayPro Sports', price: 1300 },
  { name: 'Football (Size 5)', vendor: 'PlayPro Sports', price: 2100 },
  { name: 'Training Cones (Set of 10)', vendor: 'FieldMasters', price: 900 },
  { name: 'Goal Net', vendor: 'FieldMasters', price: 6500 },
  { name: 'Running Shoes', vendor: 'Swift Athletics', price: 4600 },
  { name: 'Track Spikes', vendor: 'Swift Athletics', price: 3900 },
  { name: 'Goalkeeper Gloves', vendor: 'GoalLine Kenya', price: 1800 },
];

export const ORDER_VENDORS = [...new Set(PRODUCTS.map((p) => p.vendor))];

const FIRST = ['John', 'Priya', 'Alex', 'Fatima', 'David', 'Laxmi', 'Samuel', 'Grace', 'Rahul', 'Amina', 'Peter', 'Mary', 'Kevin', 'Aisha', 'Brian', 'Nisha'];
const LAST = ['Mwangi', 'Sharma', "D'Souza", 'Ali', 'Kimani', 'Rao', 'Otieno', 'Achieng', 'Menon', 'Hassan', 'Kamau', 'Wanjiru', 'Omondi', 'Njeri', 'Patel', 'Mutua'];
const ORGS = ['Nairobi Sports Club', 'Kenya Youth Academy', 'Greenfield School', 'Rising Stars Club', 'Sports for All Kenya', 'Nairobi Academy'];
const PLACES = [
  { line: '123 Riverside Drive', city: 'Nairobi', country: 'Kenya' },
  { line: '14 Moi Avenue', city: 'Mombasa', country: 'Kenya' },
  { line: '7 Oginga Odinga St', city: 'Kisumu', country: 'Kenya' },
  { line: '22 Linking Road', city: 'Mumbai', country: 'India' },
  { line: '5 Park Street', city: 'Kolkata', country: 'India' },
  { line: '48 Baker Street', city: 'London', country: 'United Kingdom' },
];
const METHODS = ['M-Pesa', 'Card', 'Bank Transfer', 'UPI'];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '');

// Builds one order from its number; the same number always gives the same order
function makeOrder(n: number, placedAt: Date, preset?: Partial<{ customer: string; items: number; total: number; payment: PaymentStatus; status: OrderStatus; vendors: number; type: OrderType }>): AdminOrder {
  const rand = seeded(`order:${n}`);
  const pick = <T>(list: readonly T[]) => list[Math.floor(rand() * list.length)];

  const type: OrderType = preset?.type ?? (rand() < 0.12 ? 'Bulk' : rand() < 0.06 ? 'Foundation' : 'Normal');
  const isOrg = type !== 'Normal';
  const name = preset?.customer ?? (isOrg ? pick(ORGS) : `${pick(FIRST)} ${pick(LAST)}`);

  // Pick products from 1-3 vendors
  const vendorCount = preset?.vendors ?? (type === 'Bulk' ? 3 : rand() < 0.7 ? 1 : 2);
  const vendors = [...ORDER_VENDORS].sort(() => rand() - 0.5).slice(0, vendorCount);
  const targetItems = preset?.items ?? (type === 'Bulk' ? 8 + Math.floor(rand() * 20) : 1 + Math.floor(rand() * 5));
  const lines: OrderLine[] = [];
  for (let i = 0; i < targetItems; i++) {
    const vendor = vendors[i % vendors.length];
    const options = PRODUCTS.filter((p) => p.vendor === vendor);
    const product = options[Math.floor(rand() * options.length)];
    const existing = lines.find((l) => l.product === product.name);
    if (existing) existing.quantity += 1;
    else lines.push({ product: product.name, vendor, quantity: 1, price: product.price });
  }

  // Orders from the design keep their exact totals: scale the prices so the items add up to it
  if (preset?.total) {
    const target = preset.total - (preset.total >= 20000 ? 0 : 500);
    const current = lines.reduce((s, l) => s + l.quantity * l.price, 0);
    lines.forEach((l) => { l.price = Math.round((l.price * target) / current / 10) * 10; });
    const diff = target - lines.reduce((s, l) => s + l.quantity * l.price, 0);
    const single = lines.find((l) => l.quantity === 1);
    if (single) single.price += diff;
    else lines[0].price += Math.round(diff / lines[0].quantity);
  }

  const subtotal = lines.reduce((s, l) => s + l.quantity * l.price, 0);
  const shipping = subtotal >= 20000 ? 0 : 500;

  const status: OrderStatus = preset?.status ?? (() => {
    const r = rand();
    return r < 0.08 ? 'New' : r < 0.3 ? 'Processing' : r < 0.84 ? 'Shipped' : r < 0.96 ? 'Delivered' : r < 0.99 ? 'Cancelled' : 'Return/Refund';
  })();
  const paymentStatus: PaymentStatus = preset?.payment ?? (
    status === 'Return/Refund' ? 'Refunded' : status === 'Cancelled' ? 'Failed' : status === 'New' && rand() < 0.3 ? 'Pending' : 'Paid'
  );

  const method = pick(METHODS);
  const paidAt = paymentStatus === 'Paid' || paymentStatus === 'Refunded' ? new Date(placedAt.getTime() + 60000).toISOString() : null;

  return {
    id: `#OB${10000 + n}`,
    placedAt: placedAt.toISOString(),
    customer: {
      name,
      email: isOrg ? `orders@${slug(name).replace(/\./g, '')}.example.com` : `${slug(name)}@example.com`,
      phone: `+254 7${Math.floor(10 + rand() * 89)} ${Math.floor(100 + rand() * 899)} ${Math.floor(100 + rand() * 899)}`,
    },
    address: pick(PLACES),
    lines,
    items: lines.reduce((s, l) => s + l.quantity, 0),
    subtotal,
    shipping,
    total: subtotal + shipping,
    paymentStatus,
    payment: { method, transactionId: `${method === 'M-Pesa' ? 'MPESA' : 'TXN'}${Math.floor(100000000 + rand() * 899999999)}`, paidAt },
    status,
    type,
    vendors: vendors.map((v) => ({ name: v, items: lines.filter((l) => l.vendor === v).reduce((s, l) => s + l.quantity, 0) })).filter((v) => v.items > 0),
  };
}

// The first ten orders match the design image, the rest are generated going back in time
const DESIGN_ROWS = [
  { customer: 'John Mwangi', day: 16, items: 3, total: 13000, payment: 'Paid', status: 'New', vendors: 2, type: 'Normal' },
  { customer: 'Priya Sharma', day: 16, items: 1, total: 4200, payment: 'Paid', status: 'Processing', vendors: 1, type: 'Normal' },
  { customer: 'Nairobi Sports Club', day: 15, items: 10, total: 52000, payment: 'Paid', status: 'Shipped', vendors: 3, type: 'Bulk' },
  { customer: "Alex D'Souza", day: 15, items: 2, total: 8900, payment: 'Paid', status: 'Delivered', vendors: 1, type: 'Normal' },
  { customer: 'Kenya Youth Academy', day: 14, items: 5, total: 21000, payment: 'Paid', status: 'Processing', vendors: 2, type: 'Foundation' },
  { customer: 'Fatima Ali', day: 14, items: 1, total: 3500, payment: 'Pending', status: 'New', vendors: 1, type: 'Normal' },
  { customer: 'David Kimani', day: 13, items: 4, total: 16800, payment: 'Paid', status: 'Shipped', vendors: 1, type: 'Normal' },
  { customer: 'Laxmi Rao', day: 13, items: 6, total: 28000, payment: 'Paid', status: 'Processing', vendors: 2, type: 'Bulk' },
  { customer: 'Greenfield School', day: 12, items: 12, total: 75000, payment: 'Paid', status: 'Delivered', vendors: 3, type: 'Bulk' },
  { customer: 'Samuel Otieno', day: 12, items: 1, total: 2800, payment: 'Failed', status: 'Cancelled', vendors: 1, type: 'Normal' },
] as const;

const TOTAL_DEMO_ORDERS = 900;

let orders: AdminOrder[] = (() => {
  const list: AdminOrder[] = DESIGN_ROWS.map((d, i) =>
    makeOrder(234 - i, new Date(2026, 8, d.day, 18 - i, 24), { ...d }));
  // About 30 orders a day before 12 Sep 2026
  const start = new Date(2026, 8, 12, 9, 0).getTime();
  for (let i = 0; list.length < TOTAL_DEMO_ORDERS; i++) {
    list.push(makeOrder(224 - i, new Date(start - (i + 1) * 48 * 60000)));
  }
  return list;
})();

/* ---------- Queries ---------- */

// Compares the order's local calendar day with the range, both days included
const inRange = (o: AdminOrder, range: DateRange) => {
  const day = toIso(new Date(o.placedAt));
  return day >= range.from && day <= range.to;
};

const matchesSearch = (o: AdminOrder, search: string) => {
  const q = search.trim().toLowerCase().replace(/^#/, '');
  if (!q) return true;
  return [o.id.replace('#', ''), o.customer.name, o.customer.email, ...o.vendors.map((v) => v.name), ...o.lines.map((l) => l.product)]
    .some((v) => v.toLowerCase().includes(q));
};

const applyFilters = (q: OrderQuery, skipStatus = false) => orders.filter((o) =>
  inRange(o, q.range)
  && matchesSearch(o, q.search ?? '')
  && (skipStatus || !q.status || q.status === 'All' || o.status === q.status)
  && (!q.payment || q.payment === 'All' || o.paymentStatus === q.payment)
  && (!q.vendor || q.vendor === 'All' || o.vendors.some((v) => v.name === q.vendor))
  && (!q.type || q.type === 'All' || o.type === q.type));

const sortRows = (rows: AdminOrder[], sort: OrderQuery['sort']) => {
  const { key, dir } = sort ?? { key: 'placedAt', dir: 'desc' };
  const sign = dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => (key === 'placedAt' ? a.placedAt.localeCompare(b.placedAt) : a[key] - b[key]) * sign);
};

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

// Backend: GET /admin/order?from=&to=&search=&status=&payment=&vendor=&type=&sort=&page=&limit=
export async function listOrders(q: OrderQuery): Promise<OrderListResult> {
  const withoutStatus = applyFilters(q, true);
  const matching = sortRows(q.status && q.status !== 'All' ? withoutStatus.filter((o) => o.status === q.status) : withoutStatus, q.sort);

  const statusCounts = Object.fromEntries([['All', withoutStatus.length], ...ORDER_STATUSES.map((s) => [s, withoutStatus.filter((o) => o.status === s).length])]) as OrderListResult['statusCounts'];
  const start = (q.page - 1) * q.perPage;

  return delay({ rows: clone(matching.slice(start, start + q.perPage)), total: matching.length, statusCounts }, 300);
}

// Backend: GET /admin/order/:id
export async function getOrder(id: string): Promise<AdminOrder> {
  const found = orders.find((o) => o.id === id);
  if (!found) throw new Error(`Order ${id} was not found`);
  return delay(clone(found), 200);
}

// Backend: PATCH /admin/order/:id/status  (body: { status }) — one call per order, or a bulk endpoint
export async function updateOrdersStatus(ids: string[], status: OrderStatus): Promise<void> {
  orders = orders.map((o) => {
    if (!ids.includes(o.id)) return o;
    const paymentStatus: PaymentStatus = status === 'Return/Refund' && o.paymentStatus === 'Paid' ? 'Refunded' : o.paymentStatus;
    return { ...o, status, paymentStatus };
  });
  return delay(undefined, 300);
}

// Backend: GET /admin/order/export?...same filters  (or build the file on the server)
export async function exportOrders(q: Omit<OrderQuery, 'page' | 'perPage'>, onlyIds?: string[]): Promise<AdminOrder[]> {
  const rows = onlyIds?.length ? orders.filter((o) => onlyIds.includes(o.id)) : applyFilters({ ...q, page: 1, perPage: 0 });
  return delay(clone(sortRows(rows, q.sort)), 200);
}
