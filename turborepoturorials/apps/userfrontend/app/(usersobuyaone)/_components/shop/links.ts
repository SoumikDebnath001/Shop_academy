import type { CatalogSource } from '@/services/catalog.types';

/** URL of a product view page, from where the product lives in the catalog. */
export const productHref = (id: string, ref: CatalogSource) =>
  ref.section === 'sports' ? `/sports/${ref.sport}/${ref.category}/${id}` : `/apparels/${ref.category}/${id}`;

/** URL of the category listing a product belongs to. */
export const categoryHref = (ref: CatalogSource) =>
  ref.section === 'sports' ? `/sports/${ref.sport}/${ref.category}` : `/apparels/${ref.category}`;

// Obuya Grassroots Foundation website (from the home design, demo/restpagehome.png).
export const FOUNDATION_URL = 'https://obuyagrassrootsfoundation.org';
export const FOUNDATION_DOMAIN = 'obuyagrassrootsfoundation.org';

export const SQUAD_SIZE = 11; // "Kit out a squad: x of 11 players"

// Obuya Cricket Academy social pages ("Follow the Team" bar, footer). Leave a url empty until the real link is
// confirmed; the icon then explains it is coming soon instead of going nowhere.
export const SOCIAL_LINKS: { name: 'Instagram' | 'YouTube' | 'Facebook'; url: string }[] = [
  { name: 'Instagram', url: '' },
  { name: 'YouTube', url: '' },
  { name: 'Facebook', url: '' },
];
