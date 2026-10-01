/* =========================
   ADMIN VENDORS DATA
   Every function here returns DEMO data with a short fake delay.
   To connect the backend, replace the body of each function with the API call
   written in its "Backend:" comment. The types stay the same, so the UI does not change.
========================= */

import { delay, seeded, toIso } from './adminDashboard';

/* ---------- Types ---------- */

export const VENDOR_STATUSES = ['Active', 'Pending', 'Suspended', 'Inactive'] as const;
export const VENDOR_CATEGORIES = ['Cricket', 'Football', 'Athletics', 'Training Equipment', 'Multi-Sport', 'Apparel', 'Basketball', 'Youth Gear'] as const;
export const VENDOR_COUNTRIES = ['Kenya', 'Uganda', 'Tanzania', 'India'] as const;

export type VendorStatus = typeof VENDOR_STATUSES[number];
export type VendorTab = 'All' | 'Pending' | 'Suspended' | 'Inactive';
export type VendorSortKey = 'name' | 'products' | 'totalOrders' | 'fulfilledPct' | 'rating' | 'joinedAt';

export type AdminVendor = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  categories: string[]; // first one is the main category
  products: number;
  totalOrders: number;
  fulfilledPct: number;
  rating: number;
  status: VendorStatus;
  joinedAt: string; // yyyy-mm-dd
  verified: boolean;
};

export type VendorWeek = { weekStart: string; orders: number; revenue: number };
export type VendorActivity = { at: string; text: string; kind: 'product' | 'order' | 'profile' | 'status' };
export type VendorProduct = { name: string; price: number; stock: number; status: 'Live' | 'Pending' | 'Unpublished' };
export type VendorOrder = { id: string; date: string; customer: string; total: number; status: 'Delivered' | 'Shipped' | 'Processing' | 'New' };

export type VendorDetail = AdminVendor & {
  performance: { orders: number; fulfilment: number; returns: number; rating: number }; // last 3 months
  weeks: VendorWeek[]; // last 13 weeks, oldest first
  activity: VendorActivity[]; // newest first
  productList: VendorProduct[];
  recentOrders: VendorOrder[];
};

export type VendorQuery = {
  tab: VendorTab;
  search?: string;
  status?: VendorStatus | 'All';
  category?: string | 'All';
  country?: string | 'All';
  sort?: { key: VendorSortKey; dir: 'asc' | 'desc' };
  page: number;
  perPage: number;
};

export type VendorSummary = { total: number; active: number; pending: number; suspended: number; newThisYear: number; totalChangePercent: number };
export type VendorListResult = { rows: AdminVendor[]; total: number; tabCounts: Record<VendorTab, number> };
export type NewVendor = { name: string; email: string; phone: string; city: string; country: string; categories: string[] };

/* ---------- Demo data ---------- */

type Row = [string, string, number, number, number, number, VendorStatus, string];
// name, main category, products, orders, fulfilled %, rating, status, joined — the first ten match the design image
const DESIGN: Row[] = [
  ['SprintGear Ltd', 'Cricket', 24, 342, 96, 4.7, 'Active', '2025-01-12'],
  ['PlayPro Sports', 'Football', 18, 210, 92, 4.5, 'Active', '2025-02-03'],
  ['Swift Athletics', 'Athletics', 12, 156, 94, 4.6, 'Active', '2025-02-15'],
  ['FieldMasters', 'Training Equipment', 20, 189, 89, 4.3, 'Active', '2025-03-01'],
  ['GoalLine Kenya', 'Football', 16, 98, 90, 4.4, 'Active', '2025-03-12'],
  ['East Africa Sports', 'Multi-Sport', 28, 275, 95, 4.8, 'Active', '2025-03-20'],
  ['The Kit Room', 'Apparel', 14, 132, 88, 4.2, 'Pending', '2025-04-10'],
  ['ProEdge Equipment', 'Training Equipment', 10, 76, 91, 4.1, 'Active', '2025-04-22'],
  ['GameOn Supplies', 'Basketball', 8, 64, 87, 4.0, 'Suspended', '2025-05-05'],
  ['Rising Stars Gear', 'Youth Gear', 6, 48, 100, 4.9, 'Active', '2025-06-18'],
];

const EXTRA_NAMES = [
  'Savannah Sports Co', 'Highland Athletics', 'Coastal Kit Supply', 'Victory Cricket House', 'Lakeside Sports Hub', 'Unity Team Wear',
  'Summit Fitness Gear', 'Eagle Eye Equipment', 'Riverbank Balls Ltd', 'Starlight Sportswear', 'Greenfield Gear', 'Kilimanjaro Outfitters',
  'Nile Sports Traders', 'Rift Valley Runners', 'Serengeti Sports', 'Mombasa Marine Sports', 'Kisumu Kit Co', 'Nakuru Net & Goal',
  'Eldoret Track Supply', 'Thika Team Store', 'Bat & Ball Traders', 'Pitch Perfect Ltd', 'Court Kings', 'Youth League Supplies',
  'Champions Corner', 'Fast Lane Athletics', 'Golden Glove Sports', 'Matchday Merch',
];
const CITIES: Record<string, string[]> = { Kenya: ['Nairobi', 'Mombasa', 'Kisumu', 'Eldoret'], Uganda: ['Kampala'], Tanzania: ['Arusha', 'Dar es Salaam'], India: ['Mumbai'] };

const domain = (name: string) => name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z]+/g, '');

let vendors: AdminVendor[] = (() => {
  const list: AdminVendor[] = DESIGN.map(([name, cat, products, orders, pct, rating, status, joined], i) => {
    const rand = seeded(`vendor:${i}`);
    const second = VENDOR_CATEGORIES[(VENDOR_CATEGORIES.indexOf(cat as typeof VENDOR_CATEGORIES[number]) + 3) % VENDOR_CATEGORIES.length];
    return {
      id: `VEN-${101 + i}`, name, email: `info@${domain(name)}.co.ke`,
      phone: i === 0 ? '+254 712 345 678' : `+254 7${Math.floor(10 + rand() * 89)} ${Math.floor(100 + rand() * 899)} ${Math.floor(100 + rand() * 899)}`,
      city: 'Nairobi', country: 'Kenya',
      categories: i === 0 ? ['Cricket', 'Training Equipment'] : [cat, second],
      products, totalOrders: orders, fulfilledPct: pct, rating, status, joinedAt: joined, verified: status !== 'Pending',
    };
  });

  // 28 more: 3 pending and 1 suspended among them, 18 joined in 2026
  EXTRA_NAMES.forEach((name, n) => {
    const rand = seeded(`vendor-extra:${n}`);
    const country = n % 5 === 4 ? VENDOR_COUNTRIES[1 + (n % 3)] : 'Kenya';
    const cities = CITIES[country];
    const status: VendorStatus = n < 3 ? 'Pending' : n === 3 ? 'Suspended' : 'Active';
    const joined = n < 18 ? new Date(2026, Math.floor(rand() * 8), 1 + Math.floor(rand() * 27)) : new Date(2025, 6 + Math.floor(rand() * 5), 1 + Math.floor(rand() * 27));
    const main = VENDOR_CATEGORIES[n % VENDOR_CATEGORIES.length];
    const products = status === 'Pending' ? Math.floor(2 + rand() * 6) : Math.floor(4 + rand() * 20);
    list.push({
      id: `VEN-${111 + n}`, name, email: `hello@${domain(name)}.com`,
      phone: `${country === 'Kenya' ? '+254 7' : country === 'India' ? '+91 9' : country === 'Uganda' ? '+256 7' : '+255 7'}${Math.floor(10 + rand() * 89)} ${Math.floor(100 + rand() * 899)} ${Math.floor(100 + rand() * 899)}`,
      city: cities[Math.floor(rand() * cities.length)], country,
      categories: [main],
      products,
      totalOrders: status === 'Pending' ? 0 : Math.floor(12 + rand() * 180),
      fulfilledPct: status === 'Pending' ? 0 : Math.floor(84 + rand() * 16),
      rating: status === 'Pending' ? 0 : Math.round((3.8 + rand() * 1.1) * 10) / 10,
      status, joinedAt: toIso(joined), verified: status !== 'Pending',
    });
  });
  return list;
})();

const activityById: Record<string, VendorActivity[]> = {};

/* ---------- Helpers ---------- */

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

const inTab = (v: AdminVendor, tab: VendorTab) => tab === 'All' || v.status === tab;

const matches = (v: AdminVendor, q: VendorQuery) => {
  const text = (q.search ?? '').trim().toLowerCase();
  return (!text || [v.name, v.email, v.city, ...v.categories].some((x) => x.toLowerCase().includes(text)))
    && (!q.status || q.status === 'All' || v.status === q.status)
    && (!q.category || q.category === 'All' || v.categories.includes(q.category))
    && (!q.country || q.country === 'All' || v.country === q.country);
};

/* ---------- Queries ---------- */

// Backend: GET /admin/vendors/summary
export async function getVendorSummary(): Promise<VendorSummary> {
  const year = String(new Date().getFullYear());
  return delay({
    total: vendors.length,
    active: vendors.filter((v) => v.status === 'Active').length,
    pending: vendors.filter((v) => v.status === 'Pending').length,
    suspended: vendors.filter((v) => v.status === 'Suspended').length,
    newThisYear: vendors.filter((v) => v.joinedAt.startsWith(year)).length,
    totalChangePercent: 12,
  }, 250);
}

// Backend: GET /admin/vendors?tab=&search=&status=&category=&country=&sort=&page=&limit=
export async function listVendors(q: VendorQuery): Promise<VendorListResult> {
  const filtered = vendors.filter((v) => matches(v, q));
  const { key, dir } = q.sort ?? { key: 'joinedAt', dir: 'asc' };
  const sign = dir === 'asc' ? 1 : -1;
  const rows = filtered
    .filter((v) => inTab(v, q.tab))
    .sort((a, b) => (key === 'name' || key === 'joinedAt' ? a[key].localeCompare(b[key]) : a[key] - b[key]) * sign);
  const start = (q.page - 1) * q.perPage;
  return delay({
    rows: clone(rows.slice(start, start + q.perPage)),
    total: rows.length,
    tabCounts: {
      All: filtered.length,
      Pending: filtered.filter((v) => v.status === 'Pending').length,
      Suspended: filtered.filter((v) => v.status === 'Suspended').length,
      Inactive: filtered.filter((v) => v.status === 'Inactive').length,
    },
  }, 300);
}

const PRODUCT_NAMES: Record<string, string[]> = {
  Cricket: ['Cricket Training Bat', 'Cricket Bat Pro', 'Batting Gloves', 'Cricket Pads', 'Leather Cricket Ball', 'Cricket Helmet'],
  Football: ['Football (Size 5)', 'Football Jersey (Blue)', 'Goalkeeper Gloves', 'Shin Guards', 'Training Bibs (Set of 10)'],
  Athletics: ['Running Shoes', 'Track Spikes', 'Relay Baton Set', 'Stopwatch'],
  'Training Equipment': ['Training Cones (Set of 10)', 'Agility Ladder', 'Speed Hurdles', 'Resistance Bands'],
  'Multi-Sport': ['Team Water Bottle', 'Sports Bag', 'First Aid Kit', 'Whistle & Lanyard'],
  Apparel: ['Team Tracksuit', 'Training T-Shirt', 'Sports Socks (3 pack)', 'Rain Jacket'],
  Basketball: ['Basketball (Size 7)', 'Basketball Net', 'Basketball Jersey'],
  'Youth Gear': ['Junior Cricket Bat', 'Kids Football (Size 3)', 'Youth Shin Guards'],
};
const CUSTOMERS = ['John Mwangi', 'Priya Sharma', 'Nairobi Sports Club', 'Greenfield School', 'Kenya Youth Academy', 'Fatima Ali', 'David Kimani', 'Rising Stars Club'];

// Backend: GET /admin/vendors/:id  (with performance, weekly numbers, activity, products and recent orders)
export async function getVendor(id: string): Promise<VendorDetail> {
  const v = vendors.find((x) => x.id === id);
  if (!v) throw new Error('This vendor was not found');
  const rand = seeded(`vendor-detail:${id}`);
  const active = v.status !== 'Pending';

  // 13 weeks of orders, gently rising, ending this week
  const today = new Date();
  const weeks: VendorWeek[] = Array.from({ length: 13 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (12 - i) * 7 - d.getDay());
    const orders = active ? Math.max(0, Math.round((v.totalOrders / 110) * (0.6 + (i / 12) * 0.9) * (0.7 + rand() * 0.6))) : 0;
    return { weekStart: toIso(d), orders, revenue: orders * Math.round(2500 + rand() * 3000) };
  });
  const orders3m = weeks.reduce((s, w) => s + w.orders, 0);

  const names = v.categories.flatMap((c) => PRODUCT_NAMES[c] ?? []);
  const productList: VendorProduct[] = Array.from({ length: v.products }, (_, i) => ({
    name: `${names[i % names.length]}${i >= names.length ? ` (Variant ${Math.floor(i / names.length) + 1})` : ''}`,
    price: Math.round((800 + rand() * 5200) / 50) * 50,
    stock: Math.floor(rand() * 200),
    status: !active ? 'Pending' : rand() < 0.85 ? 'Live' : rand() < 0.5 ? 'Pending' : 'Unpublished',
  }));

  const recentOrders: VendorOrder[] = active ? Array.from({ length: Math.min(10, v.totalOrders) }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - i * 2 - Math.floor(rand() * 2));
    const r = rand();
    return {
      id: `#OB${10234 - i * 7 - Math.floor(rand() * 5)}`,
      date: toIso(d),
      customer: CUSTOMERS[Math.floor(rand() * CUSTOMERS.length)],
      total: Math.round((2000 + rand() * 30000) / 100) * 100,
      status: i < 1 ? 'New' : i < 3 ? 'Processing' : r < 0.4 ? 'Shipped' : 'Delivered',
    };
  }) : [];

  const hoursAgo = (h: number) => new Date(Date.now() - h * 3600000).toISOString();
  const base: VendorActivity[] = active ? [
    { at: hoursAgo(2), text: `Product update submitted (${productList[0]?.name ?? 'product'})`, kind: 'product' },
    { at: hoursAgo(5), text: `Order ${recentOrders[0]?.id ?? '#OB10234'} dispatched`, kind: 'order' },
    { at: hoursAgo(26), text: `New product submitted (${productList[1]?.name ?? 'product'})`, kind: 'product' },
    { at: hoursAgo(50), text: 'Profile details updated', kind: 'profile' },
  ] : [{ at: hoursAgo(20), text: 'Applied to sell on the marketplace', kind: 'profile' }];

  return delay(clone({
    ...v,
    performance: active
      ? { orders: orders3m, fulfilment: v.fulfilledPct, returns: Math.round(orders3m * (1 - v.fulfilledPct / 100) * 0.3), rating: v.rating }
      : { orders: 0, fulfilment: 0, returns: 0, rating: 0 },
    weeks,
    activity: [...(activityById[id] ?? []), ...base],
    productList,
    recentOrders,
  }), 250);
}

/* ---------- Changes ---------- */

const logActivity = (id: string, text: string, kind: VendorActivity['kind'] = 'status') => {
  activityById[id] = [{ at: new Date().toISOString(), text, kind }, ...(activityById[id] ?? [])];
};

// Backend: PATCH /admin/vendors/:id/status  (body: { status, note })
export async function setVendorStatus(ids: string[], status: VendorStatus, note = ''): Promise<void> {
  const text: Record<VendorStatus, string> = {
    Active: 'Vendor approved / reactivated', Suspended: 'Vendor suspended', Inactive: 'Vendor set inactive', Pending: 'Vendor sent back to review',
  };
  vendors = vendors.map((v) => {
    if (!ids.includes(v.id)) return v;
    logActivity(v.id, `${text[status]}${note ? `: ${note}` : ''}`);
    return { ...v, status, verified: status === 'Active' ? true : v.verified };
  });
  return delay(undefined, 300);
}

// Backend: PATCH /admin/vendors/:id
export async function updateVendor(id: string, changes: NewVendor): Promise<void> {
  if (vendors.some((v) => v.id !== id && v.email.toLowerCase() === changes.email.toLowerCase())) throw new Error('Another vendor already uses this email');
  vendors = vendors.map((v) => (v.id === id ? { ...v, ...changes } : v));
  logActivity(id, 'Profile details updated by admin', 'profile');
  return delay(undefined, 300);
}

// Backend: POST /admin/vendors
export async function createVendor(input: NewVendor): Promise<AdminVendor> {
  if (vendors.some((v) => v.email.toLowerCase() === input.email.toLowerCase())) throw new Error('A vendor with this email already exists');
  const created: AdminVendor = {
    ...input, id: `VEN-${Date.now().toString(36).toUpperCase()}`,
    products: 0, totalOrders: 0, fulfilledPct: 0, rating: 0, status: 'Active', joinedAt: toIso(new Date()), verified: true,
  };
  vendors = [...vendors, created];
  logActivity(created.id, 'Vendor added by admin', 'profile');
  return delay(clone(created), 300);
}
