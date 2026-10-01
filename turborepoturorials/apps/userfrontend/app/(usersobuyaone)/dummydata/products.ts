// TEMPORARY: product lookup + product-detail builder over the dummy Sports and Apparel catalogs.
import type { CatalogProduct, FeaturedTab, Partner, ProductDetail } from '@/services/catalog.types';
import { dummyApparelCategories, dummyApparelProducts } from './apparel';
import { dummyCategoryProducts, dummySports } from './sports';

const allProducts: CatalogProduct[] = [...Object.values(dummyCategoryProducts).flat(), ...Object.values(dummyApparelProducts).flat()];
const byId = new Map(allProducts.map((p) => [p.id, p]));

export const findDummyProduct = (id: string) => byId.get(id) ?? null;

const FIT: Record<string, string> = { sports: 'Game Ready · Durable', apparel: 'Match Fit · Breathable' };

export function buildDummyDetail(p: CatalogProduct): ProductDetail {
  const ref = p.ref;
  const sport = ref.section === 'sports' ? dummySports.find((s) => s.slug === ref.sport) : undefined;
  const category =
    ref.section === 'sports'
      ? sport?.categories.find((c) => c.slug === ref.category)
      : dummyApparelCategories.find((c) => c.slug === ref.category);
  const kind = category?.name.toLowerCase() ?? 'gear';

  return {
    ...p,
    subtitle: `${p.brand} · ${FIT[ref.section]}`,
    badge: p.rating >= 4.5 ? 'Top rated' : p.featuredRank < 5 ? 'Bestseller' : undefined,
    description: `The official ${p.name}, made for long training days and match days alike. Built to last through every season, it is part of the ${kind} range chosen by Obuya coaches. Every purchase supports grassroots sport and helps create better opportunities for young athletes.`,
    images: p.image ? [p.image, p.image, p.image, p.image] : [],
    specifications: [
      { label: 'Brand', value: p.brand },
      { label: 'Category', value: category?.name ?? '—' },
      ...(sport ? [{ label: 'Sport', value: sport.name }] : []),
      { label: 'Material', value: ref.section === 'apparel' ? '100% recycled polyester, moisture-wicking' : 'Pro-grade, impact tested' },
      { label: 'Care', value: ref.section === 'apparel' ? 'Machine wash cold, do not tumble dry' : 'Wipe clean, store dry' },
      { label: 'SKU', value: p.id.toUpperCase() },
    ],
    shippingReturns: [
      'Delivery across Kenya in 2–5 working days; international delivery in 7–14 days.',
      'Free returns within 14 days if unused and in original packaging.',
      'Donated items are delivered by the Obuya Foundation and cannot be returned.',
    ],
    breadcrumb: {
      section: ref.section === 'sports' ? 'Sports' : 'Apparel',
      sport: sport && { slug: sport.slug, name: sport.name },
      category: { slug: ref.category, name: category?.name ?? ref.category },
    },
  };
}

/** Up to `limit` products from the same category, best "featured" first, excluding the product itself. */
export function dummyRelated(p: CatalogProduct, limit: number): CatalogProduct[] {
  const pool = p.ref.section === 'sports' ? dummyCategoryProducts[`${p.ref.sport}/${p.ref.category}`] : dummyApparelProducts[p.ref.category];
  return (pool ?? []).filter((x) => x.id !== p.id).sort((a, b) => a.featuredRank - b.featuredRank).slice(0, limit);
}

const categoryKey = (p: CatalogProduct) => (p.ref.section === 'sports' ? `${p.ref.sport}/${p.ref.category}` : `apparel/${p.ref.category}`);
const editionOf = (p: CatalogProduct) => Number(p.id.split('-').pop());

/** Home "Featured Picks": new = newest in-stock item per category (sports and apparel interleaved),
 *  best = most reviewed, bundles = bundle categories. */
export function dummyFeatured(tab: FeaturedTab, limit: number): CatalogProduct[] {
  const pool = allProducts.filter((p) => p.inStock);
  if (tab === 'best') return [...pool].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, limit);
  if (tab === 'bundles') return pool.filter((p) => p.ref.category === 'bundles').sort((a, b) => a.featuredRank - b.featuredRank).slice(0, limit);

  const newestPerCategory = new Map<string, CatalogProduct>();
  pool.forEach((p) => {
    const current = newestPerCategory.get(categoryKey(p));
    if (!current || editionOf(p) > editionOf(current)) newestPerCategory.set(categoryKey(p), p);
  });
  const apparel = [...newestPerCategory.values()].filter((p) => p.ref.section === 'apparel');
  const sports = [...newestPerCategory.values()].filter((p) => p.ref.section === 'sports');
  return Array.from({ length: Math.max(apparel.length, sports.length) }, (_, i) => [apparel[i], sports[i]])
    .flat()
    .filter((p): p is CatalogProduct => !!p)
    .slice(0, limit);
}

/** Home "Sponsors & Partners". */
export const dummyPartners: Partner[] = [{ name: 'Obuya Cricket Academy', logo: '/logo-shop.png' }];

// ---------- Search (what the backend search endpoint does) ----------
// Each product is searchable by name, brand, category, sport and section.
const searchText = new Map(
  allProducts.map((p) => {
    const d = buildDummyDetail(p);
    return [p.id, [p.name, p.brand, d.breadcrumb.category.name, d.breadcrumb.sport?.name ?? '', d.breadcrumb.section].join(' ')];
  }),
);
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Case-insensitive regex search. Every word typed must match somewhere (name, brand, category, sport).
 * Ranked: name starts with the query > name contains it > every word matches a whole word > a name word starts
 * with a term > other matches;
 * ties by "featured". In-stock items first.
 */
export function dummySearch(query: string): CatalogProduct[] {
  const q = query.trim();
  if (q.length < 3) return [];
  const terms = q.split(/\s+/).map((t) => new RegExp(escapeRegex(t), 'i'));
  const whole = new RegExp(escapeRegex(q), 'i');
  const startsWhole = new RegExp(`^${escapeRegex(q)}|\\s${escapeRegex(q)}`, 'i');
  const wordStart = terms.map((t) => new RegExp(`(^|\\s)${t.source}`, 'i'));
  const wholeWord = terms.map((t) => new RegExp(`(^|\\s)${t.source}s?($|\\s)`, 'i')); // "bat" matches "Bat"/"Bats", not "Batting"
  const score = (p: CatalogProduct) => {
    if (startsWhole.test(p.name)) return 0;
    if (whole.test(p.name)) return 1;
    const text = searchText.get(p.id) ?? '';
    if (wholeWord.every((r) => r.test(text))) return 2; // every word matches a whole word (name, category, sport...)
    return wordStart.some((r) => r.test(p.name)) ? 3 : 4;
  };
  return allProducts
    .filter((p) => terms.every((t) => t.test(searchText.get(p.id) ?? '')))
    .map((p) => ({ p, s: score(p) }))
    .sort((a, b) => Number(b.p.inStock) - Number(a.p.inStock) || a.s - b.s || a.p.featuredRank - b.p.featuredRank)
    .map(({ p }) => p);
}
