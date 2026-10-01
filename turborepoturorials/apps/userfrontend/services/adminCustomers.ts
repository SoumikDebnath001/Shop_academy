/* =========================
   ADMIN CUSTOMERS DATA
   Every function here returns DEMO data with a short fake delay.
   To connect the backend, replace the body of each function with the API call
   written in its "Backend:" comment. The types stay the same, so the UI does not change.
========================= */

import { DateRange, delay, seeded, toIso } from './adminDashboard';

/* ---------- Types ---------- */

export const CUSTOMER_TYPES = ['Individual', 'School / Institution', 'Foundation Sponsor'] as const;
export const ACCOUNT_STATUSES = ['Active', 'Inactive', 'Disabled'] as const;
export const CUSTOMER_COUNTRIES = ['Kenya', 'India', 'Uganda', 'Tanzania', 'United Kingdom', 'United States'] as const;

export type CustomerType = typeof CUSTOMER_TYPES[number];
export type AccountStatus = typeof ACCOUNT_STATUSES[number];

export type CustomerAddress = { label: string; line: string; city: string; postcode: string; country: string };
export type CustomerOrder = { id: string; date: string; total: number; status: 'Delivered' | 'Shipped' | 'Processing' | 'Returned' | 'Cancelled' };
export type CustomerNote = { at: string; text: string };

export type AdminCustomer = {
  id: string;
  name: string;
  type: CustomerType;
  email: string;
  phone: string;
  city: string;
  country: string;
  joinedAt: string; // ISO date
  status: AccountStatus;
  totalOrders: number;
  totalSpent: number; // KSh
  lastOrderAt: string | null;
};

export type CustomerDetail = AdminCustomer & {
  orders: CustomerOrder[]; // newest first
  addresses: CustomerAddress[];
  notes: CustomerNote[];
};

export type CustomerTab = 'All' | CustomerType;
export type CustomerSortKey = 'joinedAt' | 'totalOrders' | 'totalSpent' | 'name';
export type JoinedFilter = 'Any time' | 'This month' | 'Last 30 days' | 'Last 90 days' | 'This year';
export const JOINED_FILTERS: JoinedFilter[] = ['This month', 'Last 30 days', 'Last 90 days', 'This year'];

export type CustomerQuery = {
  tab: CustomerTab;
  search?: string;
  type?: CustomerType | 'All';
  status?: AccountStatus | 'All';
  country?: string | 'All';
  joined?: JoinedFilter | 'All';
  sort?: { key: CustomerSortKey; dir: 'asc' | 'desc' };
  page: number;
  perPage: number;
};

export type CustomerSummary = {
  total: number; individuals: number; schools: number; repeat: number; newThisMonth: number;
  change: { total: number; individuals: number; schools: number; repeat: number };
};

export type CustomerListResult = { rows: AdminCustomer[]; total: number; tabCounts: Record<CustomerTab, number> };

export type NewCustomer = { name: string; email: string; phone: string; type: CustomerType; city: string; country: string };

/* ---------- Demo data ---------- */

const FIRST = ['Grace', 'Rahul', 'Amina', 'Peter', 'Mary', 'Kevin', 'Aisha', 'Brian', 'Nisha', 'Joseph', 'Esther', 'Arjun', 'Wanjiru', 'Daniel', 'Zawadi', 'Meera', 'Otieno', 'Faith', 'Vikram', 'Halima'];
const LAST = ['Achieng', 'Menon', 'Hassan', 'Kamau', 'Wanjiru', 'Omondi', 'Njeri', 'Patel', 'Mutua', 'Kiprop', 'Nair', 'Chebet', 'Odhiambo', 'Iyer', 'Mwende'];
const ORG_WORDS = ['Starlight', 'Hillside', 'Lakeview', 'Sunrise', 'Unity', 'Savannah', 'Riverbank', 'Highland', 'Coastal', 'Green Valley', 'Victory', 'Eagle'];
const ORG_KINDS = ['Academy', 'School', 'Sports Club', 'High School', 'Youth Centre'];
const SPONSORS = ['Foundation', 'Trust', 'Community Fund', 'Sports Initiative'];
const CITIES: Record<string, { city: string; code: string; postcode: string }[]> = {
  Kenya: [{ city: 'Nairobi', code: '+254', postcode: '00800' }, { city: 'Mombasa', code: '+254', postcode: '80100' }, { city: 'Kisumu', code: '+254', postcode: '40100' }],
  India: [{ city: 'Mumbai', code: '+91', postcode: '400050' }, { city: 'Bengaluru', code: '+91', postcode: '560001' }],
  Uganda: [{ city: 'Kampala', code: '+256', postcode: '' }],
  Tanzania: [{ city: 'Dar es Salaam', code: '+255', postcode: '' }],
  'United Kingdom': [{ city: 'London', code: '+44', postcode: 'SW1A 1AA' }],
  'United States': [{ city: 'New York', code: '+1', postcode: '10001' }],
};
const STREETS = ['Riverside Drive, Westlands', 'Moi Avenue', 'Ngong Road', 'Kenyatta Avenue', 'Linking Road', 'Park Street', 'Baker Street'];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '');
const phoneFor = (code: string, rand: () => number) =>
  code === '+254' ? `+254 7${Math.floor(10 + rand() * 89)} ${Math.floor(100 + rand() * 899)} ${Math.floor(100 + rand() * 899)}`
    : code === '+91' ? `+91 9${Math.floor(1000 + rand() * 8999)} ${Math.floor(10000 + rand() * 89999)}`
      : `${code} ${Math.floor(100 + rand() * 899)} ${Math.floor(100 + rand() * 899)} ${Math.floor(1000 + rand() * 8999)}`;

// The first ten customers match the design image
const DESIGN: [string, CustomerType, string, string, number, number, string, AccountStatus][] = [
  ['John Mwangi', 'Individual', 'john.mwangi@email.com', '+254 712 345 678', 12, 58400, '2025-01-12', 'Active'],
  ['Priya Sharma', 'Individual', 'priya.sharma@email.com', '+91 98765 43210', 8, 24500, '2025-02-03', 'Active'],
  ['Nairobi Sports Club', 'School / Institution', 'info@nairobiacademy.org', '+254 722 111 222', 18, 412000, '2025-02-15', 'Active'],
  ["Alex D'Souza", 'Individual', 'alex.dsouza@email.com', '+254 700 987 654', 5, 16800, '2025-02-20', 'Active'],
  ['Kenya Youth Academy', 'School / Institution', 'admin@kenyayouth.org', '+254 733 222 111', 25, 620000, '2025-03-01', 'Active'],
  ['Fatima Ali', 'Individual', 'fatima.ali@email.com', '+254 701 555 333', 3, 9200, '2025-03-10', 'Active'],
  ['Greenfield School', 'School / Institution', 'procurement@greenfield.ac.ke', '+254 720 444 888', 14, 310500, '2025-03-18', 'Active'],
  ['David Kimani', 'Individual', 'david.kimani@email.com', '+254 715 667 890', 7, 21300, '2025-04-05', 'Inactive'],
  ['Laxmi Rao', 'Individual', 'laxmi.rao@email.com', '+91 90000 11122', 9, 36000, '2025-04-12', 'Active'],
  ['Rising Stars Club', 'School / Institution', 'info@risingstars.org', '+254 734 888 222', 11, 205400, '2025-04-22', 'Active'],
];

// 986 individuals, 182 schools / institutions and 80 foundation sponsors in total
const TARGET: Record<CustomerType, number> = { Individual: 986, 'School / Institution': 182, 'Foundation Sponsor': 80 };

let customers: AdminCustomer[] = (() => {
  const list: AdminCustomer[] = DESIGN.map(([name, type, email, phone, totalOrders, totalSpent, joined, status], i) => ({
    id: `CUS-${1001 + i}`, name, type, email, phone,
    city: phone.startsWith('+91') ? 'Mumbai' : 'Nairobi', country: phone.startsWith('+91') ? 'India' : 'Kenya',
    joinedAt: joined, status, totalOrders, totalSpent, lastOrderAt: i === 0 ? '2026-09-05' : `2026-0${8 + (i % 2)}-${String(10 + i).padStart(2, '0')}`,
  }));

  const counts: Record<CustomerType, number> = { Individual: 6, 'School / Institution': 4, 'Foundation Sponsor': 0 };
  const start = new Date(2025, 4, 1).getTime();
  const end = new Date(2026, 8, 21).getTime();
  const monthStart = new Date(2026, 8, 1).getTime();
  const remaining = 1248 - list.length;

  for (let n = 0; n < remaining; n++) {
    const rand = seeded(`customer:${n}`);
    const pick = <T>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
    // Share the remaining places so each type ends up at its target
    const type = (CUSTOMER_TYPES.find((t) => counts[t] < TARGET[t] && rand() < (TARGET[t] - counts[t]) / (remaining - n + 1)) ?? CUSTOMER_TYPES.find((t) => counts[t] < TARGET[t]))!;
    counts[type]++;

    const country = rand() < 0.72 ? 'Kenya' : pick(CUSTOMER_COUNTRIES);
    const place = pick(CITIES[country]);
    const name = type === 'Individual' ? `${pick(FIRST)} ${pick(LAST)}`
      : type === 'School / Institution' ? `${pick(ORG_WORDS)} ${pick(ORG_KINDS)}` : `${pick(ORG_WORDS)} ${pick(SPONSORS)}`;
    const email = type === 'Individual' ? `${slug(name)}${n % 7 ? '' : n}@email.com` : `info@${slug(name).replace(/\./g, '')}.org`;
    // 46 joined this month, the rest earlier (newer customers more common)
    const joined = new Date(n < 46 ? monthStart + rand() * (end - monthStart) : start + Math.sqrt(rand()) * (monthStart - 86400000 - start));
    // Schools and sponsors always order again; most individuals buy once (about 312 repeat customers in total)
    const totalOrders = type === 'Individual' ? (rand() < 0.95 ? 1 : Math.floor(2 + rand() * 12)) : Math.floor(4 + rand() * 30);
    const avg = type === 'Individual' ? 1800 + rand() * 3500 : 9000 + rand() * 25000;
    const status: AccountStatus = rand() < 0.88 ? 'Active' : rand() < 0.8 ? 'Inactive' : 'Disabled';
    const lastOrder = new Date(Math.max(joined.getTime(), end - rand() * 120 * 86400000));

    list.push({
      id: `CUS-${1011 + n}`, name, type, email, phone: phoneFor(place.code, rand),
      city: place.city, country, joinedAt: toIso(joined), status,
      totalOrders, totalSpent: Math.round((totalOrders * avg) / 100) * 100, lastOrderAt: toIso(lastOrder),
    });
  }
  return list;
})();

// Changes made in this visit (edits, notes, new customers) are kept here
const notesById: Record<string, CustomerNote[]> = {};

/* ---------- Helpers ---------- */

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

const joinedRange = (joined: JoinedFilter): DateRange | null => {
  const today = new Date();
  const back = (days: number) => { const d = new Date(); d.setDate(d.getDate() - days); return toIso(d); };
  switch (joined) {
    case 'This month': return { from: toIso(new Date(today.getFullYear(), today.getMonth(), 1)), to: toIso(today) };
    case 'Last 30 days': return { from: back(29), to: toIso(today) };
    case 'Last 90 days': return { from: back(89), to: toIso(today) };
    case 'This year': return { from: `${today.getFullYear()}-01-01`, to: toIso(today) };
    default: return null;
  }
};

const matches = (c: AdminCustomer, q: CustomerQuery) => {
  const text = (q.search ?? '').trim().toLowerCase();
  const digits = text.replace(/\D/g, '');
  const range = q.joined && q.joined !== 'All' ? joinedRange(q.joined) : null;
  return (!text || [c.name, c.email, c.city].some((v) => v.toLowerCase().includes(text)) || (digits.length >= 3 && c.phone.replace(/\D/g, '').includes(digits)))
    && (!q.type || q.type === 'All' || c.type === q.type)
    && (!q.status || q.status === 'All' || c.status === q.status)
    && (!q.country || q.country === 'All' || c.country === q.country)
    && (!range || (c.joinedAt >= range.from && c.joinedAt <= range.to));
};

/* ---------- Queries ---------- */

// Backend: GET /admin/customers/summary
export async function getCustomerSummary(): Promise<CustomerSummary> {
  const month = joinedRange('This month')!;
  return delay({
    total: customers.length,
    individuals: customers.filter((c) => c.type === 'Individual').length,
    schools: customers.filter((c) => c.type === 'School / Institution').length,
    repeat: customers.filter((c) => c.totalOrders >= 2).length,
    newThisMonth: customers.filter((c) => c.joinedAt >= month.from && c.joinedAt <= month.to).length,
    change: { total: 12, individuals: 10, schools: 28, repeat: 15 },
  }, 250);
}

// Backend: GET /admin/customers?tab=&search=&type=&status=&country=&joined=&sort=&page=&limit=
export async function listCustomers(q: CustomerQuery): Promise<CustomerListResult> {
  const filtered = customers.filter((c) => matches(c, q));
  const { key, dir } = q.sort ?? { key: 'joinedAt', dir: 'asc' };
  const sign = dir === 'asc' ? 1 : -1;
  const rows = filtered
    .filter((c) => q.tab === 'All' || c.type === q.tab)
    .sort((a, b) => (key === 'joinedAt' || key === 'name' ? a[key].localeCompare(b[key]) : a[key] - b[key]) * sign);

  const start = (q.page - 1) * q.perPage;
  return delay({
    rows: clone(rows.slice(start, start + q.perPage)),
    total: rows.length,
    tabCounts: Object.fromEntries([['All', filtered.length], ...CUSTOMER_TYPES.map((t) => [t, filtered.filter((c) => c.type === t).length])]) as CustomerListResult['tabCounts'],
  }, 300);
}

// Backend: GET /admin/customers/:id  (with orders, addresses and notes)
export async function getCustomer(id: string): Promise<CustomerDetail> {
  const c = customers.find((x) => x.id === id);
  if (!c) throw new Error('This customer was not found');
  const rand = seeded(`customer-detail:${id}`);

  // Orders spread between the join date and the last order, adding up to the total spent
  const orders: CustomerOrder[] = [];
  const first = new Date(c.joinedAt).getTime();
  const last = new Date(c.lastOrderAt ?? c.joinedAt).getTime();
  let left = c.totalSpent;
  for (let i = 0; i < c.totalOrders; i++) {
    const share = i === c.totalOrders - 1 ? left : Math.round((c.totalSpent / c.totalOrders) * (0.6 + rand() * 0.8) / 100) * 100;
    left -= share;
    const r = rand();
    orders.push({
      id: `#OB${10234 - Math.floor(rand() * 900) - i * 3}`,
      date: toIso(new Date(last - (c.totalOrders > 1 ? (i / (c.totalOrders - 1)) * (last - first) : 0))),
      total: Math.max(100, share),
      status: i === 1 ? 'Shipped' : r < 0.85 ? 'Delivered' : r < 0.93 ? 'Returned' : 'Cancelled',
    });
  }

  const place = CITIES[c.country]?.find((p) => p.city === c.city) ?? { postcode: '' };
  const addresses: CustomerAddress[] = [
    { label: c.type === 'Individual' ? 'Home' : 'Main office', line: `${Math.floor(1 + rand() * 200)} ${STREETS[Math.floor(rand() * STREETS.length)]}`, city: c.city, postcode: place.postcode, country: c.country },
    { label: c.type === 'Individual' ? 'Work' : 'Warehouse', line: `${Math.floor(1 + rand() * 200)} ${STREETS[Math.floor(rand() * STREETS.length)]}`, city: c.city, postcode: place.postcode, country: c.country },
    { label: 'Other', line: `${Math.floor(1 + rand() * 200)} ${STREETS[Math.floor(rand() * STREETS.length)]}`, city: c.city, postcode: place.postcode, country: c.country },
  ].slice(0, 1 + Math.floor(rand() * 3));
  if (id === 'CUS-1001') {
    addresses.splice(0, addresses.length,
      { label: 'Home', line: '123 Riverside Drive, Westlands', city: 'Nairobi', postcode: '00800', country: 'Kenya' },
      { label: 'Work', line: '45 Kenyatta Avenue', city: 'Nairobi', postcode: '00100', country: 'Kenya' },
      { label: 'Other', line: '8 Ngong Road', city: 'Nairobi', postcode: '00505', country: 'Kenya' });
  }

  return delay(clone({ ...c, orders, addresses, notes: notesById[id] ?? [] }), 250);
}

/* ---------- Changes ---------- */

// Backend: PATCH /admin/customers/:id  (body: { status })
export async function setCustomerStatus(ids: string[], status: AccountStatus): Promise<void> {
  customers = customers.map((c) => (ids.includes(c.id) ? { ...c, status } : c));
  return delay(undefined, 300);
}

// Backend: PATCH /admin/customers/:id  (body: name, email, phone, type, city, country)
export async function updateCustomer(id: string, changes: NewCustomer): Promise<void> {
  if (customers.some((c) => c.id !== id && c.email.toLowerCase() === changes.email.toLowerCase())) {
    throw new Error('Another customer already uses this email');
  }
  customers = customers.map((c) => (c.id === id ? { ...c, ...changes } : c));
  return delay(undefined, 300);
}

// Backend: POST /admin/customers
export async function createCustomer(input: NewCustomer): Promise<AdminCustomer> {
  if (customers.some((c) => c.email.toLowerCase() === input.email.toLowerCase())) {
    throw new Error('A customer with this email already exists');
  }
  const created: AdminCustomer = {
    ...input,
    id: `CUS-${Date.now().toString(36).toUpperCase()}`,
    joinedAt: toIso(new Date()),
    status: 'Active',
    totalOrders: 0,
    totalSpent: 0,
    lastOrderAt: null,
  };
  customers = [...customers, created];
  return delay(clone(created), 300);
}

// Backend: POST /admin/customers/:id/notes  (body: { text })
export async function addCustomerNote(id: string, text: string): Promise<void> {
  notesById[id] = [...(notesById[id] ?? []), { at: new Date().toISOString(), text }];
  return delay(undefined, 200);
}
