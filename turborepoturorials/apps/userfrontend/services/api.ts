import type {
  ApparelCategory, ApparelProducts, Cart, CartLine, CartLineKind, CatalogProduct, Address, AddressInput, CategoryProducts, ListingSource, SearchSuggestions, FeaturedTab, Order, Partner, ProductDetail,
  ProductPage, ProductQuery, ProductSort, Sport, SportDetail, WishlistItem,
} from './catalog.types';
import {
  ACADEMY_DISCOUNT_PERCENT, buildDummyDetail, cancelDummyOrder, cartStore, dummyOrders, dummyApparelCategories, dummyApparelProducts, dummyCategoryProducts,
  dummyFeatured, dummyPartners, dummyRelated, dummySearch, dummySports, findDummyProduct, isValidAcademyId, wishlistStore, type StoredCart,
} from '@/app/(usersobuyaone)/dummydata';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:2556';
const API_BASE_URL = `${BACKEND_URL}/api/v1`;
const AUTH_BASE_URL = `${BACKEND_URL}/auth`;

// Redirect target that starts the Google OAuth flow on the backend
export const GOOGLE_LOGIN_URL = `${AUTH_BASE_URL}/google`;

const handleResponse = async (response: Response) => {
  const data = await response.json();
  if (!response.ok || data.status === false) {
    const error: any = new Error(data.message || data.error || 'API request failed');
    error.restart = data.restart === true;
    error.credentials = data.credentials;
    throw error;
  }
  return data.data !== undefined ? data.data : data;
};

// Store users are signed in with the Google login cookie, admins with the admin session cookie.
// Both cookies are HttpOnly, so no token is kept in the browser storage.
const fetchAPIFormData = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: { ...options.headers },
    credentials: 'include',
  });
  return handleResponse(response);
};

const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });
  return handleResponse(response);
};

// 🟡 Dummy-data responses. Resolves after a short delay so loaders behave like the real network.
// To connect an endpoint, replace its `mock(...)` body with the fetchAPI call noted beside it.
const MOCK_LATENCY_MS = 450;
const mock = <T,>(data: T, ms = MOCK_LATENCY_MS): Promise<T> => new Promise((resolve) => setTimeout(() => resolve(data), ms));
const mockError = (message: string, ms = 200): Promise<never> => new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms));
const CART_LATENCY_MS = 180; // cart/wishlist actions should feel instant

// 🟡 What the backend does for the cart: resolve products, price lines, apply the academy discount.
const buildCart = (stored: StoredCart): Cart => {
  const lines: CartLine[] = stored.lines.flatMap((l) => {
    const p = findDummyProduct(l.productId);
    if (!p) return [];
    const { id, name, brand, price, image, icon, ref, inStock } = p;
    return [{ id: l.id, kind: l.kind, quantity: l.quantity, product: { id, name, brand, price, image, icon, ref, inStock, subtitle: buildDummyDetail(p).subtitle }, lineTotal: price * l.quantity }];
  });
  const sum = (kind: CartLineKind) => lines.filter((l) => l.kind === kind).reduce((a, l) => ({ count: a.count + l.quantity, total: a.total + l.lineTotal }), { count: 0, total: 0 });
  const self = sum('self');
  const donation = sum('donation');
  const discount = stored.academyId
    ? { academyId: stored.academyId, percent: ACADEMY_DISCOUNT_PERCENT, amount: Math.round((self.total * ACADEMY_DISCOUNT_PERCENT) / 100) }
    : null;
  return { lines, itemCount: self.count + donation.count, self, donation, discount, total: self.total - (discount?.amount ?? 0) + donation.total };
};
const saveCart = (next: StoredCart) => {
  cartStore.set(next);
  return mock(buildCart(next), CART_LATENCY_MS);
};
const MAX_LINE_QTY = 99;
const wishlistItems = (): WishlistItem[] =>
  wishlistStore.get().flatMap((w) => {
    const product = findDummyProduct(w.productId);
    return product ? [{ product, addedAt: w.addedAt }] : [];
  });

// Query string the real endpoint will take (documented in api.md). Arrays are sent comma-separated.
export const productQueryString = (q: ProductQuery) => {
  const params = new URLSearchParams();
  Object.entries(q).forEach(([key, value]) => {
    if (value === undefined || value === false || (Array.isArray(value) && !value.length)) return;
    params.set(key, Array.isArray(value) ? value.join(',') : String(value));
  });
  return params.toString();
};

// 🟡 What the backend does for GET .../products: filter, sort, then page. Facets ignore filters.
const PRODUCT_SORTS: Record<ProductSort, (a: CatalogProduct, b: CatalogProduct) => number> = {
  featured: (a, b) => a.featuredRank - b.featuredRank,
  'rating-desc': (a, b) => b.rating - a.rating || a.featuredRank - b.featuredRank,
  'rating-asc': (a, b) => a.rating - b.rating || a.featuredRank - b.featuredRank,
  'price-asc': (a, b) => a.price - b.price || a.featuredRank - b.featuredRank,
  'price-desc': (a, b) => b.price - a.price || a.featuredRank - b.featuredRank,
};
// `relevance`: the list is already ranked (search), so "featured" keeps that order.
const queryProducts = (all: CatalogProduct[], q: ProductQuery, relevance = false): ProductPage => {
  const { brands = [], minPrice = 0, maxPrice = Infinity, minRating = 0, inStock = false, sort = 'featured', offset = 0, limit = 12 } = q;
  const matching = all
    .filter(
      (p) =>
        (!brands.length || brands.includes(p.brand)) &&
        p.price >= minPrice &&
        p.price <= maxPrice &&
        p.rating >= minRating &&
        (!inStock || p.inStock),
    )
    .sort(relevance && sort === 'featured' ? () => 0 : PRODUCT_SORTS[sort]);
  const prices = all.map((p) => p.price);
  return {
    products: matching.slice(offset, offset + limit),
    total: matching.length,
    offset,
    limit,
    facets: {
      brands: [...new Set(all.map((p) => p.brand))].sort(),
      priceMin: prices.length ? Math.min(...prices) : 0,
      priceMax: prices.length ? Math.max(...prices) : 0,
    },
  };
};

export const api = {
  // Sports catalog (🟡 dummy) — see api.md
  // -> fetchAPI('/user/sports')
  getSports: (): Promise<Sport[]> => mock(dummySports.map(({ slug, name, image }) => ({ slug, name, image }))),
  // -> fetchAPI(`/user/sports/${sport}`); resolves null when the sport does not exist (backend: 404)
  getSport: (sport: string): Promise<SportDetail | null> => mock(dummySports.find((s) => s.slug === sport) ?? null),
  // -> fetchAPI(`/user/sports/${sport}/${category}/products?${productQueryString(query)}`)
  //    resolves null when the sport/category does not exist (backend: 404)
  getSportCategoryProducts: (sport: string, category: string, query: ProductQuery = {}): Promise<CategoryProducts | null> => {
    const s = dummySports.find((x) => x.slug === sport);
    const c = s?.categories.find((x) => x.slug === category);
    if (!s || !c) return mock(null);
    return mock({ sport: { slug: s.slug, name: s.name }, category: c, ...queryProducts(dummyCategoryProducts[`${sport}/${category}`] ?? [], query) });
  },

  // Apparel catalog (🟡 dummy) — see api.md
  // -> fetchAPI('/user/apparel')
  getApparelCategories: (): Promise<ApparelCategory[]> => mock(dummyApparelCategories),
  // -> fetchAPI(`/user/apparel/${category}/products?${productQueryString(query)}`); null when not found (backend: 404)
  getApparelCategoryProducts: (category: string, query: ProductQuery = {}): Promise<ApparelProducts | null> => {
    const c = dummyApparelCategories.find((x) => x.slug === category);
    return mock(c ? { category: c, ...queryProducts(dummyApparelProducts[category] ?? [], query) } : null);
  },

  // One page for any product listing (category or search); used by the shared client ProductListing.
  getCatalogPage: (source: ListingSource, query: ProductQuery): Promise<ProductPage | null> =>
    source.section === 'sports'
      ? api.getSportCategoryProducts(source.sport, source.category, query)
      : source.section === 'apparel'
        ? api.getApparelCategoryProducts(source.category, query)
        : api.searchProducts(source.q, query),

  // Search (🟡 dummy) — see api.md. Queries shorter than 3 characters return nothing.
  // -> fetchAPI(`/user/products/search?q=${q}&limit=${limit}`): best matches for the navbar dropdown
  searchSuggestions: (q: string, limit = 6): Promise<SearchSuggestions> => {
    const all = dummySearch(q);
    return mock({ query: q, products: all.slice(0, limit), total: all.length }, 250);
  },
  // -> fetchAPI(`/user/products/search?q=${q}&${productQueryString(query)}`): full results with filters/sort/paging
  searchProducts: (q: string, query: ProductQuery = {}): Promise<ProductPage> => mock(queryProducts(dummySearch(q), query, true)),

  // Product view (🟡 dummy) — see api.md
  // -> fetchAPI(`/user/products/${id}`); null when not found (backend: 404)
  getProduct: (id: string): Promise<ProductDetail | null> => {
    const p = findDummyProduct(id);
    return mock(p ? buildDummyDetail(p) : null);
  },
  // -> fetchAPI(`/user/products/${id}/related?limit=${limit}`)
  getRelatedProducts: (id: string, limit = 4): Promise<CatalogProduct[]> => {
    const p = findDummyProduct(id);
    return mock(p ? dummyRelated(p, limit) : []);
  },

  // Home "Featured Picks" (🟡 dummy). tab: new | best | bundles
  // -> fetchAPI(`/user/products/featured?tab=${tab}&limit=${limit}`)
  getFeaturedProducts: (tab: FeaturedTab, limit = 12): Promise<CatalogProduct[]> => mock(dummyFeatured(tab, limit)),
  // Home "Sponsors & Partners" (🟡 dummy) -> fetchAPI('/user/partners')
  getPartners: (): Promise<Partner[]> => mock(dummyPartners),

  // Cart (🟡 dummy, kept in this browser) — see api.md. Every call resolves with the whole updated Cart.
  // -> fetchAPI('/user/cart')
  getCart: (): Promise<Cart> => mock(buildCart(cartStore.get()), CART_LATENCY_MS),
  // -> fetchAPI('/user/cart', { method: 'POST', body: { productId, quantity, kind } }); same product + kind merges
  addToCart: (productId: string, quantity = 1, kind: CartLineKind = 'self'): Promise<Cart> => {
    const product = findDummyProduct(productId);
    if (!product) return mockError('Product not found');
    if (!product.inStock) return mockError('This item is out of stock');
    const cart = cartStore.get();
    const existing = cart.lines.find((l) => l.productId === productId && l.kind === kind);
    const lines = existing
      ? cart.lines.map((l) => (l === existing ? { ...l, quantity: Math.min(MAX_LINE_QTY, l.quantity + quantity) } : l))
      : [...cart.lines, { id: `${kind}-${productId}`, productId, kind, quantity: Math.min(MAX_LINE_QTY, quantity) }];
    return saveCart({ ...cart, lines });
  },
  // -> fetchAPI(`/user/cart/${lineId}`, { method: 'PUT', body: { quantity } }); quantity 0 removes the line
  updateCartItem: (lineId: string, quantity: number): Promise<Cart> => {
    const cart = cartStore.get();
    const lines = quantity <= 0
      ? cart.lines.filter((l) => l.id !== lineId)
      : cart.lines.map((l) => (l.id === lineId ? { ...l, quantity: Math.min(MAX_LINE_QTY, quantity) } : l));
    return saveCart({ ...cart, lines });
  },
  // -> fetchAPI(`/user/cart/${lineId}`, { method: 'DELETE' })
  removeFromCart: (lineId: string): Promise<Cart> => {
    const cart = cartStore.get();
    return saveCart({ ...cart, lines: cart.lines.filter((l) => l.id !== lineId) });
  },
  // -> fetchAPI('/user/cart', { method: 'DELETE' })
  clearCart: (): Promise<Cart> => saveCart({ lines: [], academyId: null }),
  // -> fetchAPI('/user/cart/academy', { method: 'PUT', body: { academyId } }); rejects with a message when invalid
  applyAcademyId: (academyId: string): Promise<Cart> => {
    if (!isValidAcademyId(academyId)) return mockError('We could not find that academy ID. It looks like OGA-1234.', 350);
    return saveCart({ ...cartStore.get(), academyId: academyId.trim().toUpperCase() });
  },
  // -> fetchAPI('/user/cart/academy', { method: 'DELETE' })
  removeAcademyId: (): Promise<Cart> => saveCart({ ...cartStore.get(), academyId: null }),

  // Wishlist (🟡 dummy, kept in this browser) — see api.md. Every call resolves with the whole updated list.
  // -> fetchAPI('/user/wishlist')
  getWishlist: (): Promise<WishlistItem[]> => mock(wishlistItems(), CART_LATENCY_MS),
  // -> fetchAPI('/user/wishlist', { method: 'POST', body: { productId } })
  addToWishlist: (productId: string): Promise<WishlistItem[]> => {
    if (!findDummyProduct(productId)) return mockError('Product not found');
    const items = wishlistStore.get();
    if (!items.some((w) => w.productId === productId)) wishlistStore.set([{ productId, addedAt: new Date().toISOString() }, ...items]);
    return mock(wishlistItems(), CART_LATENCY_MS);
  },
  // -> fetchAPI(`/user/wishlist/${productId}`, { method: 'DELETE' })
  removeFromWishlist: (productId: string): Promise<WishlistItem[]> => {
    wishlistStore.set(wishlistStore.get().filter((w) => w.productId !== productId));
    return mock(wishlistItems(), CART_LATENCY_MS);
  },

  // Browse
  getCategories: () => fetchAPI('/user/category'),
  getProducts: (paramsObj?: { category?: string, search?: string, type?: string, page?: number, limit?: number }) => {
    const params = new URLSearchParams();
    if (paramsObj?.category && paramsObj.category !== 'all') params.append('category', paramsObj.category);
    if (paramsObj?.search) params.append('search', paramsObj.search);
    if (paramsObj?.type && paramsObj.type !== 'all') params.append('type', paramsObj.type);
    if (paramsObj?.page) params.append('page', paramsObj.page.toString());
    if (paramsObj?.limit) params.append('limit', paramsObj.limit.toString());
    return fetchAPI(`/user/product?${params.toString()}`);
  },
  getProductById: (id: string) => fetchAPI(`/user/product/${id}`),
  getCategoryById: (id: string) => fetchAPI(`/user/category/${id}`),

  // Admin Inventory - Products
  createProduct: (formData: FormData) => 
    fetchAPIFormData('/admin/product', {
      method: 'POST',
      body: formData,
    }),
  updateProduct: (id: string, formData: FormData) => 
    fetchAPIFormData(`/admin/product/${id}`, {
      method: 'PUT',
      body: formData,
    }),
  deleteProduct: (id: string) => 
    fetchAPI(`/admin/product/${id}`, {
      method: 'DELETE',
    }),

  // Admin Inventory - Categories
  createCategory: (formData: FormData) => 
    fetchAPIFormData('/admin/category', {
      method: 'POST',
      body: formData,
    }),
  updateCategory: (id: string, formData: FormData) => 
    fetchAPIFormData(`/admin/category/${id}`, {
      method: 'PUT',
      body: formData,
    }),
  deleteCategory: (id: string) => 
    fetchAPI(`/admin/category/${id}`, {
      method: 'DELETE',
    }),

  // Admin Dashboard
  getDashboardStats: () => fetchAPI('/admin/dashboard'),

  // Admin Orders
  getAdminOrders: (paramsObj?: { status?: string, search?: string, page?: number, limit?: number }) => {
    const params = new URLSearchParams();
    if (paramsObj?.status) params.append('status', paramsObj.status);
    if (paramsObj?.search) params.append('search', paramsObj.search);
    if (paramsObj?.page) params.append('page', paramsObj.page.toString());
    if (paramsObj?.limit) params.append('limit', paramsObj.limit.toString());
    return fetchAPI(`/admin/order?${params.toString()}`);
  },
  getAdminOrderById: (id: string) => fetchAPI(`/admin/order/${id}`),
  updateOrderStatus: (id: string, statusData: any) =>
    fetchAPI(`/admin/order/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData),
    }),

  // Auth (Google login, cookie based)
  getMe: async () => {
    const response = await fetch(`${AUTH_BASE_URL}/me`, { credentials: 'include' });
    return response.json();
  },
  logout: () =>
    fetch(`${AUTH_BASE_URL}/logout`, {
      method: 'POST',
      credentials: 'include',
    }),

  // Admin Auth (password -> email OTP -> Google Authenticator)
  adminLogin: (email: string, password: string) =>
    fetchAPI('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  adminVerifyOtp: (otp: string) =>
    fetchAPI('/admin/login/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ otp }),
    }),
  adminTotpSetup: () => fetchAPI('/admin/login/totp-setup'),
  adminVerifyTotp: (code: string) =>
    fetchAPI('/admin/login/verify-totp', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
  adminMe: () => fetchAPI('/admin/me'),
  adminLogout: () => fetchAPI('/admin/logout', { method: 'POST' }),
  adminRegister: (adminData: any) =>
    fetchAPI('/admin/register', {
      method: 'POST',
      body: JSON.stringify(adminData),
    }),
  getAdminProfile: () => fetchAPI('/admin/profile'),
  updateAdminProfile: (adminData: any) =>
    fetchAPI('/admin/profile', {
      method: 'PUT',
      body: JSON.stringify(adminData),
    }),

  // User Profile
  getProfile: () => fetchAPI('/user/profile'),
  updateProfile: (userData: { name: string; phone: string }) =>
    fetchAPI('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),
  deleteAccount: () => {
    return fetchAPI('/user/profile', {
      method: 'DELETE',
    });
  },
  
  // Order
  placeOrder: (orderData: any) =>
    fetchAPI('/user/order', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),
    
  // Address
  getAddresses: (): Promise<Address[]> => fetchAPI('/user/address'),
  getAddressById: (id: string): Promise<Address> => fetchAPI(`/user/address/${id}`),
  createAddress: (addressData: AddressInput): Promise<Address> => fetchAPI('/user/address', { method: 'POST', body: JSON.stringify(addressData) }),
  updateAddress: (id: string, addressData: Partial<AddressInput>): Promise<Address> => fetchAPI(`/user/address/${id}`, { method: 'PUT', body: JSON.stringify(addressData) }),
  deleteAddress: (id: string) => fetchAPI(`/user/address/${id}`, { method: 'DELETE' }),
  setDefaultAddress: (id: string) => fetchAPI(`/user/address/${id}/default`, { method: 'PUT' }),

  // Orders (🟡 dummy order history until checkout exists) — see api.md
  // -> fetchAPI('/user/order'), newest first
  getOrders: (): Promise<Order[]> => mock(dummyOrders()),
  // -> fetchAPI(`/user/order/${id}/cancel`, { method: 'PUT', body: { reason } }); only "processing" orders can be cancelled
  cancelOrder: (id: string, _reason?: string): Promise<Order[]> => {
    const order = dummyOrders().find((o) => o.id === id);
    if (!order || order.status !== 'processing') return mockError('This order can no longer be cancelled');
    cancelDummyOrder(id);
    return mock(dummyOrders(), CART_LATENCY_MS);
  },

  // Payments
  createPayment: (paymentData: any) =>
    fetchAPI('/user/payment', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    }),
  getPayments: () => fetchAPI('/user/payment'),
  getPaymentById: (id: string) => fetchAPI(`/user/payment/${id}`),
};
