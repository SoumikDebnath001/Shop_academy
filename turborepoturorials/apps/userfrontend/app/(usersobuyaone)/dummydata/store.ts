// TEMPORARY "dummy backend" for the cart and wishlist: state is kept in this browser's localStorage so the full
// flow works before the API exists. services/api.ts turns it into the exact Cart / WishlistItem shapes in api.md.
// Client-only (the cart and wishlist are always loaded in the browser).

export interface StoredCartLine { id: string; productId: string; kind: 'self' | 'donation'; quantity: number }
export interface StoredCart { lines: StoredCartLine[]; academyId: string | null }
export interface StoredWishlistItem { productId: string; addedAt: string }

const CART_KEY = 'obuya.dummy.cart';
const WISHLIST_KEY = 'obuya.dummy.wishlist';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage blocked: state lasts for this visit only */ }
}

let memoryCart: StoredCart | null = null;
let memoryWishlist: StoredWishlistItem[] | null = null;

export const cartStore = {
  get: (): StoredCart => (memoryCart ??= read<StoredCart>(CART_KEY, { lines: [], academyId: null })),
  set: (cart: StoredCart) => { memoryCart = cart; write(CART_KEY, cart); },
};

export const wishlistStore = {
  get: (): StoredWishlistItem[] => (memoryWishlist ??= read<StoredWishlistItem[]>(WISHLIST_KEY, [])),
  set: (items: StoredWishlistItem[]) => { memoryWishlist = items; write(WISHLIST_KEY, items); },
};

// Dummy academy IDs look like OGA-1234 and give members 10% off items for themselves.
export const ACADEMY_DISCOUNT_PERCENT = 10;
export const isValidAcademyId = (id: string) => /^OGA-\d{4}$/i.test(id.trim());
