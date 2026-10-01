# Obuya One — Store API contract

Every API the store frontend needs. The frontend currently serves these from `app/(usersobuyaone)/dummydata/`
through `services/api.ts`; the backend must return exactly the shapes below so pages connect without changes.

- Base URL: `${NEXT_PUBLIC_BACKEND_URL}/api/v1` (default `http://localhost:2556/api/v1`); auth routes use `/auth`.
- Auth: HttpOnly cookie (`credentials: 'include'`).
- Envelope: `{ "status": true, "data": <payload> }`. Errors: `{ "status": false, "message": "..." }`.
  The `data` value is what each "Response" below describes.

Status legend: 🟡 dummy data · 🟢 connected to backend · ⚪ listed, not yet built

## Auth
| Status | Method | Path | Request | Response |
|---|---|---|---|---|
| 🟢 | GET | `/auth/google` | redirect | redirects back to `/auth` (`?error=` on failure) |
| 🟢 | GET | `/auth/me` | — | **Not enveloped:** `{ isAuthenticated: boolean, user: { id, email, name, picture, phone? } \| null }` — used by navbar avatar / Profile tab |
| 🟢 | POST | `/auth/logout` | — | _TBD_ |

## Product listings: shared query + page format
Used by both Sports and Apparel item pages. Filtering, sorting and paging run **on the server**, so the browser only
ever holds what is on screen. Types: `services/catalog.types.ts` (`ProductQuery`, `ProductPage`).

**Query params** (all optional; arrays comma-separated):

| Param | Example | Meaning |
|---|---|---|
| `brands` | `Obuya,Obuya Pro` | match any of these brands |
| `minPrice` / `maxPrice` | `1300` / `2700` | KES, inclusive |
| `minRating` | `4.5` | rating ≥ value |
| `inStock` | `true` | only in-stock items |
| `sort` | `featured` · `rating-desc` · `rating-asc` · `price-asc` · `price-desc` | default `featured` (ties broken by `featuredRank`) |
| `offset` / `limit` | `12` / `12` | paging. Frontend asks for **12 per page on desktop/tablet, 8 on phones**; "Load more" requests only the missing items |

**Response `data` (`ProductPage`):**
```json
{
  "products": [
    { "id": "cricket-bats-1", "name": "Obuya Bat Club", "brand": "Obuya Pro", "price": 3800, "rating": 3.6,
      "reviewCount": 78, "inStock": true, "featuredRank": 4, "image": "/optional/artwork.png",
      "icon": "sports_cricket", "ref": { "section": "sports", "sport": "cricket", "category": "bats" } }
  ],
  "total": 30,
  "offset": 0,
  "limit": 12,
  "facets": { "brands": ["Academy Line", "Grassroots Co.", "Obuya", "Obuya Pro"], "priceMin": 900, "priceMax": 8200 }
}
```
- `products`: this page only. `total`: all matching items (for "12 of 30 products" and "Load more").
- `facets`: for the **whole category, ignoring filters**, so the filter panel's brand list and price range stay stable.
- `ref` says where the product lives (`{ section: "sports", sport, category }` or `{ section: "apparel", category }`); the frontend builds the product URL from it. `icon` = category icon, used when there is no `image`.
- `price` in KES (whole shillings); `rating` 0–5, one decimal; `image` optional (artwork already includes the gold ring; without it the card draws the ring around the category icon).

## Sports catalog (Sports → sport → category → items)
Dummy data: `app/(usersobuyaone)/dummydata/sports.ts` · Service: `api.getSports / getSport / getSportCategoryProducts`

| Status | Method | Path | Request | Response (`data`) |
|---|---|---|---|---|
| 🟡 | GET | `/user/sports` | — | `Sport[]` = `[{ slug: "cricket", name: "Cricket", image: "/userspace/sportsection/cricket.png" }]` |
| 🟡 | GET | `/user/sports/:sport` | — | `SportDetail` = `{ slug, name, image, categories: [{ slug: "bats", name: "Bats", icon: "sports_cricket" }] }` · 404 if unknown |
| 🟡 | GET | `/user/sports/:sport/:category/products` | listing query params | `ProductPage` + `sport: { slug, name }` + `category: { slug, name, icon }` · 404 if unknown |

- `icon` is a [Material Symbols](https://fonts.google.com/icons) name.

## Apparel catalog (Apparel → category → items)
Dummy data: `app/(usersobuyaone)/dummydata/apparel.ts` · Service: `api.getApparelCategories / getApparelCategoryProducts`

| Status | Method | Path | Request | Response (`data`) |
|---|---|---|---|---|
| 🟡 | GET | `/user/apparel` | — | `ApparelCategory[]` = `[{ slug: "t-shirts", name: "T-Shirts", image: "/userspace/apprelsection/tshirts.png" }]` |
| 🟡 | GET | `/user/apparel/:category/products` | listing query params | `ProductPage` + `category: { slug, name, image }` · 404 if unknown |

**When connecting** any of these: on a 404 the service must resolve `null` (the page then shows Next.js "not found").

## Catalog
| Status | Method | Path | Request | Response |
|---|---|---|---|---|
| 🟢 | GET | `/user/category` | — | _TBD_ |
| 🟢 | GET | `/user/category/:id` | — | _TBD_ |
| 🟢 | GET | `/user/product` | query: `category, search, type, page, limit` | _TBD_ |
| 🟢 | GET | `/user/product/:id` | — | _TBD_ |

## Product view
Service: `api.getProduct / getRelatedProducts` · Page: `/sports/:sport/:category/:id`, `/apparels/:category/:id`

| Status | Method | Path | Request | Response (`data`) |
|---|---|---|---|---|
| 🟡 | GET | `/user/products/:id` | — | `ProductDetail` (below) · 404 if unknown |
| 🟡 | GET | `/user/products/:id/related` | `limit` (default 4) | `CatalogProduct[]` — same category, best "featured" first, excluding the product |

`ProductDetail` = every product field above **plus**:
```json
{
  "subtitle": "Obuya Pro · Match Fit · Breathable",
  "badge": "Bestseller",
  "description": "The official Obuya Academy jersey, cut for movement ...",
  "images": ["/a.png", "/b.png", "/c.png", "/d.png"],
  "specifications": [{ "label": "Material", "value": "100% recycled polyester" }],
  "shippingReturns": ["Delivery across Kenya in 2–5 working days ..."],
  "breadcrumb": { "section": "Apparel", "sport": null, "category": { "slug": "jerseys", "name": "Jerseys" } }
}
```
- `badge` optional. `images` may be empty (gallery then shows the icon ring). The page 404s if the URL's sport/category doesn't match `ref`.

## Home
| Status | Method | Path | Request | Response (`data`) |
|---|---|---|---|---|
| 🟡 | GET | `/user/products/featured` | `tab` = `new` \| `best` \| `bundles`, `limit` (home asks for 12) | `CatalogProduct[]` |
| 🟡 | GET | `/user/partners` | — | `Partner[]` = `[{ name: "Obuya Cricket Academy", logo: "/logo.png", url?: "https://..." }]` |

- `new`: newest in-stock product per category, apparel and sports interleaved. `best`: most reviewed. `bundles`: bundle categories.
- Social links ("Follow the Team" bar, footer) and the Foundation link (`FOUNDATION_URL` = https://obuyagrassrootsfoundation.org) are config, not APIs: `_components/shop/links.ts`.

## Cart (🟡 dummy, kept in the browser for now)
Service: `api.getCart / addToCart / updateCartItem / removeFromCart / clearCart / applyAcademyId / removeAcademyId`.
State: `CartProvider` (header badge, slide-in drawer, product page, `/cart`). **Every call returns the whole updated `Cart`.**
Works for guests (no login needed); checkout may require login later.

| Status | Method | Path | Request body | Response (`data`) |
|---|---|---|---|---|
| 🟡 | GET | `/user/cart` | — | `Cart` |
| 🟡 | POST | `/user/cart` | `{ productId, quantity, kind: "self" \| "donation" }` — same product + kind merges | `Cart` · error if unknown / out of stock |
| 🟡 | PUT | `/user/cart/:lineId` | `{ quantity }` (0 removes the line) | `Cart` |
| 🟡 | DELETE | `/user/cart/:lineId` | — | `Cart` |
| 🟡 | DELETE | `/user/cart` | — | `Cart` (empty) |
| 🟡 | PUT | `/user/cart/academy` | `{ academyId }` | `Cart` with `discount` · 400 `{ message }` if not a registered ID |
| 🟡 | DELETE | `/user/cart/academy` | — | `Cart` without discount |

```json
{
  "lines": [
    { "id": "self-apparel-jerseys-1", "kind": "self", "quantity": 1, "lineTotal": 5900,
      "product": { "id": "apparel-jerseys-1", "name": "Home Match Jersey Elite", "subtitle": "Elite · Sublimated",
                   "brand": "Obuya Pro", "price": 5900, "image": "/a.png", "icon": "apparel", "inStock": true,
                   "ref": { "section": "apparel", "category": "jerseys" } } },
    { "id": "donation-apparel-jerseys-1", "kind": "donation", "quantity": 5, "lineTotal": 29500, "product": { "...": "same shape" } }
  ],
  "itemCount": 6,
  "self": { "count": 1, "total": 5900 },
  "donation": { "count": 5, "total": 29500 },
  "discount": { "academyId": "OGA-1234", "percent": 10, "amount": 590 },
  "total": 34810
}
```
- `kind: "donation"` = paid for, given to a young athlete via the Obuya Foundation, **never delivered**.
- `discount` (academy member) applies to **items for you only**; `null` when none. Dummy rule: IDs like `OGA-1234` give 10%.
- `total = self.total − discount.amount + donation.total`. Shipping is calculated at checkout (not in the cart).
- Max 99 per line. Product page "Kit out a squad: x of 11" = this product's donation quantity.

## Wishlist (🟡 dummy, kept in the browser for now)
Service: `api.getWishlist / addToWishlist / removeFromWishlist` · State: `WishlistProvider` · Page `/wishlist` (Sports left, Apparel right; phone toggle)

| Status | Method | Path | Request | Response (`data`) |
|---|---|---|---|---|
| 🟡 | GET | `/user/wishlist` | — | `WishlistItem[]` = `[{ product: CatalogProduct, addedAt: "2026-10-02T10:00:00Z" }]`, newest first |
| 🟡 | POST | `/user/wishlist` | `{ productId }` (no-op if already saved) | `WishlistItem[]` |
| 🟡 | DELETE | `/user/wishlist/:productId` | — | `WishlistItem[]` |

The page splits items by `product.ref.section`.

## Profile & addresses (🟢 real backend) · page `/profile`
| Status | Method | Path | Request | Response (`data`) |
|---|---|---|---|---|
| 🟢 | GET | `/auth/me` | — | signed-in user (see Auth); `picture` = Google photo shown as the avatar |
| 🟢 | PUT | `/user/profile` | `{ name, phone }` | updated user — the page then re-reads `/auth/me` so the header updates |
| 🟢 | DELETE | `/user/profile` | — | ok |
| 🟢 | GET | `/user/address` | — | `Address[]` |
| 🟢 | POST | `/user/address` | `AddressInput` | `Address` |
| 🟢 | PUT | `/user/address/:id` | `Partial<AddressInput>` | `Address` |
| 🟢 | DELETE | `/user/address/:id` | — | ok |
| 🟢 | PUT | `/user/address/:id/default` | — | ok |

`Address` = `{ _id, fullName, phone, addressLine1, addressLine2?, landmark?, city, state, pincode, country, type: "home"|"work"|"other", isDefault }`
(`AddressInput` = same without `_id`, `isDefault`). The form labels `state` as "County / State" and `pincode` as "Postal code"; country defaults to Kenya.

## Orders (🟡 dummy order history until checkout exists) · `/profile` → Orders
| Status | Method | Path | Request | Response (`data`) |
|---|---|---|---|---|
| 🟡 | GET | `/user/order` | — | `Order[]`, newest first |
| 🟡 | PUT | `/user/order/:id/cancel` | `{ reason? }` — only `processing` orders | `Order[]` (updated) · 400 `{ message }` otherwise |
| 🟢 | POST | `/user/order` | (old checkout payload) | — not used by the new UI yet; will be redesigned with checkout |

```json
{
  "id": "ord-3", "number": "OB-24817", "placedAt": "2026-10-01T09:00:00Z",
  "status": "processing",
  "lines": [{ "kind": "self", "quantity": 1, "lineTotal": 1700, "product": { "...": "same as cart line product" } }],
  "self": { "count": 1, "total": 1700 }, "donation": { "count": 2, "total": 3400 },
  "discount": 0, "shipping": 350, "total": 5450,
  "deliverTo": "Home · Ngong Road, Nairobi"
}
```
- `status`: `processing` → `shipped` → `delivered`, or `cancelled`. "Buy again" re-adds the order's items-for-you to the cart.

## Search (🟡 dummy) · navbar search + page `/search?q=`
Service: `api.searchSuggestions / searchProducts` · UI: `_components/search/`

| Status | Method | Path | Request | Response (`data`) |
|---|---|---|---|---|
| 🟡 | GET | `/user/products/search` | `q` (min 3 chars), `limit` (navbar asks for 6) | `SearchSuggestions` = `{ query, products: CatalogProduct[], total }` |
| 🟡 | GET | `/user/products/search` | `q` + listing query params (`brands, minPrice, maxPrice, minRating, inStock, sort, offset, limit`) | `ProductPage` (same as category listings; `facets` computed over all matches) |

- Matching: case-insensitive; every word typed must match the name, brand, category, sport or section ("cricket bat").
- Ranking ("Best match" = `sort=featured` on search): name starts with the query → name contains it → every word is a
  whole word ("bat"/"bats", not "batting") → a name word starts with a term → other matches; in-stock first; ties by `featuredRank`.
- Frontend waits 300ms after typing stops and never searches under 3 characters; stale responses are ignored.

> _TBD_ response shapes are filled in as each page is moved onto dummy data.
