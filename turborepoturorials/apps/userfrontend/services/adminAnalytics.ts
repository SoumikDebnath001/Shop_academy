/* =========================
   ADMIN ANALYTICS DATA
   Every function here returns DEMO data with a short fake delay.
   To connect the backend, replace the body of each function with the API call
   written in its "Backend:" comment. The types stay the same, so the UI does not change.
========================= */

import { DateRange, daysBetween, delay, seeded } from './adminDashboard';

/* ---------- Types ---------- */

export type KpiKey = 'orders' | 'revenue' | 'customers' | 'vendors' | 'products';
export type Kpi = { key: KpiKey; value: number; changePercent: number };

export type OrderStatusKey = 'Delivered' | 'Processing' | 'Shipped' | 'Pending' | 'Cancelled';
export type CustomerType = 'Individuals' | 'Schools / Institutions' | 'Foundation / Sponsored' | 'Others';
export type Slice<K extends string> = { key: K; count: number };

export type AnalyticsOverview = {
  kpis: Kpi[];
  ordersByStatus: Slice<OrderStatusKey>[];
  ordersByCustomerType: Slice<CustomerType>[];
  updatedAt: string; // ISO date time
};

export type TrendMonths = 6 | 9 | 12;
export type MonthlyTrendPoint = { month: string; revenue: number; orders: number }; // month = yyyy-mm
export type GrowthPoint = { month: string; newCustomers: number; totalCustomers: number };

export type RankMetric = 'revenue' | 'quantity' | 'orders';
export type RankItem = { id: string; label: string; icon: string; value: number };

export type VendorRow = { id: string; name: string; orders: number; revenue: number };
export type ProductRow = { id: string; name: string; icon: string; quantity: number; revenue: number };
export type CountryRow = { code: string; name: string; revenue: number; orders: number };

/* ---------- Demo helpers ---------- */

// Numbers grow with the length of the chosen range, and stay the same for the same range
const scaleFor = (range: DateRange) => Math.max(1, daysBetween(range).length) / 30;
const jitter = (rand: () => number, spread = 0.2) => 1 - spread / 2 + rand() * spread;
const change = (rand: () => number) => Math.round((rand() * 30 - 5) * 10) / 10;

// Months ending with the month of `end`, oldest first
const lastMonths = (end: string, count: number) => {
  const d = new Date(`${end}T00:00:00`);
  return Array.from({ length: count }, (_, i) => {
    const m = new Date(d.getFullYear(), d.getMonth() - (count - 1 - i), 1);
    return `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
  });
};

// Turns each demo row's weight into a number for the chosen range, with a little variation
const rank = <B extends { weight: number }, R>(range: DateRange, key: string, base: B[], toItem: (b: B, factor: number) => R): R[] => {
  const rand = seeded(`${key}:${range.from}:${range.to}`);
  const scale = scaleFor(range);
  return base.map((b) => toItem(b, b.weight * scale * jitter(rand)));
};

/* ---------- Overview ---------- */

// Backend: GET /admin/analytics/overview?from=&to=
export async function getAnalyticsOverview(range: DateRange): Promise<AnalyticsOverview> {
  const rand = seeded(`overview:${range.from}:${range.to}`);
  const scale = scaleFor(range);
  const orders = Math.round(1248 * scale * jitter(rand, 0.15));

  const statusShare: [OrderStatusKey, number][] = [['Delivered', 0.62], ['Processing', 0.18], ['Shipped', 0.1], ['Pending', 0.06], ['Cancelled', 0.04]];
  const typeShare: [CustomerType, number][] = [['Individuals', 0.68], ['Schools / Institutions', 0.2], ['Foundation / Sponsored', 0.07], ['Others', 0.05]];

  // Split the total by share, the last slice takes the rounding remainder so the parts always add up
  const split = <K extends string>(shares: [K, number][]): Slice<K>[] => {
    let left = orders;
    return shares.map(([key, share], i) => {
      const count = i === shares.length - 1 ? left : Math.round(orders * share * jitter(rand, 0.1));
      left -= count;
      return { key, count: Math.max(0, count) };
    });
  };

  return delay({
    kpis: [
      { key: 'orders', value: orders, changePercent: change(rand) },
      { key: 'revenue', value: Math.round(4286500 * scale * jitter(rand, 0.15)), changePercent: change(rand) },
      { key: 'customers', value: Math.round(986 * Math.min(1.5, 0.7 + scale * 0.3)), changePercent: change(rand) },
      { key: 'vendors', value: 38, changePercent: change(rand) },
      { key: 'products', value: 428, changePercent: change(rand) },
    ],
    ordersByStatus: split(statusShare),
    ordersByCustomerType: split(typeShare),
    updatedAt: new Date().toISOString(),
  });
}

/* ---------- Monthly trends ---------- */

// Backend: GET /admin/analytics/revenue-trend?months=&to=
export async function getRevenueTrend(range: DateRange, months: TrendMonths): Promise<MonthlyTrendPoint[]> {
  const rand = seeded(`trend:${range.to}:${months}`);
  return delay(lastMonths(range.to, months).map((month, i) => {
    const growth = 0.45 + (i / Math.max(1, months - 1)) * 0.55;
    // Scaled so the latest month is close to the one month totals in the summary cards
    return { month, revenue: Math.round((4300000 * growth * jitter(rand, 0.2)) / 1000) * 1000, orders: Math.round(1250 * growth * jitter(rand, 0.2)) };
  }), 300);
}

// Backend: GET /admin/analytics/customer-growth?months=&to=
export async function getCustomerGrowth(range: DateRange, months: TrendMonths): Promise<GrowthPoint[]> {
  const rand = seeded(`growth:${range.to}:${months}`);
  const list = lastMonths(range.to, months);
  const newPerMonth = list.map((_, i) => Math.round((30 + i * (90 / Math.max(1, months - 1))) * jitter(rand, 0.3)));
  // Worked backwards so the last month's total matches the 986 customers in the summary card
  let total = 986 - newPerMonth.reduce((sum, n) => sum + n, 0);
  return delay(list.map((month, i) => {
    total += newPerMonth[i];
    return { month, newCustomers: newPerMonth[i], totalCustomers: total };
  }), 300);
}

/* ---------- Rankings ---------- */

const CATEGORIES = [
  { id: 'cricket', label: 'Cricket', icon: 'sports_cricket', weight: 43 },
  { id: 'football', label: 'Football', icon: 'sports_soccer', weight: 23 },
  { id: 'training', label: 'Training Equipment', icon: 'fitness_center', weight: 14 },
  { id: 'athletics', label: 'Athletics', icon: 'directions_run', weight: 10 },
  { id: 'apparel', label: 'Apparel', icon: 'apparel', weight: 7 },
  { id: 'other', label: 'Other', icon: 'category', weight: 3 },
];

const SPORTS = [
  { id: 'cricket', label: 'Cricket', icon: 'sports_cricket', weight: 43 },
  { id: 'football', label: 'Football', icon: 'sports_soccer', weight: 23 },
  { id: 'athletics', label: 'Athletics', icon: 'directions_run', weight: 12 },
  { id: 'basketball', label: 'Basketball', icon: 'sports_basketball', weight: 8 },
  { id: 'multi', label: 'Multi-Sport', icon: 'sports', weight: 7 },
  { id: 'other', label: 'Other', icon: 'more_horiz', weight: 7 },
];

// What one "weight point" is worth for each metric, so the three views give believable numbers
// "Other" is a leftover bucket, so it always goes last whatever its size
const otherLast = (a: RankItem, b: RankItem) => (a.id === 'other' ? 1 : b.id === 'other' ? -1 : b.value - a.value);

const METRIC_UNIT: Record<RankMetric, number> = { revenue: 43000, quantity: 38, orders: 29 };

// Backend: GET /admin/analytics/categories?by=&from=&to=
export async function getTopCategories(range: DateRange, by: RankMetric): Promise<RankItem[]> {
  const items = rank(range, `cat:${by}`, CATEGORIES, ({ id, label, icon }, f): RankItem => ({ id, label, icon, value: Math.round(f * METRIC_UNIT[by]) }));
  return delay(items.sort(otherLast), 250);
}

// Backend: GET /admin/analytics/sports?by=&from=&to=
export async function getSalesBySport(range: DateRange, by: RankMetric): Promise<RankItem[]> {
  const items = rank(range, `sport:${by}`, SPORTS, ({ id, label, icon }, f): RankItem => ({ id, label, icon, value: Math.round(f * METRIC_UNIT[by]) }));
  return delay(items.sort(otherLast), 250);
}

const VENDORS = [
  { id: 'sprintgear', name: 'SprintGear Ltd', avgOrder: 3275, weight: 1 },
  { id: 'playpro', name: 'PlayPro Sports', avgOrder: 3907, weight: 0.72 },
  { id: 'fieldmasters', name: 'FieldMasters', avgOrder: 2754, weight: 0.47 },
  { id: 'swift', name: 'Swift Athletics', avgOrder: 2630, weight: 0.37 },
  { id: 'goalline', name: 'GoalLine Kenya', avgOrder: 3265, weight: 0.29 },
  { id: 'urban', name: 'Urban Kits', avgOrder: 2410, weight: 0.21 },
];

// Backend: GET /admin/analytics/vendors?by=&from=&to=&limit=5
export async function getTopVendors(range: DateRange, by: 'revenue' | 'orders'): Promise<VendorRow[]> {
  const rows = rank(range, 'vendors', VENDORS, ({ id, name, avgOrder }, f): VendorRow => {
    const orders = Math.round(342 * f);
    return { id, name, orders, revenue: Math.round((orders * avgOrder) / 100) * 100 };
  });
  return delay(rows.sort((a, b) => b[by] - a[by]).slice(0, 5), 250);
}

const PRODUCTS = [
  { id: 'p1', name: 'Cricket Training Bat', icon: 'sports_cricket', price: 3499, weight: 1 },
  { id: 'p2', name: 'Football Jersey (Blue)', icon: 'apparel', price: 1299, weight: 0.71 },
  { id: 'p3', name: 'Training Cones (Set of 10)', icon: 'change_history', price: 899, weight: 0.62 },
  { id: 'p4', name: 'Running Shoes', icon: 'steps', price: 4599, weight: 0.53 },
  { id: 'p5', name: 'Goalkeeper Gloves', icon: 'back_hand', price: 1799, weight: 0.47 },
  { id: 'p6', name: 'Batting Pads', icon: 'shield', price: 2499, weight: 0.3 },
];

// Backend: GET /admin/analytics/products?by=&from=&to=&limit=5
export async function getTopProducts(range: DateRange, by: 'quantity' | 'revenue'): Promise<ProductRow[]> {
  const rows = rank(range, 'products', PRODUCTS, ({ id, name, icon, price }, f): ProductRow => {
    const quantity = Math.round(450 * f);
    return { id, name, icon, quantity, revenue: quantity * price };
  });
  return delay(rows.sort((a, b) => b[by] - a[by]).slice(0, 5), 250);
}

const COUNTRIES = [
  { code: 'KE', name: 'Kenya', weight: 73 },
  { code: 'US', name: 'United States', weight: 10 },
  { code: 'IN', name: 'India', weight: 4 },
  { code: 'GB', name: 'United Kingdom', weight: 5 },
  { code: '··', name: 'Other', weight: 8 },
];

// Backend: GET /admin/analytics/countries?by=&from=&to=
export async function getSalesByCountry(range: DateRange, by: 'revenue' | 'orders'): Promise<CountryRow[]> {
  const rows = rank(range, 'countries', COUNTRIES, ({ code, name }, f): CountryRow => ({ code, name, revenue: Math.round((f * 42770) / 100) * 100, orders: Math.round(f * 12.5) }));
  return delay(rows.sort((a, b) => (a.code === '··' ? 1 : b.code === '··' ? -1 : b[by] - a[by])), 250);
}
