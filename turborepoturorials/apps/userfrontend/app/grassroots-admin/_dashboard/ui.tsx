"use client";
import React, { useEffect, useRef } from 'react';
import Link from 'next/link';

/* Card with a title and an optional "View all" link, used by every dashboard block */
export function Panel({ title, viewAllHref, action, children, className = '' }: {
  title: string; viewAllHref?: string; action?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <section className={`bg-white rounded-2xl border border-outline-variant/50 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col min-w-0 ${className}`}>
      <header className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
        <h2 className="text-[17px] font-semibold text-on-surface">{title}</h2>
        <div className="flex items-center gap-3">
          {action}
          {viewAllHref && (
            <Link href={viewAllHref} className="flex items-center gap-1 text-[13px] font-medium text-primary hover:underline shrink-0">
              View all <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          )}
        </div>
      </header>
      <div className="flex-1 min-w-0">{children}</div>
    </section>
  );
}

/* Colored status pill. Status is always written out, color only helps scanning */
const STATUS_STYLES: Record<string, string> = {
  'New': 'bg-blue-50 text-blue-700 ring-blue-200',
  'Processing': 'bg-amber-50 text-amber-800 ring-amber-200',
  'In Discussion': 'bg-amber-50 text-amber-800 ring-amber-200',
  'In Progress': 'bg-amber-50 text-amber-800 ring-amber-200',
  'Shipped': 'bg-violet-50 text-violet-700 ring-violet-200',
  'Quote Sent': 'bg-violet-50 text-violet-700 ring-violet-200',
  'Delivered': 'bg-green-50 text-green-700 ring-green-200',
  'Accepted': 'bg-green-50 text-green-700 ring-green-200',
  'Resolved': 'bg-green-50 text-green-700 ring-green-200',
  'Open': 'bg-red-50 text-red-700 ring-red-200',
  'Cancelled': 'bg-gray-100 text-gray-600 ring-gray-200',
  'Declined': 'bg-gray-100 text-gray-600 ring-gray-200',
  'Return/Refund': 'bg-orange-50 text-orange-800 ring-orange-200',
  // Payment
  'Paid': 'bg-green-50 text-green-700 ring-green-200',
  'Pending': 'bg-amber-50 text-amber-800 ring-amber-200',
  'Failed': 'bg-red-50 text-red-700 ring-red-200',
  'Refunded': 'bg-gray-100 text-gray-600 ring-gray-200',
  // Product
  'Live': 'bg-green-50 text-green-700 ring-green-200',
  'Pending Approval': 'bg-amber-50 text-amber-800 ring-amber-200',
  'Unpublished': 'bg-gray-100 text-gray-600 ring-gray-200',
  'Rejected': 'bg-red-50 text-red-700 ring-red-200',
  'Changes Requested': 'bg-orange-50 text-orange-800 ring-orange-200',
  // Customer
  'Active': 'bg-green-50 text-green-700 ring-green-200',
  'Inactive': 'bg-red-50 text-red-700 ring-red-200',
  'Disabled': 'bg-gray-100 text-gray-600 ring-gray-200',
  'Individual': 'bg-blue-50 text-blue-700 ring-blue-200',
  'School / Institution': 'bg-violet-50 text-violet-700 ring-violet-200',
  'Foundation Sponsor': 'bg-amber-50 text-amber-800 ring-amber-200',
  'Returned': 'bg-red-50 text-red-700 ring-red-200',
  // Vendor
  'Suspended': 'bg-red-50 text-red-700 ring-red-200',
  // Quotation / organisation
  'Approved': 'bg-green-50 text-green-700 ring-green-200',
  'School': 'bg-amber-50 text-amber-800 ring-amber-200',
  'Club': 'bg-green-50 text-green-700 ring-green-200',
  'Institution': 'bg-red-50 text-red-700 ring-red-200',
  'NGO': 'bg-blue-50 text-blue-700 ring-blue-200',
  // Support
  'Closed': 'bg-gray-100 text-gray-600 ring-gray-200',
  'High': 'bg-red-50 text-red-700 ring-red-200',
  'Medium': 'bg-amber-50 text-amber-800 ring-amber-200',
  'Low': 'bg-green-50 text-green-700 ring-green-200',
  // Order type
  'Normal': 'bg-gray-100 text-gray-700 ring-gray-200',
  'Bulk': 'bg-red-50 text-red-700 ring-red-200',
  'Foundation': 'bg-violet-50 text-violet-700 ring-violet-200',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center h-6 px-2.5 rounded-md text-[12px] font-medium ring-1 ring-inset whitespace-nowrap ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600 ring-gray-200'}`}>
      {status}
    </span>
  );
}

/* Shared table look. Scrolls sideways on small screens instead of squashing columns */
export function DataTable({ columns, children, minWidth = 560 }: { columns: string[]; children: React.ReactNode; minWidth?: number }) {
  return (
    <div className="overflow-x-auto px-5 pb-4">
      <table className="w-full text-left text-[13px]" style={{ minWidth }}>
        <thead>
          <tr className="bg-surface-container-low text-on-surface-variant">
            {columns.map((c, i) => (
              <th key={c} className={`font-semibold px-3 py-2.5 whitespace-nowrap ${i === 0 ? 'rounded-l-lg' : ''} ${i === columns.length - 1 ? 'rounded-r-lg' : ''}`}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/40">{children}</tbody>
      </table>
    </div>
  );
}

export function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return <tr><td colSpan={colSpan} className="px-3 py-8 text-center text-on-surface-variant">{text}</td></tr>;
}

/* Grey placeholder blocks while data loads */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-surface-container-high ${className}`} />;
}

/* Closes popovers when clicking outside them or pressing Escape */
export function useDismiss<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);
  return ref;
}

/* Popup with a list of details and optional status buttons */
export type DetailField = { label: string; value: React.ReactNode };

export function DetailModal<S extends string>({ title, subtitle, fields, status, statusOptions, onStatusChange, busy, onClose }: {
  title: string; subtitle?: string; fields: DetailField[];
  status?: S; statusOptions?: S[]; onStatusChange?: (status: S) => void; busy?: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label={title} className="relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl pb-safe">
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-outline-variant/40">
          <div>
            <h3 className="text-[18px] font-semibold text-on-surface">{title}</h3>
            {subtitle && <p className="text-[13px] text-on-surface-variant mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 -mr-2 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <dl className="px-6 py-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-[14px]">
          {fields.map((f) => (
            <React.Fragment key={f.label}>
              <dt className="text-on-surface-variant">{f.label}</dt>
              <dd className="text-on-surface font-medium min-w-0 break-words">{f.value}</dd>
            </React.Fragment>
          ))}
        </dl>

        {statusOptions && onStatusChange && (
          <div className="px-6 pb-6 pt-2">
            <p className="text-[13px] text-on-surface-variant mb-2">Change status</p>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((s) => (
                <button
                  key={s}
                  disabled={busy || s === status}
                  onClick={() => onStatusChange(s)}
                  className={`h-9 px-3.5 rounded-lg text-[13px] font-medium border transition-colors disabled:cursor-not-allowed ${s === status ? 'bg-brand-green-dark text-white border-brand-green-dark' : 'bg-white text-on-surface border-outline-variant hover:bg-surface-container-low disabled:opacity-50'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* Yes / no popup for actions that change an account (disable, suspend, ...) */
export function ConfirmDialog({ title, text, confirmLabel, danger, busy, onCancel, onConfirm }: {
  title: string; text: string; confirmLabel: string; danger?: boolean; busy: boolean; onCancel: () => void; onConfirm: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);
  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} aria-hidden="true" />
      <div role="alertdialog" aria-modal="true" aria-label={title} className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 pb-safe">
        <h3 className="text-[18px] font-semibold text-on-surface">{title}</h3>
        <p className="text-[14px] text-on-surface-variant mt-2">{text}</p>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onCancel} className="h-11 px-4 rounded-xl text-[14px] font-medium text-on-surface-variant hover:bg-surface-container-low">Cancel</button>
          <button autoFocus onClick={onConfirm} disabled={busy} className={`h-11 px-5 rounded-xl text-white text-[14px] font-medium disabled:opacity-50 ${danger ? 'bg-brand-red' : 'bg-green-700'}`}>{busy ? 'Saving…' : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

/* Popup that asks for a short text before an action, e.g. the reason for suspending or declining */
export function PromptDialog({ title, text, label, placeholder, confirmLabel, danger, busy, required = true, onCancel, onConfirm }: {
  title: string; text?: string; label: string; placeholder?: string; confirmLabel: string; danger?: boolean; busy: boolean;
  required?: boolean; onCancel: () => void; onConfirm: (value: string) => void;
}) {
  const [value, setValue] = React.useState('');
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);
  const ok = !required || value.trim().length > 0;
  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} aria-hidden="true" />
      <form
        role="dialog" aria-modal="true" aria-label={title}
        onSubmit={(e) => { e.preventDefault(); if (ok) onConfirm(value.trim()); }}
        className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 pb-safe"
      >
        <h3 className="text-[18px] font-semibold text-on-surface">{title}</h3>
        {text && <p className="text-[13px] text-on-surface-variant mt-1">{text}</p>}
        <label htmlFor="prompt-value" className="block text-[13px] font-medium text-on-surface mt-4 mb-1.5">{label}</label>
        <textarea
          id="prompt-value" autoFocus rows={4} value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder}
          className="w-full rounded-xl border border-outline-variant p-3 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 resize-none"
        />
        <div className="flex justify-end gap-2 mt-4">
          <button type="button" onClick={onCancel} className="h-11 px-4 rounded-xl text-[14px] font-medium text-on-surface-variant hover:bg-surface-container-low">Cancel</button>
          <button type="submit" disabled={!ok || busy} className={`h-11 px-5 rounded-xl text-white text-[14px] font-medium disabled:opacity-40 ${danger ? 'bg-brand-red' : 'bg-brand-green-dark'}`}>{busy ? 'Saving…' : confirmLabel}</button>
        </div>
      </form>
    </div>
  );
}
