import { api } from '@/services/api';
import FeaturedPicks from './_components/home/FeaturedPicks';
import FollowBar from './_components/home/FollowBar';
import Hero from './_components/home/Hero';
import Partners from './_components/home/Partners';
import ShopBySport from './_components/home/ShopBySport';
import SupportBar from './_components/home/SupportBar';
import TrustStrip from './_components/home/TrustStrip';

// Home page from demo/"home section for laptop".png, demo/homeheorsectionphone.png and demo/restpagehome.png.
export default async function HomePage() {
  const [newArrivals, partners] = await Promise.all([api.getFeaturedProducts('new'), api.getPartners()]);
  return (
    <main className="obuya-page flex-1 min-h-screen bg-obuya-bg text-obuya-ink">
      <Hero />
      <FollowBar />
      <ShopBySport />
      <FeaturedPicks initial={newArrivals} />
      <Partners partners={partners} />
      <SupportBar />
      <TrustStrip />
    </main>
  );
}
