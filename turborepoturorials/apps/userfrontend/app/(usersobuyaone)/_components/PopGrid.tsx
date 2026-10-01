'use client';
import React, { useLayoutEffect, useRef } from 'react';

const STAGGER_MS = 85;
const MAX_STAGGER_STEPS = 10; // long lists don't make the last cards wait
const DURATION_MS = 650;
const EASING = 'cubic-bezier(0.34, 1.35, 0.64, 1)'; // slight overshoot = "pop"

/**
 * A <ul> whose <li> children pop out one by one from a single point (the centre of the grid)
 * and fly to their own place. Only items not animated before are animated, so when a filtered
 * list changes, new cards pop in while cards already on screen stay put.
 * Items stay hidden (CSS: [data-pop-grid] > li:not([data-popped])) until their animation starts.
 */
export default function PopGrid({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLUListElement>(null);

  // Layout effect: measure and start before the browser paints, so cards never flash in place first.
  useLayoutEffect(() => {
    const grid = ref.current;
    if (!grid) return;
    const items = [...grid.children].filter((el): el is HTMLElement => el instanceof HTMLElement && !el.dataset.popped);
    if (!items.length) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const box = grid.getBoundingClientRect();
    const originX = box.left + box.width / 2;
    const originY = box.top + Math.min(box.height, window.innerHeight - box.top) / 2; // centre of the visible part

    items.forEach((item, i) => {
      item.dataset.popped = 'true';
      if (reduceMotion) return;
      const r = item.getBoundingClientRect();
      const dx = originX - (r.left + r.width / 2);
      const dy = originY - (r.top + r.height / 2);
      item.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) scale(0.15)`, opacity: 0 },
          { opacity: 1, offset: 0.35 },
          { transform: 'none', opacity: 1 },
        ],
        { duration: DURATION_MS, delay: Math.min(i, MAX_STAGGER_STEPS) * STAGGER_MS, easing: EASING, fill: 'backwards' },
      );
    });
  });

  return (
    <ul ref={ref} data-pop-grid className={className}>
      {children}
    </ul>
  );
}
