'use client';
import Icon from '@/components/Icon';
import { useWishlist } from './WishlistProvider';

/** Round heart toggle used on product cards and the product gallery. Place it absolutely inside a relative parent. */
export default function WishlistHeart({ productId, name, className = '', size = 'md' }: { productId: string; name: string; className?: string; size?: 'md' | 'lg' }) {
  const { has, toggle } = useWishlist();
  const saved = has(productId);
  const box = size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
  return (
    <button
      type="button"
      onClick={() => toggle(productId, name)}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
      className={`${box} rounded-full flex items-center justify-center shadow-sm transition-[transform,background-color,color] active:scale-90 hover:scale-110 ${
        saved ? 'bg-obuya-maroon text-white' : 'bg-obuya-bg/90 text-obuya-ink hover:text-obuya-maroon'
      } ${className}`}
    >
      <Icon name="favorite" size={size === 'lg' ? 22 : 19} filled={saved} />
    </button>
  );
}
