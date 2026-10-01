/* =========================
   ADMIN PRODUCTS (INVENTORY) DATA
   Every function here returns DEMO data with a short fake delay.
   To connect the backend, replace the body of each function with the API call
   written in its "Backend:" comment. The types stay the same, so the UI does not change.

   Note: the real Product model has no vendor, approval status or sport yet.
   Those fields need to be added to the backend before this page can go live.
========================= */

import { delay, seeded } from './adminDashboard';

/* ---------- Types ---------- */

export const PRODUCT_STATUSES = ['Live', 'Pending', 'Unpublished', 'Rejected', 'Changes Requested'] as const;
export type ProductStatus = typeof PRODUCT_STATUSES[number];

export type ProductTab = 'All' | 'Pending' | 'Unpublished';

export type ProductHistoryEntry = { at: string; text: string };

export type AdminProduct = {
  id: string;
  name: string;
  sku: string;
  icon: string; // picture placeholder (Material Symbols name) until real images come from the backend
  vendor: string;
  category: string;
  subcategory: string;
  sport: string;
  brand: string;
  price: number; // KSh
  stock: number;
  submittedAt: string; // ISO date time
  status: ProductStatus;
  description: string;
  material: string;
  weight: string;
  audience: string;
  tags: string[];
  imageCount: number;
  history: ProductHistoryEntry[];
};

export type ProductSortKey = 'submittedAt' | 'price' | 'stock';

export type ProductQuery = {
  tab: ProductTab;
  search?: string;
  category?: string | 'All';
  sport?: string | 'All';
  vendor?: string | 'All';
  status?: ProductStatus | 'All';
  sort?: { key: ProductSortKey; dir: 'asc' | 'desc' };
  page: number;
  perPage: number;
};

export type ProductSummary = { live: number; pending: number; unpublished: number; vendors: number; liveChangePercent: number };

export type ProductListResult = {
  rows: AdminProduct[];
  total: number;
  tabCounts: Record<ProductTab, number>;
};

export type ReviewDecision = 'approve' | 'reject' | 'request-changes';

/* ---------- Demo catalogue ---------- */

type Template = Omit<AdminProduct, 'id' | 'sku' | 'submittedAt' | 'status' | 'history' | 'vendor' | 'price' | 'stock'> & { vendor: string; price: number; stock: number; code: string };

const T = (t: Template) => t;
const TEMPLATES: Template[] = [
  T({ name: 'Cricket Training Bat', code: 'CTB', icon: 'sports_cricket', vendor: 'SprintGear Ltd', category: 'Cricket', subcategory: 'Bats', sport: 'Cricket', brand: 'SG', price: 2500, stock: 50, description: 'High-quality training bat suitable for school and academy use. Durable and lightweight.', material: 'Kashmir Willow', weight: '900 g', audience: 'Schools, Academies, Individuals', tags: ['Training', 'Beginner', 'Durable'], imageCount: 4 }),
  T({ name: 'Football Jersey (Blue)', code: 'FJ', icon: 'apparel', vendor: 'PlayPro Sports', category: 'Football', subcategory: 'Jerseys', sport: 'Football', brand: 'PlayPro', price: 2800, stock: 100, description: 'Breathable match jersey with moisture-wicking fabric. Sizes S to XXL.', material: 'Polyester', weight: '180 g', audience: 'Teams, Schools', tags: ['Matchday', 'Team kit'], imageCount: 3 }),
  T({ name: 'Running Shoes', code: 'RS', icon: 'steps', vendor: 'Swift Athletics', category: 'Athletics', subcategory: 'Footwear', sport: 'Athletics', brand: 'Swift', price: 5200, stock: 75, description: 'Cushioned running shoes for track and road training.', material: 'Mesh upper, EVA sole', weight: '280 g', audience: 'Athletes, Individuals', tags: ['Running', 'Comfort'], imageCount: 4 }),
  T({ name: 'Training Cones (Set of 10)', code: 'TC', icon: 'change_history', vendor: 'FieldMasters', category: 'Football', subcategory: 'Training Aids', sport: 'Football', brand: 'FieldMasters', price: 1200, stock: 200, description: 'Bright, stackable cones for drills and agility training.', material: 'PVC', weight: '600 g', audience: 'Coaches, Academies', tags: ['Drills', 'Training'], imageCount: 2 }),
  T({ name: 'Goalkeeper Gloves', code: 'GK', icon: 'back_hand', vendor: 'PlayPro Sports', category: 'Football', subcategory: 'Gloves', sport: 'Football', brand: 'PlayPro', price: 3500, stock: 40, description: 'Latex palm gloves with finger protection for strong grip.', material: 'Latex, Neoprene', weight: '250 g', audience: 'Goalkeepers', tags: ['Grip', 'Protection'], imageCount: 3 }),
  T({ name: 'Cricket Helmet', code: 'CH', icon: 'sports_motorsports', vendor: 'SprintGear Ltd', category: 'Cricket', subcategory: 'Protective Gear', sport: 'Cricket', brand: 'SG', price: 4800, stock: 25, description: 'Lightweight helmet with steel grille, meets safety standards.', material: 'ABS shell, steel grille', weight: '750 g', audience: 'Batters, Academies', tags: ['Safety', 'Protection'], imageCount: 4 }),
  T({ name: 'Yoga & Fitness Mat', code: 'YM', icon: 'self_improvement', vendor: 'Swift Athletics', category: 'Fitness', subcategory: 'Mats', sport: 'Multi-Sport', brand: 'Swift', price: 2200, stock: 60, description: 'Non-slip 6 mm mat for yoga, stretching and floor workouts.', material: 'TPE', weight: '1.1 kg', audience: 'Individuals, Gyms', tags: ['Fitness', 'Non-slip'], imageCount: 2 }),
  T({ name: 'Team Water Bottle', code: 'WB', icon: 'water_bottle', vendor: 'FieldMasters', category: 'Accessories', subcategory: 'Bottles', sport: 'Multi-Sport', brand: 'FieldMasters', price: 900, stock: 300, description: 'BPA-free 750 ml squeeze bottle with team print option.', material: 'BPA-free plastic', weight: '120 g', audience: 'Teams, Schools', tags: ['Hydration'], imageCount: 2 }),
  T({ name: 'Basketball (Size 7)', code: 'BB', icon: 'sports_basketball', vendor: 'PlayPro Sports', category: 'Basketball', subcategory: 'Balls', sport: 'Basketball', brand: 'PlayPro', price: 2900, stock: 80, description: 'Indoor and outdoor composite leather basketball.', material: 'Composite leather', weight: '620 g', audience: 'Schools, Clubs', tags: ['Indoor', 'Outdoor'], imageCount: 3 }),
  T({ name: 'Cricket Pads (Men)', code: 'CP', icon: 'shield', vendor: 'SprintGear Ltd', category: 'Cricket', subcategory: 'Protective Gear', sport: 'Cricket', brand: 'SG', price: 3800, stock: 30, description: 'Lightweight batting pads with extra knee protection.', material: 'PU, foam', weight: '1.4 kg', audience: 'Batters', tags: ['Protection'], imageCount: 3 }),
  T({ name: 'Football (Size 5)', code: 'FB', icon: 'sports_soccer', vendor: 'GoalLine Kenya', category: 'Football', subcategory: 'Balls', sport: 'Football', brand: 'GoalLine', price: 2100, stock: 150, description: 'Machine-stitched match ball for grass and turf.', material: 'PU', weight: '430 g', audience: 'Teams, Schools', tags: ['Matchday'], imageCount: 3 }),
  T({ name: 'Track Spikes', code: 'TS', icon: 'directions_run', vendor: 'Swift Athletics', category: 'Athletics', subcategory: 'Footwear', sport: 'Athletics', brand: 'Swift', price: 3900, stock: 45, description: 'Sprint spikes with removable pins.', material: 'Mesh, Pebax plate', weight: '190 g', audience: 'Athletes', tags: ['Sprint', 'Competition'], imageCount: 2 }),
];

const VENDOR_CODES: Record<string, string> = { 'SprintGear Ltd': 'SGL', 'PlayPro Sports': 'PPS', 'Swift Athletics': 'SFT', FieldMasters: 'FTR', 'GoalLine Kenya': 'GLK' };

export const PRODUCT_VENDORS = Object.keys(VENDOR_CODES);
export const PRODUCT_CATEGORIES = [...new Set(TEMPLATES.map((t) => t.category))].sort();
export const PRODUCT_SPORTS = [...new Set(TEMPLATES.map((t) => t.sport))].sort();

const SIZES = ['', ' (Junior)', ' (Pro)', ' – Black', ' – Red', ' – Green', ' (Pack of 2)', ' – Club Edition'];

// The 10 pending products from the design image, newest first
const DESIGN_PENDING: [number, number, number, string][] = [
  // template index, sku number, day of Sep 2026, time
  [0, 1, 16, '10:24'], [1, 23, 16, '09:10'], [2, 908, 15, '16:40'], [3, 10, 15, '11:05'], [4, 110, 14, '15:30'],
  [5, 14, 14, '12:15'], [6, 220, 14, '09:45'], [7, 305, 13, '14:20'], [8, 77, 13, '10:00'], [9, 19, 12, '17:30'],
];

let products: AdminProduct[] = (() => {
  const list: AdminProduct[] = [];
  const make = (t: Template, n: number, skuNo: number, at: Date, status: ProductStatus, vary = ''): AdminProduct => {
    const rand = seeded(`product:${n}`);
    const factor = vary ? 0.8 + rand() * 0.5 : 1;
    const submittedAt = at.toISOString();
    return {
      ...t,
      id: `PRD-${1000 + n}`,
      name: t.name + vary,
      sku: `${VENDOR_CODES[t.vendor]}-${t.code}-${String(skuNo).padStart(3, '0')}`,
      price: Math.round((t.price * factor) / 50) * 50,
      stock: vary ? Math.floor(rand() * 250) : t.stock,
      submittedAt,
      status,
      history: [{ at: submittedAt, text: `Submitted by ${t.vendor}` }],
    };
  };

  DESIGN_PENDING.forEach(([ti, sku, day, time], i) => {
    const [h, m] = time.split(':').map(Number);
    list.push(make(TEMPLATES[ti], i, sku, new Date(2026, 8, day, h, m), 'Pending'));
  });

  // 4 more pending, then live, unpublished and a few reviewed ones, going back in time
  const plan: [ProductStatus, number][] = [['Pending', 4], ['Live', 428], ['Unpublished', 32], ['Rejected', 5], ['Changes Requested', 3]];
  let n = list.length;
  const start = new Date(2026, 8, 12, 9, 0).getTime();
  for (const [status, count] of plan) {
    for (let i = 0; i < count; i++, n++) {
      const t = TEMPLATES[n % TEMPLATES.length];
      const vary = SIZES[Math.floor(n / TEMPLATES.length) % SIZES.length] || ` #${Math.floor(n / TEMPLATES.length)}`;
      const at = new Date(start - n * 7 * 3600000);
      const p = make(t, n, 100 + n, at, status, vary);
      if (status === 'Live') p.history.push({ at: new Date(at.getTime() + 86400000).toISOString(), text: 'Approved and published' });
      if (status === 'Unpublished') p.history.push({ at: new Date(at.getTime() + 86400000).toISOString(), text: 'Unpublished by admin' });
      if (status === 'Rejected') p.history.push({ at: new Date(at.getTime() + 86400000).toISOString(), text: 'Rejected: images do not match the product' });
      if (status === 'Changes Requested') p.history.push({ at: new Date(at.getTime() + 86400000).toISOString(), text: 'Changes requested: please add size details' });
      list.push(p);
    }
  }
  return list;
})();

/* ---------- Queries ---------- */

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

const inTab = (p: AdminProduct, tab: ProductTab) =>
  tab === 'All' || (tab === 'Pending' ? p.status === 'Pending' : p.status === 'Unpublished');

const matches = (p: AdminProduct, q: ProductQuery) => {
  const text = (q.search ?? '').trim().toLowerCase();
  return (!text || [p.name, p.sku, p.vendor, p.category, p.brand].some((v) => v.toLowerCase().includes(text)))
    && (!q.category || q.category === 'All' || p.category === q.category)
    && (!q.sport || q.sport === 'All' || p.sport === q.sport)
    && (!q.vendor || q.vendor === 'All' || p.vendor === q.vendor)
    && (!q.status || q.status === 'All' || p.status === q.status);
};

// Backend: GET /admin/products/summary
export async function getProductSummary(): Promise<ProductSummary> {
  return delay({
    live: products.filter((p) => p.status === 'Live').length,
    pending: products.filter((p) => p.status === 'Pending').length,
    unpublished: products.filter((p) => p.status === 'Unpublished').length,
    vendors: 86,
    liveChangePercent: 12,
  }, 250);
}

// Backend: GET /admin/products?tab=&search=&category=&sport=&vendor=&status=&sort=&page=&limit=
export async function listProducts(q: ProductQuery): Promise<ProductListResult> {
  const filtered = products.filter((p) => matches(p, q));
  const { key, dir } = q.sort ?? { key: 'submittedAt', dir: 'desc' };
  const sign = dir === 'asc' ? 1 : -1;
  const rows = filtered
    .filter((p) => inTab(p, q.tab))
    .sort((a, b) => (key === 'submittedAt' ? a.submittedAt.localeCompare(b.submittedAt) : a[key] - b[key]) * sign);

  const start = (q.page - 1) * q.perPage;
  return delay({
    rows: clone(rows.slice(start, start + q.perPage)),
    total: rows.length,
    tabCounts: {
      All: filtered.length,
      Pending: filtered.filter((p) => inTab(p, 'Pending')).length,
      Unpublished: filtered.filter((p) => inTab(p, 'Unpublished')).length,
    },
  }, 300);
}

// Backend: GET /admin/products/:id
export async function getProduct(id: string): Promise<AdminProduct> {
  const found = products.find((p) => p.id === id);
  if (!found) throw new Error('This product was not found');
  return delay(clone(found), 200);
}

// Backend: POST /admin/products/review  (body: { ids, decision, note })
export async function reviewProducts(ids: string[], decision: ReviewDecision, note = ''): Promise<void> {
  const now = new Date().toISOString();
  const next: Record<ReviewDecision, ProductStatus> = { approve: 'Live', reject: 'Rejected', 'request-changes': 'Changes Requested' };
  const text: Record<ReviewDecision, string> = {
    approve: 'Approved and published',
    reject: `Rejected${note ? `: ${note}` : ''}`,
    'request-changes': `Changes requested${note ? `: ${note}` : ''}`,
  };
  products = products.map((p) => (ids.includes(p.id) ? { ...p, status: next[decision], history: [...p.history, { at: now, text: text[decision] }] } : p));
  return delay(undefined, 350);
}

// Backend: PATCH /admin/products/:id  (body: { published })
export async function setProductPublished(id: string, published: boolean): Promise<void> {
  const now = new Date().toISOString();
  products = products.map((p) => (p.id === id
    ? { ...p, status: published ? 'Live' : 'Unpublished', history: [...p.history, { at: now, text: published ? 'Published by admin' : 'Unpublished by admin' }] }
    : p));
  return delay(undefined, 300);
}

/* ---------- Import ---------- */

export const IMPORT_COLUMNS = ['name', 'sku', 'vendor', 'category', 'sport', 'brand', 'price', 'stock', 'description'] as const;

export type ImportResult = { added: number; skipped: { line: number; reason: string }[] };

// Reads one CSV line, allowing "quoted, values" with commas inside
const parseCsvLine = (line: string) => {
  const out: string[] = [];
  let cur = '', quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') quoted = false; else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur);
  return out.map((v) => v.trim());
};

// Backend: POST /admin/products/import  (multipart file)
export async function importProducts(csvText: string): Promise<ImportResult> {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) throw new Error('The file is empty');
  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const missing = ['name', 'vendor', 'category', 'price'].filter((c) => !header.includes(c));
  if (missing.length) throw new Error(`Missing column(s): ${missing.join(', ')}. Download the template to see the format.`);

  const col = (row: string[], name: string) => row[header.indexOf(name)] ?? '';
  const skipped: ImportResult['skipped'] = [];
  const added: AdminProduct[] = [];
  const now = new Date();

  lines.slice(1).forEach((line, i) => {
    const row = parseCsvLine(line);
    const name = col(row, 'name');
    const price = Number(col(row, 'price'));
    const stock = Number(col(row, 'stock') || 0);
    const sku = col(row, 'sku') || `IMP-${Date.now().toString(36).toUpperCase()}-${i + 1}`;
    if (!name) return skipped.push({ line: i + 2, reason: 'Name is empty' });
    if (!Number.isFinite(price) || price < 0) return skipped.push({ line: i + 2, reason: 'Price is not a number' });
    if (products.some((p) => p.sku === sku) || added.some((p) => p.sku === sku)) return skipped.push({ line: i + 2, reason: `SKU ${sku} already exists` });

    const vendor = col(row, 'vendor') || 'Unknown vendor';
    added.push({
      id: `PRD-IMP-${now.getTime()}-${i}`,
      name, sku, vendor,
      icon: 'inventory_2',
      category: col(row, 'category') || 'Uncategorised',
      subcategory: '',
      sport: col(row, 'sport') || 'Multi-Sport',
      brand: col(row, 'brand'),
      price, stock: Number.isFinite(stock) ? stock : 0,
      submittedAt: now.toISOString(),
      status: 'Pending',
      description: col(row, 'description'),
      material: '', weight: '', audience: '', tags: [], imageCount: 0,
      history: [{ at: now.toISOString(), text: 'Imported from CSV by admin' }],
    });
  });

  products = [...added, ...products];
  return delay({ added: added.length, skipped }, 400);
}
