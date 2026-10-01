"use client";
import React from 'react';

/* Shared pieces for the big admin list pages (Orders, Products, ...) */

/* Dropdown filter: the first option is the filter's name and means "no filter" */
export function FilterSelect<T extends string>({ label, value, options, onChange }: {
  label: string; value: T | 'All'; options: readonly T[]; onChange: (v: T | 'All') => void;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value as T | 'All')}
      className={`h-11 pl-3.5 pr-9 rounded-xl border bg-white text-[14px] min-w-0 ${value === 'All' ? 'border-outline-variant/70 text-on-surface' : 'border-primary text-primary font-medium'}`}
    >
      <option value="All">{label}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

/* Column header that sorts the table when clicked */
export function SortHeader<K extends string>({ label, sortKey, sort, onSort }: {
  label: string; sortKey: K; sort: { key: K; dir: 'asc' | 'desc' } | undefined; onSort: (k: K) => void;
}) {
  const active = sort?.key === sortKey;
  return (
    <th className="font-semibold px-3 py-3 whitespace-nowrap" aria-sort={active ? (sort!.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button onClick={() => onSort(sortKey)} className={`inline-flex items-center gap-0.5 hover:text-on-surface ${active ? 'text-on-surface' : ''}`}>
        {label}
        <span className={`material-symbols-outlined text-[16px] ${active ? '' : 'opacity-30'}`}>{active && sort!.dir === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>
      </button>
    </th>
  );
}

// Page numbers with "…" gaps, e.g. 1 2 3 4 5 … 53
const pageList = (page: number, pages: number): (number | '…')[] => {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const middle = Array.from({ length: 5 }, (_, i) => start + i);
  return [
    ...(middle[0] > 1 ? [1, ...(middle[0] > 2 ? ['…' as const] : [])] : []),
    ...middle,
    ...(middle[4] < pages ? [...(middle[4] < pages - 1 ? ['…' as const] : []), pages] : []),
  ];
};

/* "Showing 1–10 of 524 orders", page buttons and the per-page dropdown */
export function Pagination({ page, perPage, total, noun, perPageOptions = [10, 25, 50], onPage, onPerPage }: {
  page: number; perPage: number; total: number; noun: string; perPageOptions?: number[];
  onPage: (p: number) => void; onPerPage: (n: number) => void;
}) {
  if (total === 0) return null;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const arrow = (icon: string, to: number, label: string, disabled: boolean) => (
    <button key={label} disabled={disabled} onClick={() => onPage(to)} aria-label={label} className="w-9 h-9 flex items-center justify-center rounded-lg border border-outline-variant/70 bg-white text-on-surface disabled:opacity-40">
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
    </button>
  );

  return (
    <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
      <p className="text-[13px] text-on-surface-variant">
        Showing {((page - 1) * perPage + 1).toLocaleString('en-US')}–{Math.min(page * perPage, total).toLocaleString('en-US')} of {total.toLocaleString('en-US')} {noun}
      </p>
      <nav aria-label="Pages" className="flex items-center gap-1 flex-wrap justify-center">
        {arrow('keyboard_double_arrow_left', 1, 'First page', page <= 1)}
        {arrow('chevron_left', page - 1, 'Previous page', page <= 1)}
        {pageList(page, pages).map((p, i) => p === '…' ? (
          <span key={`gap-${i}`} className="w-9 h-9 flex items-center justify-center text-on-surface-variant">…</span>
        ) : (
          <button key={p} onClick={() => onPage(p)} aria-current={p === page ? 'page' : undefined} className={`min-w-9 h-9 px-2 rounded-lg text-[14px] tabular-nums border ${p === page ? 'bg-brand-green-dark border-brand-green-dark text-white font-semibold' : 'bg-white border-outline-variant/70 text-on-surface hover:bg-surface-container-low'}`}>
            {p}
          </button>
        ))}
        {arrow('chevron_right', page + 1, 'Next page', page >= pages)}
        {arrow('keyboard_double_arrow_right', pages, 'Last page', page >= pages)}
      </nav>
      <select aria-label={`${noun} per page`} value={perPage} onChange={(e) => onPerPage(Number(e.target.value))} className="h-10 pl-3 pr-9 rounded-xl border border-outline-variant/70 bg-white text-[14px]">
        {perPageOptions.map((n) => <option key={n} value={n}>{n} per page</option>)}
      </select>
    </div>
  );
}

/* Details panel on the right: a column beside the list on very wide screens, a slide-over panel below that */
export function SidePanel({ label, onClose, children }: { label: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 2xl:hidden" onClick={onClose} aria-hidden="true" />
      <aside
        aria-label={label}
        className="fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] bg-surface shadow-2xl pt-safe 2xl:sticky 2xl:top-0 2xl:z-auto 2xl:h-screen 2xl:shadow-none 2xl:border-l 2xl:border-outline-variant/50 2xl:shrink-0"
      >
        {children}
      </aside>
    </>
  );
}

// Quotes commas, quotes and line breaks so CSV files open correctly in Excel and Google Sheets
export const csvCell = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map(csvCell).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
