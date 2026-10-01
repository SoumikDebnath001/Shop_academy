import Link from 'next/link';
import Icon from '@/components/Icon';
import type { CatalogProduct, ProductDetail } from '@/services/catalog.types';
import { formatPrice } from '../format';
import { Breadcrumbs, StorePage, type Crumb } from '../StorePage';
import ProductCard from '../catalog/ProductCard';
import StarRating from '../catalog/StarRating';
import { categoryHref } from '../shop/links';
import ProductGallery from './ProductGallery';
import ProductTabs from './ProductTabs';
import PurchasePanel from './PurchasePanel';

const FEATURES = [
  { icon: 'diamond', label: 'Premium Quality' },
  { icon: 'verified_user', label: 'Game Ready' },
  { icon: 'diversity_3', label: 'Supports Grassroots' },
];

const firstSentences = (text: string, n: number) => text.split(/(?<=\.)\s+/).slice(0, n).join(' ');

/** Product view page from the product view designs (1 & 2). Shared by Sports and Apparel products. */
export default function ProductView({ product, related }: { product: ProductDetail; related: CatalogProduct[] }) {
  const { breadcrumb: bc } = product;
  const crumbs: Crumb[] =
    product.ref.section === 'sports'
      ? [
          { label: 'Home', href: '/' },
          { label: 'Sports', href: '/sports' },
          ...(bc.sport ? [{ label: bc.sport.name, href: `/sports/${bc.sport.slug}` }] : []),
          { label: bc.category.name, href: categoryHref(product.ref) },
          { label: product.name },
        ]
      : [
          { label: 'Home', href: '/' },
          { label: 'Apparel', href: '/apparels' },
          { label: bc.category.name, href: categoryHref(product.ref) },
          { label: product.name },
        ];

  return (
    <StorePage>
      <Breadcrumbs crumbs={crumbs} className="mb-3 md:mb-5" />

      <div className="grid lg:grid-cols-2 gap-5 md:gap-8 lg:gap-12 items-start">
        <ProductGallery productId={product.id} name={product.name} images={product.images} icon={product.icon} />

        <div>
          {product.badge && (
            <span className="inline-block px-2.5 py-1 rounded-md bg-obuya-maroon/15 text-obuya-maroon text-[12px] font-semibold">{product.badge}</span>
          )}
          <h1 className="mt-2 md:mt-3 font-headline-lg text-[25px] md:text-[38px] font-bold leading-tight text-obuya-ink">{product.name}</h1>
          <span aria-hidden className="block mt-3 h-[3px] w-[46px] rounded-full bg-linear-to-r from-obuya-maroon to-obuya-gold" />
          <p className="mt-3 md:mt-4 text-[13px] md:text-[15px] text-obuya-muted">{product.subtitle}</p>
          <p className="mt-2 flex items-center gap-2 text-[13px] text-obuya-muted">
            <StarRating value={product.rating} size={17} />
            <span className="font-semibold text-obuya-ink">{product.rating.toFixed(1)}</span>({product.reviewCount} reviews)
          </p>
          <p className="mt-3 md:mt-5 text-[24px] md:text-[28px] font-bold text-obuya-gold tabular-nums">{formatPrice(product.price)}</p>
          <p className={`mt-2 flex items-center gap-2 text-[14px] ${product.inStock ? 'text-obuya-avatar' : 'text-obuya-maroon'}`}>
            <span className={`w-2 h-2 rounded-full ${product.inStock ? 'bg-obuya-avatar' : 'bg-obuya-maroon'}`} />
            {product.inStock ? 'In Stock' : 'Out of Stock'}
          </p>
          <p className="mt-3 md:mt-5 text-[13px] md:text-[14px] leading-relaxed text-obuya-muted">{firstSentences(product.description, 2)}</p>

          <ul className="mt-5 md:mt-6 grid grid-cols-3 sm:flex sm:flex-wrap gap-2 sm:gap-x-8 sm:gap-y-3">
            {FEATURES.map((f) => (
              <li key={f.label} className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2 rounded-md sm:rounded-none bg-obuya-panel sm:bg-transparent py-2.5 sm:py-0 text-center sm:text-left text-[11px] sm:text-[13px] leading-tight text-obuya-muted">
                <Icon name={f.icon} size={24} weight={300} className="text-obuya-gold" />
                <span className="max-w-[80px]">{f.label}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 md:mt-8">
            <ProductTabs product={product} />
          </div>
        </div>
      </div>

      <PurchasePanel product={product} />

      {related.length > 0 && (
        <section aria-labelledby="related" className="mt-10 md:mt-16 grid lg:grid-cols-[1fr_370px] gap-6 lg:gap-8">
          <div>
            <div className="flex items-end justify-between mb-5">
              <div>
                <h2 id="related" className="font-headline-lg text-[24px] md:text-[28px] font-bold text-obuya-ink">You might also like</h2>
                <span aria-hidden className="block mt-3 h-[3px] w-[46px] rounded-full bg-linear-to-r from-obuya-maroon to-obuya-gold" />
              </div>
              <Link href={categoryHref(product.ref)} className="flex items-center gap-1 text-[13px] text-obuya-ink hover:text-obuya-gold transition-colors">
                View more <Icon name="arrow_forward" size={17} />
              </Link>
            </div>
            <ul className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {related.map((p) => (
                <li key={p.id}><ProductCard product={p} animated={false} /></li>
              ))}
            </ul>
          </div>
          <div className="relative overflow-hidden rounded-md bg-linear-to-br from-[#7a1d2e] to-[#3d0f19] p-6 md:p-10 flex flex-col justify-center min-h-[180px] md:min-h-[240px]">
            <p className="font-headline-lg italic text-[28px] md:text-[40px] leading-[1.15] text-white">
              People.<br />Sport.<br />Opportunity.
            </p>
            <span aria-hidden className="block mt-5 h-[3px] w-[60px] rounded-full bg-[#f2c037]" />
            <p className="mt-5 text-[13px] text-white/70 max-w-[260px]">Every order helps put kit on young athletes across Kenya.</p>
          </div>
        </section>
      )}
    </StorePage>
  );
}
