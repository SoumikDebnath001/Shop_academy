import Link from 'next/link';
import SocialIcons from './SocialIcons';

const LINKS = [
  { label: 'People', href: '/' },
  { label: 'Sport', href: '/sports' },
  { label: 'Opportunity', href: '/apparels' },
];

/** Footer from demo/footer_for_every page except home.png. Same dark bar in both themes. */
export default function Footer() {
  return (
    <footer className="bg-[#141012] text-white/90 pb-[calc(104px+env(safe-area-inset-bottom))] md:pb-0">
      <div className="max-w-[1328px] mx-auto px-margin-mobile md:px-6 py-7 md:py-5 flex flex-col md:flex-row items-center gap-6 md:gap-10">
        <Link href="/" className="text-center md:text-left leading-none">
          <span className="block font-headline-lg text-[26px] font-bold text-white">Obuya</span>
          <span className="block mt-1 text-[9px] tracking-[0.2em] uppercase text-white/70">Foundation Shop</span>
        </Link>
        <nav aria-label="Footer" className="flex gap-8 text-[13px]">
          {LINKS.map((l) => (
            <Link key={l.label} href={l.href} className="text-white/85 hover:text-[#f2c037] transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>
        <SocialIcons className="md:mx-auto text-white" size={20} cutout="#141012" />
        <p className="relative font-signature text-[30px] text-white -rotate-6 md:ml-auto pr-2">
          More Than a Game
          <svg aria-hidden viewBox="0 0 120 10" className="absolute -bottom-1 right-6 w-24 h-2.5 text-[#c8262e]">
            <path d="M2 7 C 40 2, 80 2, 118 5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </p>
      </div>
    </footer>
  );
}
