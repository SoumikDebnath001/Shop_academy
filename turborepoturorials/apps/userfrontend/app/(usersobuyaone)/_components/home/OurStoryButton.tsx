'use client';
import { useToast } from '@/components/ToastProvider';

// "Our Story" has no page yet; say so instead of linking nowhere.
export default function OurStoryButton() {
  const { triggerToast } = useToast();
  return (
    <button
      type="button"
      onClick={() => triggerToast('Our story page is coming soon')}
      className="h-12 px-6 flex items-center justify-center rounded-md border border-obuya-line bg-obuya-bg/40 text-[15px] font-medium text-obuya-ink hover:border-obuya-gold transition-colors"
    >
      Our Story
    </button>
  );
}
