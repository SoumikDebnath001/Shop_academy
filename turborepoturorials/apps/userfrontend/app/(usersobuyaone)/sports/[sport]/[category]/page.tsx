import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { api } from '@/services/api';
import { PageHeader, StorePage } from '../../../_components/StorePage';
import ProductListing from '../../../_components/catalog/ProductListing';
import { PAGE_SIZE_DESKTOP } from '../../../_components/catalog/listingConfig';

// One fetch per request, shared by generateMetadata and the page.
const getCategoryProducts = cache((sport: string, category: string) =>
  api.getSportCategoryProducts(sport, category, { limit: PAGE_SIZE_DESKTOP }),
);

type Props = { params: Promise<{ sport: string; category: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sport, category } = await params;
  const data = await getCategoryProducts(sport, category);
  return { title: data ? `${data.category.name} · ${data.sport.name}` : 'Category not found' };
}

export default async function CategoryProductsPage({ params }: Props) {
  const { sport, category } = await params;
  const data = await getCategoryProducts(sport, category);
  if (!data) notFound();

  return (
    <StorePage>
      <PageHeader
        title={data.category.name}
        crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Sports', href: '/sports' },
          { label: data.sport.name, href: `/sports/${data.sport.slug}` },
          { label: data.category.name },
        ]}
      />
      <ProductListing source={{ section: 'sports', sport, category }} initial={data} />
    </StorePage>
  );
}
