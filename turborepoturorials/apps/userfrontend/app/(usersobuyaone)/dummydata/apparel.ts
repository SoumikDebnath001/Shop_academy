// TEMPORARY dummy data for the Apparel flow (Apparel -> category -> items).
// Shapes match services/catalog.types.ts and api.md. Do not delete until the owner says so.
import type { ApparelCategory, CatalogProduct } from '@/services/catalog.types';
import { buildProducts } from './sports';

const IMG = '/userspace/apprelsection';

// Order and names follow the Apparel design (demo/darkmodeui.png).
// "Team & Academy Wear" reuses the jersey artwork until its own image is added to public/userspace/apprelsection.
export const dummyApparelCategories: ApparelCategory[] = [
  { slug: 'jerseys', name: 'Jerseys', image: `${IMG}/jerseys-removebg-preview.png` },
  { slug: 't-shirts', name: 'T-Shirts', image: `${IMG}/tshirts-removebg-preview.png` },
  { slug: 'polo-shirts', name: 'Polo Shirts', image: `${IMG}/polo-removebg-preview.png` },
  { slug: 'training-wear', name: 'Training Wear', image: `${IMG}/Training-removebg-preview.png` },
  { slug: 'shorts', name: 'Shorts', image: `${IMG}/shorts-removebg-preview.png` },
  { slug: 'jackets-hoodies', name: 'Jackets & Hoodies', image: `${IMG}/hoodies-removebg-preview.png` },
  { slug: 'team-academy-wear', name: 'Team & Academy Wear', image: `${IMG}/jerseys-removebg-preview.png` },
  { slug: 'caps-headwear', name: 'Caps & Headwear', image: `${IMG}/headwear-removebg-preview.png` },
];

// Singular product word per category, used in dummy product names.
const NOUNS: Record<string, string> = {
  jerseys: 'Jersey', 't-shirts': 'Logo Tee', 'polo-shirts': 'Polo', 'training-wear': 'Training Top', shorts: 'Shorts',
  'jackets-hoodies': 'Hoodie', 'team-academy-wear': 'Academy Kit', 'caps-headwear': 'Cap',
};

export const dummyApparelProducts: Record<string, CatalogProduct[]> = Object.fromEntries(
  dummyApparelCategories.map((c) => [c.slug, buildProducts({ section: 'apparel', category: c.slug }, NOUNS[c.slug] ?? c.name, 'apparel', c.image)]),
);
