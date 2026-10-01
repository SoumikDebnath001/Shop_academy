import Image from 'next/image';
import Icon from '@/components/Icon';
import Link from 'next/link';
import type { SportCategory } from '@/services/catalog.types';

// Shared square tile: blush gradient with a warm glow, lifts and gains a gold border on hover/focus (as in the design).
const tile =
  'obuya-tile group relative flex flex-col aspect-square rounded-md border border-transparent overflow-hidden ' +
  'bg-linear-to-br from-obuya-card-from to-obuya-card-to shadow-[0_1px_3px_rgba(60,20,30,0.06)] ' +
  'transition-[transform,box-shadow,border-color] duration-500 ease-obuya ' +
  'hover:scale-[1.04] hover:z-10 hover:border-obuya-gold/70 hover:shadow-[0_22px_45px_-12px_rgba(122,29,46,0.28)] ' +
  'focus-visible:outline-none focus-visible:scale-[1.04] focus-visible:border-obuya-gold';

const label = 'font-headline-lg text-[19px] md:text-[22px] font-bold leading-tight text-obuya-ink';

/** Tile with round artwork: a sport on /sports, an apparel category on /apparels. */
export function ImageTile({ href, name, image, priority }: { href: string; name: string; image: string; priority?: boolean }) {
  return (
    <Link href={href} className={tile}>
      <div className="flex-1 flex items-center justify-center pt-[10%]">
        <Image
          src={image}
          alt=""
          width={240}
          height={240}
          priority={priority}
          sizes="(min-width: 1024px) 240px, 45vw"
          className="w-[62%] h-auto drop-shadow-[0_14px_22px_rgba(40,10,15,0.28)]"
        />
      </div>
      <span className={`${label} px-4 md:px-5 pb-4 md:pb-6`}>{name}</span>
    </Link>
  );
}

export function CategoryTile({ href, category }: { href: string; category: SportCategory }) {
  return (
    <Link href={href} className={tile}>
      <div className="flex-1 flex items-center justify-center">
        <Icon name={category.icon} size={76} weight={200} className="text-obuya-ink/85 scale-[0.8] md:scale-100" />
      </div>
      <span className={`${label} px-4 md:px-5 pb-4 md:pb-6`}>{category.name}</span>
    </Link>
  );
}
