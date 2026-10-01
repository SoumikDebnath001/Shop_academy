// TEMPORARY dummy data for the Sports flow (Sports -> sport -> category -> items).
// Shapes match services/catalog.types.ts and api.md. Do not delete until the owner says so.
import type { CatalogProduct, CatalogSource, SportDetail } from '@/services/catalog.types';

const IMG = '/userspace/sportsection';

export const dummySports: SportDetail[] = [
  {
    slug: 'cricket',
    name: 'Cricket',
    image: `${IMG}/cricket-removebg-preview.png`,
    categories: [
      { slug: 'bats', name: 'Bats', icon: 'sports_cricket' },
      { slug: 'balls', name: 'Balls', icon: 'sports_baseball' },
      { slug: 'batting-pads', name: 'Batting Pads', icon: 'shield' },
      { slug: 'batting-gloves', name: 'Batting Gloves', icon: 'back_hand' },
      { slug: 'helmets', name: 'Helmets', icon: 'sports_motorsports' },
      { slug: 'kit-bags', name: 'Kit Bags', icon: 'work' },
      { slug: 'bundles', name: 'Bundles', icon: 'inventory_2' },
    ],
  },
  {
    slug: 'football',
    name: 'Football',
    image: `${IMG}/football_-removebg-preview.png`,
    categories: [
      { slug: 'footballs', name: 'Footballs', icon: 'sports_soccer' },
      { slug: 'boots', name: 'Boots', icon: 'steps' },
      { slug: 'shin-guards', name: 'Shin Guards', icon: 'shield' },
      { slug: 'goalkeeper-gloves', name: 'Goalkeeper Gloves', icon: 'back_hand' },
      { slug: 'training-gear', name: 'Training Gear', icon: 'fitness_center' },
      { slug: 'kit-bags', name: 'Kit Bags', icon: 'work' },
      { slug: 'bundles', name: 'Bundles', icon: 'inventory_2' },
    ],
  },
  {
    slug: 'rugby',
    name: 'Rugby',
    image: `${IMG}/rugby-removebg-preview.png`,
    categories: [
      { slug: 'rugby-balls', name: 'Rugby Balls', icon: 'sports_rugby' },
      { slug: 'boots', name: 'Boots', icon: 'steps' },
      { slug: 'headguards', name: 'Headguards', icon: 'sports_motorsports' },
      { slug: 'shoulder-pads', name: 'Shoulder Pads', icon: 'shield' },
      { slug: 'mouthguards', name: 'Mouthguards', icon: 'dentistry' },
      { slug: 'kit-bags', name: 'Kit Bags', icon: 'work' },
      { slug: 'bundles', name: 'Bundles', icon: 'inventory_2' },
    ],
  },
];

const BRANDS = ['Academy Line', 'Grassroots Co.', 'Obuya', 'Obuya Pro'];
const TIERS = ['Club', 'Elite', 'Junior', 'Match', 'Pro', 'Training'];
const BASE_PRICE: Record<string, number> = {
  jerseys: 2400, 't-shirts': 1300, 'polo-shirts': 1800, 'training-wear': 2000, shorts: 1100, 'jackets-hoodies': 3200, 'team-academy-wear': 4200, 'caps-headwear': 800,
  bats: 4800, balls: 900, 'batting-pads': 3200, 'batting-gloves': 1900, helmets: 4200, 'kit-bags': 3600, bundles: 9800,
  footballs: 1500, boots: 4500, 'shin-guards': 800, 'goalkeeper-gloves': 2200, 'training-gear': 1200,
  'rugby-balls': 2100, headguards: 2600, 'shoulder-pads': 3400, mouthguards: 500,
};

// 30 deterministic products per sport/category, enough to exercise filtering, sorting and pagination.
const PRODUCTS_PER_CATEGORY = 30;
const EDITIONS = ['', ' II', ' III', ' IV', ' V'];
const singular = (name: string) => name.replace(/s$/, '');

const refKey = (ref: CatalogSource) => (ref.section === 'sports' ? `${ref.sport}-${ref.category}` : `apparel-${ref.category}`);

// `noun` is the singular product word used in names, e.g. "Bat" -> "Obuya Bat Club".
export const buildProducts = (ref: CatalogSource, noun: string, icon: string, image?: string): CatalogProduct[] =>
  Array.from({ length: PRODUCTS_PER_CATEGORY }, (_, i) => {
    const category = ref.category;
    const section = ref.section === 'sports' ? ref.sport : 'apparel';
    const base = BASE_PRICE[category] ?? 1500;
    const tier = TIERS[i % TIERS.length];
    return {
      id: `${refKey(ref)}-${i + 1}`,
      name: `Obuya ${noun} ${tier}${EDITIONS[Math.floor(i / TIERS.length)]}`,
      brand: BRANDS[(i + section.length) % BRANDS.length],
      price: Math.round((base * (0.7 + ((i * 7) % 13) * 0.12)) / 100) * 100,
      rating: Math.round((3.2 + ((i * 7 + category.length) % 18) / 10) * 10) / 10,
      reviewCount: 12 + ((i * 37 + category.length * 11) % 180),
      inStock: (i + category.length) % 5 !== 0,
      featuredRank: (i * 11 + category.length) % PRODUCTS_PER_CATEGORY,
      icon,
      ref,
      ...(image && { image }),
    };
  });

export const dummyCategoryProducts: Record<string, CatalogProduct[]> = Object.fromEntries(
  dummySports.flatMap((sport) =>
    sport.categories.map((category) => [`${sport.slug}/${category.slug}`, buildProducts({ section: 'sports', sport: sport.slug, category: category.slug }, singular(category.name), category.icon)]),
  ),
);
