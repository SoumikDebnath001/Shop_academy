import Link from 'next/link';
import Icon from '@/components/Icon';

const CARDS = [
  { name: 'Cricket', tagline: 'Gear for greater grounds.', icon: 'sports_cricket', href: '/sports/cricket' },
  { name: 'Football', tagline: 'Play. Unite. Create change.', icon: 'sports_soccer', href: '/sports/football' },
  { name: 'Rugby', tagline: 'Stronger together.', icon: 'sports_rugby', href: '/sports/rugby' },
  { name: 'Apparel', tagline: 'More than merchandise.', icon: 'apparel', href: '/apparels' },
];

export function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 id={id} className="font-headline-lg text-[24px] md:text-[28px] font-bold text-obuya-ink">{children}</h2>
      <span aria-hidden className="block mt-2 h-[3px] w-[46px] rounded-full bg-linear-to-r from-obuya-maroon to-obuya-gold" />
    </div>
  );
}

/**
 * "Shop by Sport" cards. Hover: card lifts with a gold edge, the big watermark icon swings in and brightens,
 * and the gold arrow slides right and turns maroon.
 */
export default function ShopBySport() {
  return (
    <section aria-labelledby="shop-by-sport" className="max-w-[1328px] mx-auto px-margin-mobile md:px-6 pt-10 md:pt-12">
      <div className="flex items-end justify-between mb-5 md:mb-6">
        <SectionTitle id="shop-by-sport">Shop by Sport</SectionTitle>
        <Link href="/sports" className="flex items-center gap-1 text-[13px] text-obuya-ink hover:text-obuya-gold transition-colors">
          View All <Icon name="arrow_forward" size={18} />
        </Link>
      </div>
      <ul className="obuya-tint-grid grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {CARDS.map((c) => (
          <li key={c.name}>
            <Link
              href={c.href}
              className="obuya-tile group relative block h-[128px] md:h-[140px] overflow-hidden rounded-md border border-obuya-line/30 bg-linear-to-br from-obuya-bg to-obuya-card-to p-4 md:p-6 shadow-[0_1px_3px_rgba(60,20,30,0.06)] transition-[transform,box-shadow,border-color] duration-500 ease-obuya hover:-translate-y-1.5 hover:border-obuya-gold/70 hover:shadow-[0_20px_40px_-16px_rgba(122,29,46,0.35)] focus-visible:outline-none focus-visible:border-obuya-gold"
            >
              <Icon
                name={c.icon}
                size={130}
                weight={300}
                filled
                className="absolute -right-5 top-1/2 -translate-y-1/2 text-obuya-ink/[0.07] transition-[transform,color] duration-700 ease-obuya group-hover:-rotate-12 group-hover:scale-110 group-hover:text-obuya-gold/20"
              />
              <span className="relative block font-headline-lg text-[20px] md:text-[24px] font-bold text-obuya-ink">{c.name}</span>
              <span className="relative block mt-1 max-w-[120px] text-[12px] md:text-[13px] leading-snug text-obuya-muted">{c.tagline}</span>
              <span className="absolute left-4 md:left-6 bottom-3.5 md:bottom-4 w-7 h-7 rounded-full bg-obuya-gold text-[#3a1219] flex items-center justify-center transition-[transform,background-color,color] duration-500 ease-obuya group-hover:translate-x-2 group-hover:bg-obuya-maroon group-hover:text-white">
                <Icon name="arrow_forward" size={18} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
