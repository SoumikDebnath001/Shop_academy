"use client";
import React, { useMemo, useState } from 'react';
import { compact, niceTicks, useElementWidth } from '../../_dashboard/chartUtils';
import { convertMoney, formatAmount, useCurrencySettings } from '../../../../services/currency';

/* =========================
   CHART COLORS
   Checked with a colorblind-safety validator. Keep the order: neighbours in a chart
   must stay easy to tell apart. Every chart also shows labels, so color is never the only clue.
========================= */
export const SERIES_RED = '#d32a23';
export const SERIES_BLUE = '#2a78d6';

// Pending sits between Processing and Shipped so blue and violet never touch in the donut
export const STATUS_COLORS = {
  Delivered: '#008300', Processing: '#2a78d6', Pending: '#eda100', Shipped: '#4a3aa7', Cancelled: '#e34948',
} as const;
export const STATUS_ORDER = ['Delivered', 'Processing', 'Pending', 'Shipped', 'Cancelled'] as const;

export const CUSTOMER_TYPE_COLORS = {
  'Individuals': '#d32a23', 'Schools / Institutions': '#2a78d6', 'Foundation / Sponsored': '#eda100', 'Others': '#1baf7a',
} as const;

const monthLabel = (month: string) => new Date(`${month}-01T00:00:00`).toLocaleDateString('en-GB', { month: 'short' });
const monthLong = (month: string) => new Date(`${month}-01T00:00:00`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
const pct = (part: number, total: number) => (total ? Math.round((part / total) * 100) : 0);

/* ---------- Small dropdown used in panel headers ---------- */

export function MetricSelect<T extends string | number>({ value, options, onChange, label }: {
  value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string;
}) {
  return (
    <select
      value={String(value)}
      aria-label={label}
      onChange={(e) => onChange(options.find((o) => String(o.value) === e.target.value)!.value)}
      className="h-9 pl-3 pr-8 rounded-lg border border-outline-variant bg-white text-[13px] text-on-surface"
    >
      {options.map((o) => <option key={String(o.value)} value={String(o.value)}>{o.label}</option>)}
    </select>
  );
}

/* ---------- Donut with legend ---------- */

export type DonutSlice = { label: string; count: number; color: string };

export function Donut({ slices, centerCaption }: { slices: DonutSlice[]; centerCaption: string }) {
  const [active, setActive] = useState<number | null>(null);
  const total = slices.reduce((s, x) => s + x.count, 0);
  const size = 168, stroke = 30, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const gap = slices.filter((s) => s.count > 0).length > 1 ? 2 : 0; // 2px of background between segments

  // Each segment starts where all the segments before it end
  const lengths = slices.map((s) => (total ? (s.count / total) * c : 0));
  const arcs = lengths.map((len, i) => ({
    i,
    len: Math.max(0, len - gap),
    offset: lengths.slice(0, i).reduce((sum, l) => sum + l, 0),
  }));

  const shown = active !== null ? slices[active] : null;

  return (
    <div className="h-full flex flex-col sm:flex-row items-center justify-center gap-6 px-5 pb-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" role="img" aria-label={`${centerCaption}: ${slices.map((s) => `${s.label} ${s.count}`).join(', ')}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-surface-container-high)" strokeWidth={stroke} />
          {arcs.map((a) => a.len > 0 && (
            <circle
              key={a.i}
              cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={slices[a.i].color}
              strokeWidth={active === a.i ? stroke + 6 : stroke}
              strokeDasharray={`${a.len} ${c - a.len}`}
              strokeDashoffset={-a.offset}
              opacity={active === null || active === a.i ? 1 : 0.35}
              onMouseEnter={() => setActive(a.i)}
              onMouseLeave={() => setActive(null)}
              className="transition-all duration-200 cursor-pointer"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-[24px] font-bold text-on-surface tabular-nums leading-none">{(shown ? shown.count : total).toLocaleString('en-US')}</span>
          <span className="text-[12px] text-on-surface-variant mt-1 max-w-[96px] leading-tight">{shown ? `${shown.label} · ${pct(shown.count, total)}%` : centerCaption}</span>
        </div>
      </div>

      <ul className="flex-1 w-full space-y-1">
        {slices.map((s, i) => (
          <li
            key={s.label}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            className={`flex items-center gap-2.5 h-8 px-2 rounded-lg text-[13px] transition-colors ${active === i ? 'bg-surface-container-low' : ''}`}
          >
            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="flex-1 text-on-surface truncate">{s.label}</span>
            <span className="text-on-surface-variant tabular-nums whitespace-nowrap">{pct(s.count, total)}% ({s.count.toLocaleString('en-US')})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Ranked list with bars ---------- */

export type RankRow = { id: string; label: string; icon?: React.ReactNode; value: number; display: string };

export function RankBars({ rows, loading }: { rows: RankRow[]; loading?: boolean }) {
  const total = rows.reduce((s, r) => s + r.value, 0);
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className={`px-5 pb-5 space-y-1 transition-opacity ${loading ? 'opacity-50' : ''}`}>
      {rows.map((r) => (
        <li key={r.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_2.75rem] items-center gap-3 h-10" title={`${r.label}: ${r.display}`}>
          <span className="flex items-center gap-2.5 min-w-0">
            {r.icon && <span className="w-7 h-7 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0">{r.icon}</span>}
            <span className="text-[13px] text-on-surface truncate">{r.label}</span>
          </span>
          <span className="flex flex-col gap-1 min-w-0">
            <span className="text-[12px] text-on-surface-variant tabular-nums truncate">{r.display}</span>
            <span className="h-2 rounded-full bg-surface-container-high overflow-hidden">
              <span className="block h-full rounded-full transition-[width] duration-500" style={{ width: `${(r.value / max) * 100}%`, background: SERIES_RED }} />
            </span>
          </span>
          <span className="text-[13px] font-medium text-on-surface tabular-nums text-right">{pct(r.value, total)}%</span>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Shared pieces for the line/bar charts ---------- */

const PAD = { left: 44, right: 12, top: 12, bottom: 24 };

function YAxis({ ticks, top, height, format = compact }: { ticks: number[]; top: number; height: number; format?: (v: number) => string }) {
  return (
    <g>
      {ticks.map((t) => {
        const y = PAD.top + height - (t / top) * height;
        return (
          <g key={t}>
            <line x1={PAD.left} x2="100%" y1={y} y2={y} stroke="var(--color-outline-variant)" strokeOpacity={t === 0 ? 1 : 0.45} strokeDasharray={t === 0 ? undefined : '3 4'} />
            <text x={PAD.left - 8} y={y} textAnchor="end" dominantBaseline="middle" className="fill-on-surface-variant text-[11px] tabular-nums">{format(t)}</text>
          </g>
        );
      })}
    </g>
  );
}

function Tooltip({ x, width, title, lines }: { x: number; width: number; title: string; lines: { color: string; label: string; value: string }[] }) {
  const left = 20 + Math.min(Math.max(x, 90), width - 90); // 20px = the card padding before the chart
  return (
    <div className="absolute top-0 z-10 -translate-x-1/2 pointer-events-none bg-inverse-surface text-inverse-on-surface rounded-lg px-3 py-2 text-[12px] shadow-lg whitespace-nowrap" style={{ left }}>
      <p className="opacity-75 mb-1">{title}</p>
      {lines.map((l) => (
        <p key={l.label} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
          {l.label}: <span className="font-semibold">{l.value}</span>
        </p>
      ))}
    </div>
  );
}

export function Legend({ items }: { items: { color: string; label: string; line?: boolean }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-on-surface-variant">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          {i.line ? <span className="w-4 h-0.5 rounded-full" style={{ background: i.color }} /> : <span className="w-2.5 h-2.5 rounded-sm" style={{ background: i.color }} />}
          {i.label}
        </span>
      ))}
    </div>
  );
}

/* ---------- Revenue bars with an orders line underneath ----------
   Revenue and orders have very different scales, so each gets its own chart
   sharing the same months, instead of two y-axes on one chart. */

export function RevenueOrdersTrend({ points: kesPoints }: { points: { month: string; revenue: number; orders: number }[] }) {
  // Revenue is plotted in the chosen currency so the axis gets round numbers in that currency
  const currency = useCurrencySettings();
  const points = useMemo(() => kesPoints.map((p) => ({ ...p, revenue: convertMoney(p.revenue, currency) })), [kesPoints, currency]);
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const revH = 150, ordH = 64;
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const step = points.length ? plotW / points.length : 0;
  const xAt = (i: number) => PAD.left + step * (i + 0.5);

  const revTicks = useMemo(() => niceTicks(Math.max(0, ...points.map((p) => p.revenue))), [points]);
  const ordTicks = useMemo(() => niceTicks(Math.max(0, ...points.map((p) => p.orders))).filter((_, i, a) => i === 0 || i === a.length - 1), [points]);
  const revTop = revTicks[revTicks.length - 1];
  const ordTop = ordTicks[ordTicks.length - 1];
  const barW = Math.min(28, Math.max(6, step * 0.55));
  const ordY = (v: number) => PAD.top + ordH - (v / ordTop) * ordH;
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${xAt(i)},${ordY(p.orders)}`).join(' ');

  const hoverLayer = (h: number) => points.map((p, i) => (
    <rect key={p.month} x={PAD.left + step * i} y={0} width={step} height={h} fill="transparent"
      onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
  ));

  return (
    <div ref={ref} className="relative px-5 pb-5">
      {width > 0 && (
        <>
          <p className="text-[12px] text-on-surface-variant mb-1">Revenue</p>
          <svg width={width} height={revH + PAD.top + 4} className="block overflow-visible">
            <YAxis ticks={revTicks} top={revTop} height={revH} />
            {points.map((p, i) => {
              const h = (p.revenue / revTop) * revH;
              return (
                <path
                  key={p.month}
                  d={`M${xAt(i) - barW / 2},${PAD.top + revH} v${-Math.max(0, h - 4)} q0,-4 4,-4 h${barW - 8} q4,0 4,4 v${Math.max(0, h - 4)} z`}
                  fill={SERIES_RED}
                  opacity={hover === null || hover === i ? 1 : 0.4}
                  className="transition-opacity"
                />
              );
            })}
            {hoverLayer(revH + PAD.top)}
          </svg>

          <p className="text-[12px] text-on-surface-variant mt-3 mb-1">Orders</p>
          <svg width={width} height={ordH + PAD.top + PAD.bottom} className="block overflow-visible">
            <YAxis ticks={ordTicks} top={ordTop} height={ordH} />
            <path d={line} fill="none" stroke={SERIES_BLUE} strokeWidth={2} strokeLinejoin="round" />
            {points.map((p, i) => (
              <circle key={p.month} cx={xAt(i)} cy={ordY(p.orders)} r={hover === i ? 5 : 4} fill={SERIES_BLUE} stroke="white" strokeWidth={2} />
            ))}
            {points.map((p, i) => (
              <text key={p.month} x={xAt(i)} y={PAD.top + ordH + 18} textAnchor="middle" className="fill-on-surface-variant text-[11px]">{monthLabel(p.month)}</text>
            ))}
            {hoverLayer(ordH + PAD.top + PAD.bottom)}
          </svg>

          {hover !== null && (
            <Tooltip x={xAt(hover)} width={width} title={monthLong(points[hover].month)} lines={[
              { color: SERIES_RED, label: 'Revenue', value: formatAmount(points[hover].revenue) },
              { color: SERIES_BLUE, label: 'Orders', value: points[hover].orders.toLocaleString('en-US') },
            ]} />
          )}
        </>
      )}
      <div className="sr-only">
        <table>
          <caption>Revenue and orders per month</caption>
          <tbody>{points.map((p) => <tr key={p.month}><th>{monthLong(p.month)}</th><td>{formatAmount(p.revenue)}</td><td>{p.orders} orders</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Two lines on one axis (customer growth) ---------- */

export function GrowthLines({ points }: { points: { month: string; newCustomers: number; totalCustomers: number }[] }) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const h = 150;
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const xAt = (i: number) => PAD.left + (points.length > 1 ? (plotW * i) / (points.length - 1) : plotW / 2);
  const ticks = useMemo(() => niceTicks(Math.max(0, ...points.map((p) => Math.max(p.newCustomers, p.totalCustomers)))), [points]);
  const top = ticks[ticks.length - 1];
  const yAt = (v: number) => PAD.top + h - (v / top) * h;

  const path = (key: 'newCustomers' | 'totalCustomers') => points.map((p, i) => `${i ? 'L' : 'M'}${xAt(i)},${yAt(p[key])}`).join(' ');
  const area = points.length ? `${path('newCustomers')} L${xAt(points.length - 1)},${yAt(0)} L${xAt(0)},${yAt(0)} Z` : '';
  const series = [
    { key: 'newCustomers' as const, label: 'New customers', color: SERIES_RED },
    { key: 'totalCustomers' as const, label: 'Total customers', color: SERIES_BLUE },
  ];

  return (
    <div ref={ref} className="relative px-5 pb-5">
      {width > 0 && (
        <svg width={width} height={h + PAD.top + PAD.bottom} className="block overflow-visible" onMouseLeave={() => setHover(null)}>
          <defs>
            <linearGradient id="growth-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERIES_RED} stopOpacity={0.18} />
              <stop offset="100%" stopColor={SERIES_RED} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis ticks={ticks} top={top} height={h} />
          <path d={area} fill="url(#growth-area)" />
          {hover !== null && <line x1={xAt(hover)} x2={xAt(hover)} y1={PAD.top} y2={PAD.top + h} stroke="var(--color-outline)" strokeDasharray="3 3" />}
          {series.map((s) => (
            <g key={s.key}>
              <path d={path(s.key)} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" />
              {points.map((p, i) => <circle key={p.month} cx={xAt(i)} cy={yAt(p[s.key])} r={hover === i ? 5 : 3.5} fill={s.color} stroke="white" strokeWidth={2} />)}
            </g>
          ))}
          {points.map((p, i) => (
            <text key={p.month} x={xAt(i)} y={PAD.top + h + 18} textAnchor="middle" className="fill-on-surface-variant text-[11px]">{monthLabel(p.month)}</text>
          ))}
          {/* Invisible columns that catch the mouse, wider than the dots */}
          {points.map((p, i) => {
            const half = points.length > 1 ? plotW / (points.length - 1) / 2 : plotW / 2;
            return <rect key={p.month} x={xAt(i) - half} y={0} width={half * 2} height={h + PAD.top} fill="transparent" onMouseEnter={() => setHover(i)} />;
          })}
        </svg>
      )}
      {hover !== null && (
        <Tooltip x={xAt(hover)} width={width} title={monthLong(points[hover].month)} lines={series.map((s) => ({ color: s.color, label: s.label, value: points[hover][s.key].toLocaleString('en-US') }))} />
      )}
      <div className="sr-only">
        <table>
          <caption>New and total customers per month</caption>
          <tbody>{points.map((p) => <tr key={p.month}><th>{monthLong(p.month)}</th><td>{p.newCustomers} new</td><td>{p.totalCustomers} total</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- One line with a soft area under it (vendor performance) ---------- */

export function SingleLine({ points, color = SERIES_BLUE, format = (v: number) => v.toLocaleString('en-US'), axisFormat = compact, height = 120, label }: {
  points: { label: string; tick?: string; value: number }[];
  color?: string; format?: (v: number) => string; axisFormat?: (v: number) => string; height?: number; label: string;
}) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { left: 36, right: 8, top: 8, bottom: 22 };
  const plotW = Math.max(0, width - pad.left - pad.right);
  const ticks = useMemo(() => niceTicks(Math.max(0, ...points.map((p) => p.value))), [points]);
  const top = ticks[ticks.length - 1];
  const xAt = (i: number) => pad.left + (points.length > 1 ? (plotW * i) / (points.length - 1) : plotW / 2);
  const yAt = (v: number) => pad.top + height - (v / top) * height;
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${xAt(i)},${yAt(p.value)}`).join(' ');
  const area = points.length ? `${line} L${xAt(points.length - 1)},${yAt(0)} L${xAt(0)},${yAt(0)} Z` : '';
  const gradientId = `single-line-${label.replace(/\W/g, '')}`;

  return (
    <div ref={ref} className="relative" onMouseLeave={() => setHover(null)}>
      {width > 0 && (
        <svg width={width} height={height + pad.top + pad.bottom} className="block overflow-visible" role="img" aria-label={label}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.18} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.left} x2={width - pad.right} y1={yAt(t)} y2={yAt(t)} stroke="var(--color-outline-variant)" strokeOpacity={t === 0 ? 1 : 0.45} strokeDasharray={t === 0 ? undefined : '3 4'} />
              <text x={pad.left - 6} y={yAt(t)} textAnchor="end" dominantBaseline="middle" className="fill-on-surface-variant text-[10px] tabular-nums">{axisFormat(t)}</text>
            </g>
          ))}
          <path d={area} fill={`url(#${gradientId})`} />
          {hover !== null && <line x1={xAt(hover)} x2={xAt(hover)} y1={pad.top} y2={pad.top + height} stroke="var(--color-outline)" strokeDasharray="3 3" />}
          <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
          {points.map((p, i) => <circle key={i} cx={xAt(i)} cy={yAt(p.value)} r={hover === i ? 5 : 3.5} fill={color} stroke="white" strokeWidth={2} />)}
          {points.map((p, i) => p.tick && <text key={`t${i}`} x={xAt(i)} y={pad.top + height + 16} textAnchor="middle" className="fill-on-surface-variant text-[11px]">{p.tick}</text>)}
          {points.map((p, i) => {
            const half = points.length > 1 ? plotW / (points.length - 1) / 2 : plotW / 2;
            return <rect key={`h${i}`} x={xAt(i) - half} y={0} width={half * 2} height={height + pad.top} fill="transparent" onMouseEnter={() => setHover(i)} />;
          })}
        </svg>
      )}
      {hover !== null && points[hover] && (
        <div className="absolute top-0 z-10 -translate-x-1/2 pointer-events-none bg-inverse-surface text-inverse-on-surface rounded-lg px-2.5 py-1.5 text-[12px] shadow-lg whitespace-nowrap" style={{ left: Math.min(Math.max(xAt(hover), 60), width - 60) }}>
          <span className="block opacity-75">{points[hover].label}</span>
          <span className="block font-semibold">{format(points[hover].value)}</span>
        </div>
      )}
      <div className="sr-only">
        <table><caption>{label}</caption><tbody>{points.map((p, i) => <tr key={i}><th>{p.label}</th><td>{format(p.value)}</td></tr>)}</tbody></table>
      </div>
    </div>
  );
}
