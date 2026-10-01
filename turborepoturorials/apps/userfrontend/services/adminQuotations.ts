/* =========================
   ADMIN QUOTATIONS (BULK ORDERS) DATA
   Every function here returns DEMO data with a short fake delay.
   To connect the backend, replace the body of each function with the API call
   written in its "Backend:" comment. The types stay the same, so the UI does not change.
========================= */

import { delay, seeded, toIso } from './adminDashboard';

/* ---------- Types ---------- */

export const QUOTE_STATUSES = ['New', 'In Discussion', 'Quotation Sent', 'Approved', 'Declined'] as const;
export const ORG_TYPES = ['School', 'Club', 'Institution', 'NGO'] as const;
export const QUOTE_DATE_FILTERS = ['This month', 'Last 30 days', 'Last 90 days'] as const;

export type QuoteStatus = typeof QUOTE_STATUSES[number];
export type OrgType = typeof ORG_TYPES[number];
export type QuoteDateFilter = typeof QUOTE_DATE_FILTERS[number];
export type QuoteTab = 'All' | QuoteStatus;

export type QuoteItem = { product: string; icon: string; quantity: number; unitPrice: number }; // unitPrice in KSh
export type QuoteNote = { at: string; author: string; text: string };
export type SentQuote = { at: string; total: number; discountPercent: number; deliveryDays: number; validUntil: string; message: string };

export type Organization = { name: string; type: OrgType; contact: string; email: string; phone: string; address: string };

export type Quotation = {
  id: string;
  org: Organization;
  message: string;
  items: QuoteItem[];
  estimatedValue: number; // KSh, from the catalogue prices
  status: QuoteStatus;
  requestedAt: string; // ISO date time
  notes: QuoteNote[];
  sent: SentQuote | null;
  declineReason: string;
};

export type QuoteSortKey = 'requestedAt' | 'estimatedValue' | 'items';

export type QuoteQuery = {
  tab: QuoteTab;
  search?: string;
  orgType?: OrgType | 'All';
  status?: QuoteStatus | 'All';
  date?: QuoteDateFilter | 'All';
  sort?: { key: QuoteSortKey; dir: 'asc' | 'desc' };
  page: number;
  perPage: number;
};

export type QuoteSummary = Record<'total' | 'New' | 'In Discussion' | 'Quotation Sent' | 'Approved' | 'Declined', number> & { totalChangePercent: number };
export type QuoteListResult = { rows: Quotation[]; total: number; tabCounts: Record<QuoteTab, number> };
export type NewQuotation = { org: Organization; message: string; items: { product: string; quantity: number }[] };

/* ---------- Catalogue the requests are built from (prices in KSh) ---------- */

export const QUOTE_CATALOGUE: { product: string; icon: string; price: number }[] = [
  { product: 'Football (Training)', icon: 'sports_soccer', price: 1600 },
  { product: 'Training Cones (Set of 10)', icon: 'change_history', price: 1200 },
  { product: 'Football Jersey (Blue)', icon: 'apparel', price: 1900 },
  { product: 'Goalkeeper Gloves', icon: 'back_hand', price: 2500 },
  { product: 'Cricket Training Bat', icon: 'sports_cricket', price: 2500 },
  { product: 'Cricket Pads (Men)', icon: 'shield', price: 3800 },
  { product: 'Running Shoes', icon: 'steps', price: 5200 },
  { product: 'Basketball (Size 7)', icon: 'sports_basketball', price: 2900 },
  { product: 'Team Water Bottle', icon: 'water_bottle', price: 900 },
  { product: 'Training Bibs (Set of 10)', icon: 'checkroom', price: 2200 },
  { product: 'Shin Guards', icon: 'health_and_safety', price: 800 },
  { product: 'Agility Ladder', icon: 'linear_scale', price: 1800 },
  { product: 'First Aid Kit', icon: 'medical_services', price: 3000 },
  { product: 'Sports Bag', icon: 'backpack', price: 2400 },
];

const catalogueItem = (product: string) => QUOTE_CATALOGUE.find((c) => c.product === product) ?? { product, icon: 'inventory_2', price: 1000 };

/* ---------- Demo data ---------- */

type Design = [string, OrgType, number, number, QuoteStatus, number]; // name, type, line items, estimated value, status, day of Sep 2026
const DESIGN: Design[] = [
  ['Nairobi Youth Academy', 'School', 12, 245000, 'New', 16],
  ['Greenfield School', 'School', 25, 512000, 'In Discussion', 15],
  ['Kisumu Sports Club', 'Club', 18, 320000, 'Quotation Sent', 14],
  ['Future Stars Academy', 'School', 40, 890000, 'In Discussion', 13],
  ['East Africa Sports Inst.', 'Institution', 30, 640000, 'Approved', 12],
  ['Mombasa United FC', 'Club', 22, 410000, 'Quotation Sent', 10],
  ['Rising Stars School', 'School', 15, 276000, 'New', 9],
  ['Sports for All NGO', 'NGO', 50, 1020000, 'In Discussion', 8],
  ['Lakeview High School', 'School', 8, 150000, 'Declined', 5],
  ['Athletes for Change', 'NGO', 35, 720000, 'Quotation Sent', 3],
];

// 18 older requests so the totals match the design: 6 New, 8 In Discussion, 9 Quotation Sent, 4 Approved, 1 Declined
const OLDER: [string, OrgType, QuoteStatus][] = [
  ['Kenya Youth Academy', 'School', 'New'], ['Unity Sports Club', 'Club', 'New'], ['Hillside Primary', 'School', 'New'], ['Coastal Kids Trust', 'NGO', 'New'],
  ['Savannah College', 'Institution', 'In Discussion'], ['Victory FC', 'Club', 'In Discussion'], ['Starlight Academy', 'School', 'In Discussion'],
  ['Highland Athletics Club', 'Club', 'In Discussion'], ['Eagle Sports Foundation', 'NGO', 'In Discussion'],
  ['Sunrise High School', 'School', 'Quotation Sent'], ['Riverbank Polytechnic', 'Institution', 'Quotation Sent'], ['Nakuru Netball Club', 'Club', 'Quotation Sent'],
  ['Green Valley School', 'School', 'Quotation Sent'], ['Play It Forward', 'NGO', 'Quotation Sent'], ['Thika Technical Inst.', 'Institution', 'Quotation Sent'],
  ['Eldoret Runners Club', 'Club', 'Approved'], ['Kisumu Girls High', 'School', 'Approved'], ['Mombasa Community Trust', 'NGO', 'Approved'],
];

const CONTACTS = ['Mr. James Mwangi', 'Mrs. Grace Achieng', 'Coach Peter Otieno', 'Ms. Amina Hassan', 'Mr. David Kamau', 'Dr. Mary Wanjiru', 'Mr. Brian Omondi'];
const TOWNS = ['Nairobi', 'Kisumu', 'Mombasa', 'Nakuru', 'Eldoret', 'Thika'];
const MESSAGES = [
  'We are looking for training equipment for our academy. Please share bulk pricing and estimated delivery time.',
  'We need full kits for our junior and senior teams before the new season. Can you include printing of our crest?',
  'Requesting a quotation for our annual sports day supplies. Delivery needed within 3 weeks.',
  'Our programme supports 200 children. We would appreciate any foundation discount available.',
];

const domain = (name: string) => name.toLowerCase().replace(/[^a-z]+/g, '');

// Builds line items that add up (close to) the target value
function makeItems(count: number, target: number, rand: () => number, forceFirst = false): QuoteItem[] {
  const pool = [...QUOTE_CATALOGUE].sort(() => rand() - 0.5);
  if (forceFirst) {
    // The first request in the design shows these four items first
    const first = ['Football (Training)', 'Training Cones (Set of 10)', 'Football Jersey (Blue)', 'Goalkeeper Gloves'];
    pool.sort((a, b) => (first.indexOf(b.product) >= 0 ? 1 : 0) - (first.indexOf(a.product) >= 0 ? 1 : 0) || first.indexOf(a.product) - first.indexOf(b.product));
  }
  const n = Math.min(count, pool.length);
  const perLine = target / Math.max(1, count);
  const items: QuoteItem[] = pool.slice(0, n).map((c) => ({ product: c.product, icon: c.icon, unitPrice: c.price, quantity: Math.max(5, Math.round((perLine / c.price) * (0.6 + rand() * 0.8) / 5) * 5) }));
  // More lines requested than products in the catalogue: add size variants
  for (let i = n; i < count; i++) {
    const c = pool[i % pool.length];
    items.push({ product: `${c.product} – ${['Junior', 'Senior', 'Size M', 'Size L', 'Size XL'][i % 5]}`, icon: c.icon, unitPrice: c.price, quantity: Math.max(5, Math.round((perLine / c.price) / 5) * 5) });
  }
  if (forceFirst) [50, 30, 40, 20].forEach((q, i) => { items[i].quantity = q; });
  return items;
}

const valueOf = (items: QuoteItem[]) => items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

let quotations: Quotation[] = (() => {
  const list: Quotation[] = [];
  const add = (n: number, name: string, type: OrgType, lines: number, value: number, status: QuoteStatus, at: Date) => {
    const rand = seeded(`quote:${n}`);
    const town = n === 0 ? 'Nairobi' : TOWNS[Math.floor(rand() * TOWNS.length)];
    const contact = n === 0 ? 'Mr. James Mwangi' : CONTACTS[Math.floor(rand() * CONTACTS.length)];
    const items = makeItems(lines, value, rand, n === 0);
    // Design rows: scale the unit prices so the items add up to the value shown in the image (within a few shillings)
    if (value) {
      const factor = value / valueOf(items);
      items.forEach((i) => { i.unitPrice = Math.max(10, Math.round(i.unitPrice * factor)); });
    }
    const sentAt = new Date(at.getTime() + 2 * 86400000);
    const validUntil = new Date(sentAt.getTime() + 14 * 86400000);
    list.push({
      id: `#BQ-${String(28 - n).padStart(4, '0')}`,
      org: {
        name, type, contact,
        email: n === 0 ? 'james.mwangi@nya.ac.ke' : `${contact.split(' ').pop()!.toLowerCase()}@${domain(name)}.org`,
        phone: n === 0 ? '+254 712 456 789' : `+254 7${Math.floor(10 + rand() * 89)} ${Math.floor(100 + rand() * 899)} ${Math.floor(100 + rand() * 899)}`,
        address: n === 0 ? '123 Sports Road, Nairobi, Kenya' : `${Math.floor(1 + rand() * 300)} ${['Stadium', 'School', 'Market', 'Station'][Math.floor(rand() * 4)]} Road, ${town}, Kenya`,
      },
      message: MESSAGES[n % MESSAGES.length],
      items,
      // Design rows keep the exact value from the image; others are the sum of their items
      estimatedValue: value || valueOf(items),
      status,
      requestedAt: at.toISOString(),
      notes: n === 0 ? [{ at: new Date(2026, 8, 16, 11, 0).toISOString(), author: 'Admin', text: 'Need to check availability with SprintGear and PlayPro Sports for bulk pricing.' }] : [],
      sent: status === 'Quotation Sent' || status === 'Approved'
        ? { at: sentAt.toISOString(), total: Math.round((value || valueOf(items)) * 0.92 / 100) * 100, discountPercent: 8, deliveryDays: 14, validUntil: toIso(validUntil), message: 'Thank you for your request. Please find our bulk pricing below.' }
        : null,
      declineReason: status === 'Declined' ? 'Requested items are out of season and cannot be supplied in time.' : '',
    });
  };

  DESIGN.forEach(([name, type, lines, value, status, day], n) => add(n, name, type, lines, value, status, new Date(2026, 8, day, 10 + (n % 6), 24)));
  OLDER.forEach(([name, type, status], i) => {
    const rand = seeded(`quote-older:${i}`);
    const at = new Date(2026, 7, 30 - i * 2, 9 + (i % 7), 15);
    add(10 + i, name, type, 5 + Math.floor(rand() * 30), 0, status, at);
  });
  return list;
})();

/* ---------- Helpers ---------- */

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

const dateFrom = (f: QuoteDateFilter) => {
  const d = new Date();
  if (f === 'This month') return toIso(new Date(d.getFullYear(), d.getMonth(), 1));
  d.setDate(d.getDate() - (f === 'Last 30 days' ? 29 : 89));
  return toIso(d);
};

const matches = (q: Quotation, query: QuoteQuery) => {
  const text = (query.search ?? '').trim().toLowerCase().replace(/^#/, '');
  const from = query.date && query.date !== 'All' ? dateFrom(query.date) : '';
  return (!text || [q.id.replace('#', ''), q.org.name, q.org.contact, ...q.items.map((i) => i.product)].some((v) => v.toLowerCase().includes(text)))
    && (!query.orgType || query.orgType === 'All' || q.org.type === query.orgType)
    && (!query.status || query.status === 'All' || q.status === query.status)
    && (!from || toIso(new Date(q.requestedAt)) >= from);
};

/* ---------- Queries ---------- */

// Backend: GET /admin/quotations/summary
export async function getQuoteSummary(): Promise<QuoteSummary> {
  const count = (s: QuoteStatus) => quotations.filter((q) => q.status === s).length;
  return delay({
    total: quotations.length, New: count('New'), 'In Discussion': count('In Discussion'), 'Quotation Sent': count('Quotation Sent'),
    Approved: count('Approved'), Declined: count('Declined'), totalChangePercent: 18,
  }, 250);
}

// Backend: GET /admin/quotations?tab=&search=&orgType=&status=&date=&sort=&page=&limit=
export async function listQuotations(query: QuoteQuery): Promise<QuoteListResult> {
  const filtered = quotations.filter((q) => matches(q, query));
  const { key, dir } = query.sort ?? { key: 'requestedAt', dir: 'desc' };
  const sign = dir === 'asc' ? 1 : -1;
  const value = (q: Quotation) => (key === 'items' ? q.items.length : key === 'estimatedValue' ? q.estimatedValue : 0);
  const rows = filtered
    .filter((q) => query.tab === 'All' || q.status === query.tab)
    .sort((a, b) => (key === 'requestedAt' ? a.requestedAt.localeCompare(b.requestedAt) : value(a) - value(b)) * sign);
  const start = (query.page - 1) * query.perPage;
  return delay({
    rows: clone(rows.slice(start, start + query.perPage)),
    total: rows.length,
    tabCounts: Object.fromEntries([['All', filtered.length], ...QUOTE_STATUSES.map((s) => [s, filtered.filter((q) => q.status === s).length])]) as QuoteListResult['tabCounts'],
  }, 300);
}

// Backend: GET /admin/quotations/:id
export async function getQuotation(id: string): Promise<Quotation> {
  const q = quotations.find((x) => x.id === id);
  if (!q) throw new Error('This quotation was not found');
  return delay(clone(q), 200);
}

/* ---------- Changes ---------- */

const update = (id: string, change: (q: Quotation) => Quotation) => { quotations = quotations.map((q) => (q.id === id ? change(q) : q)); };

// Backend: PATCH /admin/quotations/:id/status  (body: { status, reason })
export async function setQuoteStatus(ids: string[], status: QuoteStatus, reason = ''): Promise<void> {
  ids.forEach((id) => update(id, (q) => ({ ...q, status, declineReason: status === 'Declined' ? reason : q.declineReason })));
  return delay(undefined, 300);
}

// Backend: POST /admin/quotations/:id/send  (body: prices per item, discount, delivery, validity, message) — the server emails it
export async function sendQuotation(id: string, input: { items: QuoteItem[]; discountPercent: number; deliveryDays: number; validUntil: string; message: string }): Promise<void> {
  const subtotal = valueOf(input.items);
  update(id, (q) => ({
    ...q,
    items: input.items,
    status: 'Quotation Sent',
    sent: {
      at: new Date().toISOString(),
      total: Math.round(subtotal * (1 - input.discountPercent / 100)),
      discountPercent: input.discountPercent, deliveryDays: input.deliveryDays, validUntil: input.validUntil, message: input.message,
    },
  }));
  return delay(undefined, 400);
}

// Backend: POST /admin/quotations/:id/notes  (body: { text })
export async function addQuoteNote(id: string, text: string): Promise<void> {
  update(id, (q) => ({ ...q, notes: [...q.notes, { at: new Date().toISOString(), author: 'Admin', text }] }));
  return delay(undefined, 200);
}

// Backend: PATCH /admin/quotations/:id  (body: { org })
export async function updateOrganization(id: string, org: Organization): Promise<void> {
  update(id, (q) => ({ ...q, org }));
  return delay(undefined, 300);
}

// Backend: POST /admin/quotations  (for requests that came in by phone or email)
export async function createQuotation(input: NewQuotation): Promise<Quotation> {
  const next = Math.max(...quotations.map((q) => Number(q.id.replace(/\D/g, '')))) + 1;
  const items = input.items.filter((i) => i.quantity > 0).map((i) => { const c = catalogueItem(i.product); return { product: c.product, icon: c.icon, unitPrice: c.price, quantity: i.quantity }; });
  const created: Quotation = {
    id: `#BQ-${String(next).padStart(4, '0')}`, org: input.org, message: input.message, items,
    estimatedValue: valueOf(items), status: 'New', requestedAt: new Date().toISOString(), notes: [], sent: null, declineReason: '',
  };
  quotations = [created, ...quotations];
  return delay(clone(created), 300);
}
