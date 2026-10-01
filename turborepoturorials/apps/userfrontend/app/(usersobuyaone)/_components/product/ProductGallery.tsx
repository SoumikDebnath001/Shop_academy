'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from '@/components/Icon';
import ProductArt from '../catalog/ProductArt';
import { useOverlay } from '../useOverlay';
import WishlistHeart from '../shop/WishlistHeart';

interface Props {
  productId: string;
  name: string;
  images: string[]; // empty -> one slide showing the icon ring
  icon: string;
}

const tileBg = 'bg-linear-to-br from-obuya-card-from to-obuya-card-to';

/**
 * Product gallery from the product view design: thumbnails (left column on desktop, row under the image on phones),
 * main image with "Tap to zoom", swipe between images on touch screens, and a full-screen zoom view.
 */
export default function ProductGallery({ productId, name, images, icon }: Props) {
  const slides = images.length ? images : [undefined];
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const touchX = useRef<number | null>(null);

  const go = useCallback((step: number) => setIndex((i) => (i + step + slides.length) % slides.length), [slides.length]);
  const closeZoom = useCallback(() => setZoomed(false), []);
  useOverlay(zoomed, closeZoom);

  // Arrow keys move between images while zoomed.
  useEffect(() => {
    if (!zoomed || slides.length < 2) return;
    const onKey = (e: KeyboardEvent) => (e.key === 'ArrowRight' ? go(1) : e.key === 'ArrowLeft' ? go(-1) : undefined);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomed, slides.length, go]);

  const swipe = {
    onTouchStart: (e: React.TouchEvent) => (touchX.current = e.touches[0].clientX),
    onTouchEnd: (e: React.TouchEvent) => {
      if (touchX.current === null) return;
      const dx = e.changedTouches[0].clientX - touchX.current;
      if (Math.abs(dx) > 40 && slides.length > 1) go(dx < 0 ? 1 : -1);
      touchX.current = null;
    },
  };

  const thumbs = slides.length > 1 && (
    <ul className="flex lg:flex-col gap-2 sm:gap-3 shrink-0" aria-label="Product images">
      {slides.map((src, i) => (
        <li key={i}>
          <button
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Show image ${i + 1} of ${slides.length}`}
            aria-current={i === index}
            className={`w-14 h-14 sm:w-16 sm:h-16 lg:w-[78px] lg:h-[78px] rounded-md ${tileBg} flex items-center justify-center border-2 transition-colors ${
              i === index ? 'border-obuya-gold' : 'border-transparent opacity-80 hover:opacity-100'
            }`}
          >
            <ProductArt image={src} icon={icon} iconSize={22} sizes="80px" />
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="flex flex-col-reverse lg:flex-row gap-2 sm:gap-3">
      {thumbs}
      <div className={`relative flex-1 aspect-square rounded-md ${tileBg} border border-obuya-line/30 flex items-center justify-center overflow-hidden`} {...swipe}>
        <button type="button" onClick={() => setZoomed(true)} aria-label={`Zoom ${name}`} className="absolute inset-0 flex items-center justify-center cursor-zoom-in">
          <ProductArt key={index} image={slides[index]} icon={icon} iconSize={120} sizes="(min-width: 1024px) 560px, 92vw" priority className="obuya-fade-up w-[64%]!" />
        </button>
        <WishlistHeart productId={productId} name={name} size="lg" className="absolute top-3 right-3" />
        <span className="pointer-events-none absolute bottom-3 right-3 h-9 w-9 sm:w-auto sm:px-3 flex items-center justify-center gap-1.5 rounded-md bg-obuya-bg/90 border border-obuya-line/40 text-[12px] text-obuya-ink shadow-sm">
          <Icon name="zoom_in" size={17} /> <span className="hidden sm:inline">Tap to zoom</span>
        </span>
        {slides.length > 1 && (
          <span className="lg:hidden absolute bottom-3 left-3 text-[12px] text-obuya-muted tabular-nums">{index + 1} / {slides.length}</span>
        )}
      </div>

      {/* Full-screen zoom */}
      {zoomed && (
        <div role="dialog" aria-modal="true" aria-label={`${name}, zoomed`} className="fixed inset-0 z-[80] bg-black/85 flex flex-col" {...swipe}>
          <div className="flex justify-end p-3">
            <button type="button" onClick={closeZoom} aria-label="Close zoom" className="w-11 h-11 flex items-center justify-center rounded-full text-white hover:bg-white/10">
              <Icon name="close" size={28} />
            </button>
          </div>
          <div className="relative flex-1 flex items-center justify-center px-4 pb-8" onClick={closeZoom}>
            <div className="w-full max-w-[min(88vh,900px)] aspect-square flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <ProductArt key={index} image={slides[index]} icon={icon} iconSize={200} sizes="90vw" className="obuya-fade-up w-[92%]!" />
            </div>
            {slides.length > 1 && (
              <>
                <button type="button" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Previous image" className="absolute left-3 md:left-8 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20">
                  <Icon name="chevron_left" size={30} />
                </button>
                <button type="button" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Next image" className="absolute right-3 md:right-8 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20">
                  <Icon name="chevron_right" size={30} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
