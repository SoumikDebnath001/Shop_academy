'use client';
import Icon from '@/components/Icon';
import { useOverlay } from './useOverlay';

interface Props {
  open: boolean;
  icon: string;
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** Centered confirm dialog (sign out, delete account, cancel order). Esc / backdrop closes. */
export default function ConfirmDialog({ open, icon, title, message, confirmLabel, danger, busy, onConfirm, onClose }: Props) {
  useOverlay(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-6">
      <div onClick={onClose} className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" />
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="obuya-fade-up relative w-full max-w-sm rounded-xl bg-obuya-bg border border-obuya-line/40 shadow-2xl p-6 text-center">
        <span className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center ${danger ? 'bg-obuya-maroon text-white' : 'bg-obuya-gold/15 text-obuya-gold'}`}>
          <Icon name={icon} size={28} />
        </span>
        <h3 id="confirm-title" className="mt-4 font-headline-lg text-[22px] font-bold text-obuya-ink">{title}</h3>
        <p className="mt-2 text-[14px] text-obuya-muted">{message}</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button type="button" onClick={onClose} className="h-11 rounded-md border border-obuya-line text-[14px] font-medium text-obuya-ink hover:bg-obuya-ink/5">Cancel</button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`h-11 rounded-md text-[14px] font-semibold text-white disabled:opacity-60 ${danger ? 'bg-obuya-maroon hover:brightness-110' : 'bg-obuya-gold hover:brightness-95'}`}
          >
            {busy ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
