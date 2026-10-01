'use client';
import Icon from '@/components/Icon';

interface Props {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
  disabled?: boolean;
  label?: string; // accessible name, e.g. "Quantity of Obuya Bat Club"
}

/** − n + stepper from the designs (product page: md, cart lines: sm). */
export default function QuantityStepper({ value, onChange, min = 1, max = 99, size = 'md', disabled, label = 'Quantity' }: Props) {
  const box = size === 'md' ? 'h-12 w-[134px] text-[16px]' : 'h-9 w-[96px] text-[14px]';
  const btn = 'flex-1 h-full flex items-center justify-center text-obuya-ink disabled:text-obuya-muted/50 disabled:cursor-not-allowed hover:text-obuya-gold transition-colors';
  return (
    <div role="group" aria-label={label} className={`flex items-center rounded-md border border-obuya-line/70 bg-obuya-bg/60 ${box}`}>
      <button type="button" aria-label="Decrease" className={btn} disabled={disabled || value <= min} onClick={() => onChange(value - 1)}>
        <Icon name="remove" size={size === 'md' ? 20 : 16} />
      </button>
      <span aria-live="polite" className="min-w-[2ch] text-center font-semibold text-obuya-ink tabular-nums">{value}</span>
      <button type="button" aria-label="Increase" className={btn} disabled={disabled || value >= max} onClick={() => onChange(value + 1)}>
        <Icon name="add" size={size === 'md' ? 20 : 16} />
      </button>
    </div>
  );
}
