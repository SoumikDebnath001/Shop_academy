import type { Metadata } from 'next';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { api } from '@/services/api';
import { PageHeader, StorePage } from '../_components/StorePage';
import ProductListing from '../_components/catalog/ProductListing';
import { PAGE_SIZE_DESKTOP } from '../_components/catalog/listingConfig';

type Props = { searchParams: Promise<{ q?: string | string[] }> };

const readQuery = async (searchParams: Props['searchParams']) => {
  const { q } = await searchParams;
  return (Array.isArray(q) ? q[0] : q ?? '').trim().slice(0, 80);
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = await readQuery(searchParams);
  return { title: q ? `Search: ${q}` : 'Search', robots: { index: false } };
}

/** Full search results (Enter in the navbar search): same filters, sort and "Load more" as category listings. */
export default async function SearchPage({ searchParams }: Props) {
  const q = await readQuery(searchParams);
  const crumbs = [{ label: 'Home', href: '/' }, { label: 'Search' }];

  if (q.length < 3) {
    return (
      <StorePage>
        <PageHeader title="Search" crumbs={crumbs} />
        <p className="text-[15px] text-obuya-muted">Type at least 3 characters in the search bar to find products.</p>
      </StorePage>
    );
  }

  const initial = await api.searchProducts(q, { limit: PAGE_SIZE_DESKTOP });

  return (
    <StorePage>
      <PageHeader title={`Results for “${q}”`} crumbs={crumbs} />
      {initial.total === 0 ? (
        <div className="py-16 text-center">
          <Icon name="search_off" size={56} weight={200} className="text-obuya-muted" />
          <p className="mt-3 font-headline-lg text-[22px] font-bold text-obuya-ink">No products match “{q}”</p>
          <p className="mt-1 text-[14px] text-obuya-muted">Check the spelling, or try a sport, a category or a brand.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/sports" className="h-11 px-5 inline-flex items-center rounded-md bg-obuya-gold text-white text-[14px] font-semibold">Browse Sports</Link>
            <Link href="/apparels" className="h-11 px-5 inline-flex items-center rounded-md border border-obuya-line text-obuya-ink text-[14px] font-semibold">Browse Apparel</Link>
          </div>
        </div>
      ) : (
        // key: a new query starts a fresh listing (filters, sort and loaded pages reset)
        <ProductListing key={q} source={{ section: 'search', q }} initial={initial} />
      )}
    </StorePage>
  );
}
