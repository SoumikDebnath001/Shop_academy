/* =========================
   ADMIN VENDOR SUPPORT DATA
   Every function here returns DEMO data with a short fake delay.
   To connect the backend, replace the body of each function with the API call
   written in its "Backend:" comment. The types stay the same, so the UI does not change.
========================= */

import { delay, seeded } from './adminDashboard';

/* ---------- Types ---------- */

export const TICKET_STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'] as const;
export const TICKET_PRIORITIES = ['High', 'Medium', 'Low'] as const;
export const TICKET_CATEGORIES = ['Products', 'Inventory', 'Payments', 'Orders', 'Account', 'Quotations'] as const;

export type TicketStatus = typeof TICKET_STATUSES[number];
export type TicketPriority = typeof TICKET_PRIORITIES[number];
export type TicketCategory = typeof TICKET_CATEGORIES[number];
export type TicketTab = 'All' | TicketStatus;
export type TicketSortKey = 'createdAt' | 'updatedAt' | 'priority';

// `url` is set for files added in this visit (they can be downloaded for real); demo files have none
export type TicketAttachment = { name: string; sizeKb: number; url?: string };
export type TicketMessage = { from: 'vendor' | 'admin'; author: string; at: string; text: string; attachments: TicketAttachment[] };

export type TicketVendor = { name: string; email: string; phone: string };

export type Ticket = {
  id: string;
  subject: string;
  vendor: TicketVendor;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string; // ISO date time
  updatedAt: string;
  assignedTo: string | null;
  description: string;
  attachments: TicketAttachment[];
  messages: TicketMessage[];
};

export type TicketQuery = {
  tab: TicketTab;
  search?: string;
  category?: TicketCategory | 'All';
  vendor?: string | 'All';
  status?: TicketStatus | 'All';
  priority?: TicketPriority | 'All';
  sort?: { key: TicketSortKey; dir: 'asc' | 'desc' };
  page: number;
  perPage: number;
};

export type TicketSummary = Record<'total' | TicketStatus, number> & { totalChangePercent: number };
export type TicketListResult = { rows: Ticket[]; total: number; tabCounts: Record<TicketTab, number> };
export type NewTicket = { vendor: string; category: TicketCategory; priority: TicketPriority; subject: string; description: string };

/* ---------- Demo data ---------- */

export const SUPPORT_VENDORS: TicketVendor[] = [
  { name: 'SprintGear Ltd', email: 'sales@sprintgear.co.ke', phone: '+254 712 345 678' },
  { name: 'PlayPro Sports', email: 'support@playpro.co.ke', phone: '+254 722 410 233' },
  { name: 'Swift Athletics', email: 'accounts@swiftathletics.co.ke', phone: '+254 733 902 114' },
  { name: 'FieldMasters', email: 'hello@fieldmasters.co.ke', phone: '+254 700 551 876' },
  { name: 'GoalLine Kenya', email: 'info@goallinekenya.co.ke', phone: '+254 711 208 390' },
  { name: 'East Africa Sports', email: 'ops@eastafricasports.co.ke', phone: '+254 720 664 102' },
  { name: 'The Kit Room', email: 'team@thekitroom.co.ke', phone: '+254 734 118 552' },
  { name: 'ProEdge Equipment', email: 'orders@proedge.co.ke', phone: '+254 701 773 440' },
  { name: 'GameOn Supplies', email: 'admin@gameonsupplies.co.ke', phone: '+254 715 330 917' },
  { name: 'Rising Stars Gear', email: 'care@risingstarsgear.co.ke', phone: '+254 728 994 061' },
];
const vendorByName = (name: string) => SUPPORT_VENDORS.find((v) => v.name === name) ?? SUPPORT_VENDORS[0];

type Design = [string, string, TicketCategory, TicketPriority, TicketStatus, number, number, string];
// subject, vendor, category, priority, status, created day, updated day (Sep 2026), description — the first ten match the image
const DESIGN: Design[] = [
  ['Product upload issue', 'SprintGear Ltd', 'Products', 'High', 'Open', 16, 16, 'Hi team,\nI am getting an error while uploading new products. The images are not saving. Please check.\nThanks,\nSprintGear Ltd'],
  ['Stock update not reflecting', 'PlayPro Sports', 'Inventory', 'Medium', 'In Progress', 15, 16, 'We updated stock for 6 jerseys yesterday but the store still shows them as out of stock.'],
  ['Payout inquiry', 'Swift Athletics', 'Payments', 'High', 'Open', 14, 14, 'Our August payout is missing two orders (#OB10187 and #OB10190). Please confirm when they will be paid.'],
  ['Change in product price', 'FieldMasters', 'Products', 'Low', 'Resolved', 14, 15, 'Please update the price of Training Cones (Set of 10) to KSh 1,200 from next week.'],
  ['Order status clarification', 'GoalLine Kenya', 'Orders', 'Medium', 'In Progress', 13, 14, 'Order #OB10220 shows as shipped but the customer says it has not arrived. Can you check the courier details?'],
  ['Add new product category', 'East Africa Sports', 'Products', 'Low', 'Resolved', 12, 12, 'We would like to start selling swimming gear. Can you add a Swimming category?'],
  ['Unable to generate invoice', 'The Kit Room', 'Payments', 'High', 'Open', 11, 12, 'The invoice button gives an error for all orders this month. We need invoices for our accounts.'],
  ['Return request from customer', 'ProEdge Equipment', 'Orders', 'Medium', 'Resolved', 10, 11, 'A customer wants to return a damaged agility ladder. What is the process?'],
  ['Account verification', 'GameOn Supplies', 'Account', 'Medium', 'In Progress', 9, 11, 'We uploaded our business registration again. Please verify our account so we can sell.'],
  ['Need help with bulk order', 'Rising Stars Gear', 'Quotations', 'Low', 'Closed', 8, 9, 'A school asked us for 200 youth kits. Can this go through the quotation system?'],
];

// 14 older tickets: 3 open, 5 in progress, 6 resolved -> 24 total (6 open, 8 in progress, 9 resolved, 1 closed)
const OLDER: [string, TicketCategory, TicketPriority, TicketStatus][] = [
  ['Images appear blurry on product page', 'Products', 'Medium', 'Open'],
  ['Wrong commission on July statement', 'Payments', 'High', 'Open'],
  ['Cannot edit shipping address', 'Orders', 'Low', 'Open'],
  ['Bulk stock upload failing', 'Inventory', 'High', 'In Progress'],
  ['Customer asking for faster delivery', 'Orders', 'Low', 'In Progress'],
  ['Two-factor login not working', 'Account', 'High', 'In Progress'],
  ['Variant sizes not showing', 'Products', 'Medium', 'In Progress'],
  ['Quotation request not received', 'Quotations', 'Medium', 'In Progress'],
  ['Refund for cancelled order', 'Payments', 'Medium', 'Resolved'],
  ['Update bank account details', 'Account', 'Low', 'Resolved'],
  ['Product rejected without reason', 'Products', 'Medium', 'Resolved'],
  ['Stock count mismatch', 'Inventory', 'Low', 'Resolved'],
  ['Late pickup by courier', 'Orders', 'High', 'Resolved'],
  ['Discount not applied at checkout', 'Payments', 'Medium', 'Resolved'],
];

const ATTACHMENTS: TicketAttachment[][] = [
  [{ name: 'error-screenshot.png', sizeKb: 245 }, { name: 'product-list.xlsx', sizeKb: 120 }],
  [{ name: 'stock-update.csv', sizeKb: 18 }],
  [{ name: 'august-statement.pdf', sizeKb: 310 }],
  [], [{ name: 'courier-receipt.jpg', sizeKb: 520 }], [], [{ name: 'invoice-error.png', sizeKb: 198 }], [{ name: 'damage-photo.jpg', sizeKb: 640 }],
  [{ name: 'business-registration.pdf', sizeKb: 880 }], [],
];

const ADMIN_REPLIES: Record<TicketStatus, string> = {
  Open: '',
  'In Progress': 'Thanks for reaching out. We are looking into this and will update you shortly.',
  Resolved: 'This has been fixed on our side. Please check and let us know if you still see the problem.',
  Closed: 'We have shared the steps for bulk orders by email. Closing this ticket, feel free to open a new one anytime.',
};

let tickets: Ticket[] = (() => {
  const list: Ticket[] = [];
  const make = (n: number, subject: string, vendorName: string, category: TicketCategory, priority: TicketPriority, status: TicketStatus, created: Date, updated: Date, description: string, attachments: TicketAttachment[]) => {
    const vendor = vendorByName(vendorName);
    const firstLine = description.split('\n').filter((l) => !/^(hi|hello|thanks)/i.test(l.trim()) && l.trim() !== vendor.name).join(' ');
    const messages: TicketMessage[] = [{ from: 'vendor', author: vendor.name, at: created.toISOString(), text: n === 0 ? 'Hi team, I am getting an error while uploading new products. The images are not saving. Please check.' : firstLine, attachments }];
    if (status !== 'Open') messages.push({ from: 'admin', author: 'Admin', at: updated.toISOString(), text: ADMIN_REPLIES[status], attachments: [] });
    list.push({
      id: `#VS-${String(24 - n).padStart(4, '0')}`,
      subject, vendor, category, priority, status,
      createdAt: created.toISOString(), updatedAt: updated.toISOString(),
      assignedTo: n === 0 || status !== 'Open' ? 'Admin' : null,
      description, attachments, messages,
    });
  };

  DESIGN.forEach(([subject, vendor, category, priority, status, day, updatedDay, description], n) =>
    make(n, subject, vendor, category, priority, status, new Date(2026, 8, day, 10, 24), new Date(2026, 8, updatedDay, day === updatedDay ? 10 : 15, 24), description, ATTACHMENTS[n]));

  OLDER.forEach(([subject, category, priority, status], i) => {
    const rand = seeded(`ticket:${i}`);
    const vendor = SUPPORT_VENDORS[Math.floor(rand() * SUPPORT_VENDORS.length)].name;
    const created = new Date(2026, 8, 7 - Math.floor(i / 3), 9 + (i % 8), 5);
    const updated = new Date(created.getTime() + (1 + Math.floor(rand() * 3)) * 86400000);
    make(10 + i, subject, vendor, category, priority, status, created, updated, `Hello team,\n${subject}. Please help us resolve this as soon as possible.\nThanks,\n${vendor}`, []);
  });
  return list;
})();

/* ---------- Helpers ---------- */

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const PRIORITY_RANK: Record<TicketPriority, number> = { High: 3, Medium: 2, Low: 1 };

const matches = (t: Ticket, q: TicketQuery) => {
  const text = (q.search ?? '').trim().toLowerCase().replace(/^#/, '');
  return (!text || [t.id.replace('#', ''), t.subject, t.vendor.name, t.category].some((v) => v.toLowerCase().includes(text)))
    && (!q.category || q.category === 'All' || t.category === q.category)
    && (!q.vendor || q.vendor === 'All' || t.vendor.name === q.vendor)
    && (!q.status || q.status === 'All' || t.status === q.status)
    && (!q.priority || q.priority === 'All' || t.priority === q.priority);
};

const update = (id: string, change: (t: Ticket) => Ticket) => { tickets = tickets.map((t) => (t.id === id ? change(t) : t)); };

/* ---------- Queries ---------- */

// Backend: GET /admin/support/summary
export async function getTicketSummary(): Promise<TicketSummary> {
  const count = (s: TicketStatus) => tickets.filter((t) => t.status === s).length;
  return delay({ total: tickets.length, Open: count('Open'), 'In Progress': count('In Progress'), Resolved: count('Resolved'), Closed: count('Closed'), totalChangePercent: 12 }, 250);
}

// Backend: GET /admin/support?tab=&search=&category=&vendor=&status=&priority=&sort=&page=&limit=
export async function listTickets(q: TicketQuery): Promise<TicketListResult> {
  const filtered = tickets.filter((t) => matches(t, q));
  const { key, dir } = q.sort ?? { key: 'createdAt', dir: 'desc' };
  const sign = dir === 'asc' ? 1 : -1;
  const rows = filtered
    .filter((t) => q.tab === 'All' || t.status === q.tab)
    .sort((a, b) => (key === 'priority' ? PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] : a[key].localeCompare(b[key])) * sign);
  const start = (q.page - 1) * q.perPage;
  return delay({
    rows: clone(rows.slice(start, start + q.perPage)),
    total: rows.length,
    tabCounts: Object.fromEntries([['All', filtered.length], ...TICKET_STATUSES.map((s) => [s, filtered.filter((t) => t.status === s).length])]) as TicketListResult['tabCounts'],
  }, 300);
}

// Backend: GET /admin/support/:id
export async function getTicket(id: string): Promise<Ticket> {
  const t = tickets.find((x) => x.id === id);
  if (!t) throw new Error('This ticket was not found');
  // Object URLs of files added in this visit are kept as they are (JSON copy keeps strings)
  return delay(clone(t), 200);
}

/* ---------- Changes ---------- */

// Backend: PATCH /admin/support/:id  (body: { status })
export async function setTicketStatus(ids: string[], status: TicketStatus): Promise<void> {
  const now = new Date().toISOString();
  ids.forEach((id) => update(id, (t) => ({ ...t, status, updatedAt: now })));
  return delay(undefined, 300);
}

// Backend: PATCH /admin/support/:id  (body: { priority })
export async function setTicketPriority(id: string, priority: TicketPriority): Promise<void> {
  update(id, (t) => ({ ...t, priority, updatedAt: new Date().toISOString() }));
  return delay(undefined, 250);
}

// Backend: PATCH /admin/support/:id  (body: { assignedTo })
export async function assignTicket(ids: string[], assignee: string | null): Promise<void> {
  ids.forEach((id) => update(id, (t) => ({ ...t, assignedTo: assignee, updatedAt: new Date().toISOString() })));
  return delay(undefined, 250);
}

// Backend: POST /admin/support/:id/replies  (multipart: text + files) — the server emails the vendor
export async function replyToTicket(id: string, text: string, attachments: TicketAttachment[]): Promise<void> {
  const now = new Date().toISOString();
  update(id, (t) => ({
    ...t,
    // Replying to a new ticket means someone is on it
    status: t.status === 'Open' ? 'In Progress' : t.status,
    assignedTo: t.assignedTo ?? 'Admin',
    updatedAt: now,
    messages: [...t.messages, { from: 'admin', author: 'Admin', at: now, text, attachments }],
  }));
  return delay(undefined, 350);
}

// Backend: POST /admin/support  (a ticket opened by an admin for a vendor, e.g. after a phone call)
export async function createTicket(input: NewTicket): Promise<Ticket> {
  const next = Math.max(...tickets.map((t) => Number(t.id.replace(/\D/g, '')))) + 1;
  const now = new Date().toISOString();
  const vendor = vendorByName(input.vendor);
  const created: Ticket = {
    id: `#VS-${String(next).padStart(4, '0')}`, subject: input.subject, vendor, category: input.category, priority: input.priority,
    status: 'Open', createdAt: now, updatedAt: now, assignedTo: 'Admin', description: input.description, attachments: [],
    messages: [{ from: 'admin', author: 'Admin', at: now, text: `Ticket opened by admin for ${vendor.name}: ${input.description}`, attachments: [] }],
  };
  tickets = [created, ...tickets];
  return delay(clone(created), 300);
}
