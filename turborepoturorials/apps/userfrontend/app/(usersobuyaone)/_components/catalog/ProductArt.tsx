import Image from 'next/image';
import Icon from '@/components/Icon';

interface Props {
  image?: string;
  icon: string;
  iconSize?: number;
  sizes?: string; // next/image sizes hint
  priority?: boolean;
  className?: string; // e.g. hover scale from a parent group
}

/**
 * Product artwork. Real artwork already includes the gold/maroon ring (public/userspace/*), so it is shown as-is;
 * without artwork the same ring is drawn around the category icon. Fills its (square, centred) parent.
 */
export default function ProductArt({ image, icon, iconSize = 56, sizes = '240px', priority, className = '' }: Props) {
  if (image) {
    return (
      <Image
        src={image}
        alt=""
        width={480}
        height={480}
        sizes={sizes}
        priority={priority}
        className={`w-[78%] h-auto drop-shadow-[0_10px_18px_rgba(40,10,15,0.18)] ${className}`}
      />
    );
  }
  return (
    <div className={`w-[60%] aspect-square rounded-full p-[3px] bg-[conic-gradient(from_200deg,var(--color-obuya-gold),var(--color-obuya-maroon),var(--color-obuya-gold),var(--color-obuya-maroon),var(--color-obuya-gold))] shadow-[0_12px_24px_-8px_rgba(40,10,15,0.35)] ${className}`}>
      <div className="w-full h-full rounded-full bg-[radial-gradient(circle_at_50%_35%,#3a2a2d,#141012)] flex items-center justify-center">
        <Icon name={icon} size={iconSize} weight={300} className="text-[#e0b04a]" />
      </div>
    </div>
  );
}

/** Square blush tile holding ProductArt, used for thumbnails (cart lines, wishlist, gallery thumbs). */
export function ArtTile({ image, icon, iconSize = 28, className = '' }: { image?: string; icon: string; iconSize?: number; className?: string }) {
  return (
    <div className={`aspect-square rounded-md bg-linear-to-br from-obuya-card-from to-obuya-card-to flex items-center justify-center overflow-hidden ${className}`}>
      <ProductArt image={image} icon={icon} iconSize={iconSize} sizes="120px" />
    </div>
  );
}
