import Icon from '@/components/Icon';

// Gold stars in 0.5 steps: full, half, empty.
export default function StarRating({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex text-obuya-gold" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const full = value >= n;
        const half = !full && value >= n - 0.5;
        return <Icon key={n} name={half ? 'star_half' : 'star'} size={size} filled={full || half} />;
      })}
    </span>
  );
}
