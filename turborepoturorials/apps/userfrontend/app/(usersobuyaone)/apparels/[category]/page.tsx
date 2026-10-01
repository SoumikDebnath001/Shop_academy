import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { api } from '@/services/api';
import { PageHeader, StorePage } from '../../_components/StorePage';
import ProductListing from '../../_components/catalog/ProductListing';
import { PAGE_SIZE_DESKTOP } from '../../_components/catalog/listingConfig';

// One fetch per request, shared by generateMetadata and the page.
const getFirstPage = cache((category: string) => api.getApparelCategoryProducts(category, { limit: PAGE_SIZE_DESKTOP }));

type Props = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getFirstPage((await params).category);
  return { title: data ? `${data.category.name} · Apparel` : 'Category not found' };
}

export default async function ApparelCategoryPage({ params }: Props) {
  const { category } = await params;
  const data = await getFirstPage(category);
  if (!data) notFound();

  return (
    <StorePage>
      <PageHeader
        title={data.category.name}
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Apparel', href: '/apparels' }, { label: data.category.name }]}
      />
      <ProductListing source={{ section: 'apparel', category }} initial={data} />
    </StorePage>
  );
}
