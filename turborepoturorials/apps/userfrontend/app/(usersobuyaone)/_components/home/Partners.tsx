import Image from 'next/image';
import type { Partner } from '@/services/catalog.types';

/** "Sponsors & Partners" from demo/restpagehome.png: heading card, then partner logos with names. */
export default function Partners({ partners }: { partners: Partner[] }) {
  if (!partners.length) return null;
  return (
    <section aria-labelledby="partners" className="max-w-[1328px] mx-auto px-margin-mobile md:px-6 pt-16 md:pt-24 pb-12 md:pb-20">
      <div className="mx-auto max-w-[500px] rounded-lg bg-obuya-panel/80 border border-obuya-line/25 px-6 py-7 md:py-9 text-center shadow-[0_10px_30px_-20px_rgba(60,20,30,0.25)]">
        <p className="text-[12px] font-semibold tracking-[0.08em] uppercase text-obuya-gold">Our Partners</p>
        <h2 id="partners" className="mt-2 font-headline-lg text-[28px] md:text-[36px] font-bold text-obuya-ink">Sponsors &amp; Partners</h2>
        <p className="mt-3 text-[14px] md:text-[15px] leading-relaxed text-obuya-muted">
          Proud to be supported by organisations that share our vision of community transformation.
        </p>
      </div>
      <ul className="mt-8 md:mt-12 flex flex-wrap justify-center gap-x-16 gap-y-8">
        {partners.map((p) => {
          const body = (
            <>
              <Image src={p.logo} alt="" width={144} height={144} className="w-24 h-24 md:w-36 md:h-36 rounded-full object-contain transition-transform duration-500 group-hover:rotate-[8deg] group-hover:scale-105" />
              <span className="text-[20px] md:text-[26px] font-semibold text-obuya-ink">{p.name}</span>
            </>
          );
          const cls = 'group flex flex-col sm:flex-row items-center gap-4 sm:gap-14 text-center sm:text-left';
          return (
            <li key={p.name}>
              {p.url ? (
                <a href={p.url} target="_blank" rel="noopener noreferrer" className={cls}>{body}</a>
              ) : (
                <div className={cls}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
