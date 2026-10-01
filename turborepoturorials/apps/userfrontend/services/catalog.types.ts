// Response shapes for the store catalog APIs. Dummy data and the real backend must both match these (see api.md).

export interface Sport {
  slug: string;
  name: string;
  image: string; // round artwork shown on the Sports page
}

export interface SportCategory {
  slug: string;
  name: string;
  icon: string; // Material Symbols name, drawn as a thin line icon
}

export interface SportDetail extends Sport {
  categories: SportCategory[];
}

export interface CatalogProduct {
  id: string;
  name: string;
  brand: string;
  price: number; // KES
  rating: number; // 0–5, one decimal
  reviewCount: number;
  inStock: boolean;
  featuredRank: number; // lower = shown first for "Featured"
  image?: string; // optional artwork (already ring-framed); cards fall back to `icon`
  icon: string; // category Material Symbols icon, used when there is no image
  ref: CatalogSource; // where the product lives, used to build its URL
}

/** Full product for the product view page. */
export interface ProductDetail extends CatalogProduct {
  subtitle: string; // e.g. "Obuya Pro · Match Fit · Breathable"
  badge?: string; // e.g. "Bestseller"
  description: string;
  images: string[]; // gallery; empty -> the icon ring is shown
  specifications: { label: string; value: string }[];
  shippingReturns: string[];
  breadcrumb: { section: string; sport?: { slug: string; name: string }; category: { slug: string; name: string } };
}

// ---------- Cart ----------
export type CartLineKind = 'self' | 'donation'; // donation = paid for, given to a young athlete, never delivered

export interface CartLine {
  id: string;
  kind: CartLineKind;
  quantity: number;
  product: Pick<CatalogProduct, 'id' | 'name' | 'brand' | 'price' | 'image' | 'icon' | 'ref' | 'inStock'> & { subtitle: string };
  lineTotal: number; // KES
}

export interface Cart {
  lines: CartLine[];
  itemCount: number; // all units (self + donation)
  self: { count: number; total: number };
  donation: { count: number; total: number };
  discount: { academyId: string; percent: number; amount: number } | null; // academy member discount on items for you
  total: number; // self.total - discount + donation.total (shipping calculated at checkout)
}

// ---------- Wishlist ----------
export interface WishlistItem {
  product: CatalogProduct;
  addedAt: string; // ISO date
}

/** Home "Featured Picks" tabs. */
export type FeaturedTab = 'new' | 'best' | 'bundles';

export type ProductSort = 'featured' | 'rating-desc' | 'rating-asc' | 'price-asc' | 'price-desc';

/** Query for one page of a category's products. Filtering, sorting and paging happen on the server. */
export interface ProductQuery {
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  sort?: ProductSort;
  offset?: number; // items to skip (offset-based so phone/desktop page sizes can differ)
  limit?: number;
}

/** One page of a category's products (shared by Sports and Apparel listings). */
export interface ProductPage {
  products: CatalogProduct[]; // just this page
  total: number; // matching products across all pages
  offset: number;
  limit: number;
  facets: {
    // for the whole category, ignoring filters, so the filter panel stays stable
    brands: string[];
    priceMin: number;
    priceMax: number;
  };
}

export interface CategoryProducts extends ProductPage {
  sport: Pick<Sport, 'slug' | 'name'>;
  category: SportCategory;
}

// Apparel: a flat list of categories (T-Shirts, Jerseys, ...), each with round artwork.
export interface ApparelCategory {
  slug: string;
  name: string;
  image: string;
}

export interface ApparelProducts extends ProductPage {
  category: ApparelCategory;
}

/** Where a product lives in the catalog (also used for its URL). */
export type CatalogSource =
  | { section: 'sports'; sport: string; category: string }
  | { section: 'apparel'; category: string };

/** Which listing a ProductListing pages through: a category, or search results for `q`. Plain data (server -> client). */
export type ListingSource = CatalogSource | { section: 'search'; q: string };

/** Navbar search suggestions. */
export interface SearchSuggestions {
  query: string;
  products: CatalogProduct[]; // best matches, up to the requested limit
  total: number; // all matches (for "See all N results")
}

// ---------- Home ----------
export interface Partner {
  name: string;
  logo: string;
  url?: string; // partner website, when there is one
}

// ---------- Account ----------
/** Saved delivery address (🟢 real backend: /user/address). */
export interface Address {
  _id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string; // postal code
  country: string;
  type: 'home' | 'work' | 'other';
  isDefault: boolean;
}
export type AddressInput = Omit<Address, '_id' | 'isDefault'>;

export type OrderStatus = 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  number: string; // shown to the customer, e.g. "OB-24817"
  placedAt: string; // ISO date
  status: OrderStatus;
  lines: Omit<CartLine, 'id'>[]; // same line shape as the cart (self + donation)
  self: { count: number; total: number };
  donation: { count: number; total: number };
  discount: number; // academy member discount, KES
  shipping: number; // KES
  total: number;
  deliverTo?: string; // one-line address summary
}
