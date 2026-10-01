import type { Metadata } from 'next';
import PopGrid from '../_components/PopGrid';
import { api } from '@/services/api';
import { PageHeader, StorePage } from '../_components/StorePage';
import { ImageTile } from '../_components/catalog/Tiles';

export const metadata: Metadata = { title: 'Sports' };

export default async function SportsPage() {
  const sports = await api.getSports();

  return (
    <StorePage>
      <PageHeader title="Sports" />
      <PopGrid className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
        {sports.map((sport, i) => (
          <li key={sport.slug}>
            <ImageTile href={`/sports/${sport.slug}`} name={sport.name} image={sport.image} priority={i < 3} />
          </li>
        ))}
      </PopGrid>
    </StorePage>
  );
}
