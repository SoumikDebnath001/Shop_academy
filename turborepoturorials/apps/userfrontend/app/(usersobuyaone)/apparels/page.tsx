import type { Metadata } from 'next';
import PopGrid from '../_components/PopGrid';
import { api } from '@/services/api';
import { PageHeader, StorePage } from '../_components/StorePage';
import { ImageTile } from '../_components/catalog/Tiles';

export const metadata: Metadata = { title: 'Apparel' };

export default async function ApparelPage() {
  const categories = await api.getApparelCategories();

  return (
    <StorePage>
      <PageHeader title="Apparel" />
      <PopGrid className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
        {categories.map((category, i) => (
          <li key={category.slug}>
            <ImageTile href={`/apparels/${category.slug}`} name={category.name} image={category.image} priority={i < 4} />
          </li>
        ))}
      </PopGrid>
    </StorePage>
  );
}
