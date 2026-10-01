import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import PopGrid from '../../_components/PopGrid';
import { api } from '@/services/api';
import { PageHeader, StorePage } from '../../_components/StorePage';
import { CategoryTile } from '../../_components/catalog/Tiles';

// One fetch per request, shared by generateMetadata and the page.
const getSport = cache(api.getSport);

type Props = { params: Promise<{ sport: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const sport = await getSport((await params).sport);
  return { title: sport?.name ?? 'Sport not found' };
}

export default async function SportCategoriesPage({ params }: Props) {
  const sport = await getSport((await params).sport);
  if (!sport) notFound();

  return (
    <StorePage>
      <PageHeader
        title={sport.name}
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Sports', href: '/sports' }, { label: sport.name }]}
      />
      <PopGrid className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
        {sport.categories.map((category) => (
          <li key={category.slug}>
            <CategoryTile href={`/sports/${sport.slug}/${category.slug}`} category={category} />
          </li>
        ))}
      </PopGrid>
    </StorePage>
  );
}
