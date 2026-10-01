import Image from 'next/image';
import Link from 'next/link';
import Icon from '@/components/Icon';
import OurStoryButton from './OurStoryButton';

/** Glowing, pulsing handwritten tagline with a maroon underline that draws itself in. */
function Tagline({ className = '' }: { className?: string }) {
  return (
    <p className={`relative text-center ${className}`}>
      <span className="obuya-glow-pulse font-script font-bold text-obuya-gold leading-none">Made for the game. Made to go further.</span>
      <svg aria-hidden viewBox="0 0 200 12" className="block mx-auto mt-1 w-[34%] h-3 text-obuya-maroon">
        <path className="obuya-draw" d="M3 8 C 60 2, 140 2, 197 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </p>
  );
}

/** Home hero from the laptop + phone designs. Phone: tagline, players, then copy. Laptop: copy left, players right. */
export default function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      {/* warm glow behind the players */}
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_55%_70%_at_75%_45%,rgb(242_192_55/0.14),transparent_70%),radial-gradient(ellipse_50%_60%_at_85%_30%,rgb(200_110_125/0.14),transparent_70%)]" />
      <div className="relative max-w-[1328px] mx-auto px-margin-mobile md:px-6 pt-[84px] md:pt-[70px] grid md:grid-cols-[1fr_1.05fr] md:items-end">
        {/* players + tagline (first on phones) */}
        <div className="md:order-2 flex flex-col items-center md:pt-10">
          <Tagline className="text-[22px] sm:text-[28px] md:text-[34px] lg:text-[38px] mt-3 md:mt-0 mb-2 md:mb-4 w-full" />
          <Image
            src="/userspace/banner-removebg-preview.png"
            alt="Three Obuya Cricket Academy players in the academy kit"
            width={666}
            height={375}
            priority
            sizes="(min-width: 768px) 600px, 100vw"
            className="w-full max-w-[600px] h-auto [mask-image:linear-gradient(to_bottom,black_80%,transparent)] md:[mask-image:none]"
          />
        </div>

        {/* copy */}
        <div className="md:order-1 pt-5 pb-8 md:pt-0 md:pb-24">
          <p className="text-[12px] md:text-[13px] font-semibold tracking-[0.3em] uppercase text-obuya-muted">Every order gives back</p>
          <h1 id="hero-title" className="mt-3 font-headline-lg font-bold leading-[1.05] text-[clamp(32px,9.6vw,42px)] sm:text-[52px] lg:text-[64px]">
            <span className="block text-obuya-ink">Equip Today</span>
            <span className="block text-obuya-gold">Shape Tomorrow</span>
          </h1>
          <p className="hidden md:block mt-5 text-[16px] text-obuya-muted">Every purchase helps create opportunities for young athletes.</p>
          <div className="mt-6 md:mt-7 grid grid-cols-2 sm:flex gap-3">
            <Link href="/sports" className="h-12 px-6 flex items-center justify-center gap-2 rounded-md bg-obuya-gold text-white text-[15px] font-semibold shadow-[0_8px_20px_-8px_rgba(184,137,31,0.7)] hover:brightness-95 transition">
              Shop Now <Icon name="arrow_forward" size={20} />
            </Link>
            <OurStoryButton />
          </div>
          <p className="md:hidden mt-5 text-[15px] text-obuya-muted">Every purchase helps create opportunities for young athletes.</p>
        </div>
      </div>
    </section>
  );
}
