import Link from 'next/link';
import type { CatalogProduct } from '@/services/catalog.types';
import { formatPrice } from '../format';
import { productHref } from '../shop/links';
import ProductArt from './ProductArt';
import StarRating from './StarRating';
import WishlistHeart from '../shop/WishlistHeart';

/** Product tile from the item-listing design; opens the product view. The heart sits outside the link (no button inside <a>). */
export default function ProductCard({ product, animated = true }: { product: CatalogProduct; animated?: boolean }) {
  // Hover (listings, home): the whole card glides up, the art tile deepens its shadow and the art grows a touch.
  // `animated={false}` keeps the product page's "You might also like" cards calm.
  const lift = animated ? 'transition-transform duration-500 ease-obuya hover:-translate-y-1.5' : '';
  const artHover = animated ? 'duration-700 ease-obuya group-hover:scale-[1.07] group-hover:-rotate-2' : 'duration-300 group-hover:scale-[1.04]';
  return (
    <div className={`relative group ${lift}`}>
      <Link
        href={productHref(product.id, product.ref)}
        className="block rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-obuya-gold focus-visible:ring-offset-4 focus-visible:ring-offset-obuya-bg"
      >
        <div className="relative aspect-square rounded-md bg-linear-to-br from-obuya-card-from to-obuya-card-to flex items-center justify-center overflow-hidden transition-shadow duration-500 ease-obuya group-hover:shadow-[0_22px_40px_-16px_rgba(122,29,46,0.38)]">
          <ProductArt
            image={product.image}
            icon={product.icon}
            sizes="(min-width: 1280px) 240px, (min-width: 640px) 30vw, 45vw"
            className={`transition-transform ${artHover}`}
          />
          {!product.inStock && (
            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-obuya-bg/90 text-[11px] font-medium text-obuya-muted">Out of stock</span>
          )}
        </div>
        <p className="mt-3 text-[11px] uppercase tracking-[0.06em] text-obuya-muted">{product.brand}</p>
        <h3 className="mt-0.5 text-[14px] font-medium text-obuya-ink line-clamp-1 group-hover:text-obuya-gold transition-colors duration-500">{product.name}</h3>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-[14px] font-bold text-obuya-gold">{formatPrice(product.price)}</span>
          <span className="flex items-center gap-1 text-[12px] text-obuya-muted">
            <StarRating value={product.rating} size={13} />
            {product.rating.toFixed(1)}
          </span>
        </div>
      </Link>
      <WishlistHeart productId={product.id} name={product.name} className="absolute top-2.5 right-2.5" />
    </div>
  );
}
