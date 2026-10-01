'use client';
import Icon from '@/components/Icon';
import { useToast } from '@/components/ToastProvider';
import SocialIcons from '../SocialIcons';
import { SOCIAL_LINKS } from '../shop/links';

/** Maroon "Follow the Team Obuya Cricket Academy" bar under the hero. */
export default function FollowBar() {
  const { triggerToast } = useToast();
  const primary = SOCIAL_LINKS.find((s) => s.url);
  const followNow = () => (primary ? window.open(primary.url, '_blank', 'noopener') : triggerToast('Our social pages are coming soon'));

  return (
    <section aria-label="Follow the team" className="bg-linear-to-r from-[#4d1320] via-[#7a1d2e] to-[#7a1d2e] text-white">
      <div className="max-w-[1328px] mx-auto px-margin-mobile md:px-6 py-4 md:h-[56px] flex flex-col md:flex-row md:items-center md:justify-center gap-3 md:gap-6">
        <p className="flex items-center gap-2.5 text-[15px] md:text-[16px] font-medium">
          <Icon name="groups" size={22} /> Follow the Team Obuya Cricket Academy
        </p>
        <span aria-hidden className="hidden md:block w-px h-6 bg-white/25" />
        <p className="text-[12px] md:text-[13px] text-white/70">Match updates. Player stories. Training. Community Story.</p>
        <div className="flex items-center justify-between md:justify-start gap-6 md:ml-auto">
          <button type="button" onClick={followNow} className="flex items-center gap-2 text-[13px] md:text-[14px] font-semibold hover:text-[#f2c037] transition-colors">
            Follow Now <Icon name="arrow_forward" size={18} />
          </button>
          <span aria-hidden className="hidden md:block w-px h-6 bg-white/25" />
          <SocialIcons className="text-white" cutout="#7a1d2e" />
        </div>
      </div>
    </section>
  );
}
