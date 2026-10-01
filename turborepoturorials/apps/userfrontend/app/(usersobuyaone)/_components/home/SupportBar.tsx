import Image from 'next/image';
import Icon from '@/components/Icon';
import { FOUNDATION_DOMAIN, FOUNDATION_URL } from '../shop/links';

/** Maroon "Support Grassroots. Change Lives." bar linking to the Foundation. */
export default function SupportBar() {
  return (
    <section aria-labelledby="support" className="bg-linear-to-r from-[#7a1d2e] via-[#4d1320] to-[#7a1d2e] text-white border-y border-[#f2c037]/30">
      <div className="max-w-[1328px] mx-auto px-margin-mobile md:px-6 py-5 md:py-4 flex flex-col md:flex-row items-center gap-4 md:gap-5 text-center md:text-left">
        <span className="w-12 h-12 shrink-0 rounded-full bg-white ring-2 ring-[#f2c037]/60 flex items-center justify-center">
          <Image src="/logo-shop.png" alt="" width={44} height={44} className="rounded-full" />
        </span>
        <div className="flex-1">
          <h2 id="support" className="font-headline-lg text-[21px] md:text-[24px] font-bold leading-tight">
            Support Grassroots. <span className="text-[#f2c037]">Change Lives.</span>
          </h2>
          <p className="mt-0.5 text-[12px] md:text-[13px] text-white/75">
            Directly support the foundation at <span className="font-semibold text-white">{FOUNDATION_DOMAIN}</span>
          </p>
        </div>
        <a
          href={FOUNDATION_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group h-11 px-6 flex items-center gap-2 rounded-md bg-[#f2c037] text-[#3a1219] text-[14px] font-semibold shadow-[0_8px_20px_-8px_rgba(242,192,55,0.6)] hover:brightness-105 transition"
        >
          Visit Foundation <Icon name="arrow_forward" size={18} className="transition-transform group-hover:translate-x-1" />
        </a>
      </div>
    </section>
  );
}
