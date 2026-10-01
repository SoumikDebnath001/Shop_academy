import Icon from '@/components/Icon';

const ITEMS = [
  { icon: 'local_shipping', title: 'Worldwide Shipping', text: 'From our community to yours' },
  { icon: 'verified_user', title: 'Secure Payments', text: 'Safe. Fast. Reliable.' },
  { icon: 'eco', title: 'Sustainable Choices', text: 'Gear for a better tomorrow' },
  { icon: 'diversity_3', title: 'Support Real Story', text: 'Every purchase gives back' },
];

/** Closing strip of the home page: four promises and "People · Sport · Opportunity". */
export default function TrustStrip() {
  return (
    <section aria-label="Why shop with us" className="max-w-[1328px] mx-auto px-margin-mobile md:px-6 pt-6 md:py-6 pb-[calc(112px+env(safe-area-inset-bottom))] md:pb-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-8">
        <ul className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-5">
          {ITEMS.map((t) => (
            <li key={t.title} className="flex items-start gap-2.5">
              <Icon name={t.icon} size={24} weight={300} className="text-obuya-gold shrink-0" />
              <div>
                <p className="text-[13px] font-semibold text-obuya-ink">{t.title}</p>
                <p className="text-[11px] md:text-[12px] text-obuya-muted">{t.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="lg:pl-8 lg:border-l border-obuya-line/50 text-center text-[11px] md:text-[12px] tracking-[0.35em] uppercase text-obuya-muted">
          People · Sport · Opportunity
        </p>
      </div>
    </section>
  );
}
