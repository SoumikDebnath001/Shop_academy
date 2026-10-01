"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { DateRange, SnapshotMetric, SnapshotPoint, getSnapshot } from '../../../services/adminDashboard';
import { convertMoney, formatAmount, useCurrencySettings } from '../../../services/currency';
import { Panel, Skeleton } from './ui';
import { compact, niceTicks } from './chartUtils';

const METRICS: { key: SnapshotMetric; label: string; format: (v: number) => string }[] = [
  { key: 'orders', label: 'Orders', format: (v) => v.toLocaleString('en-US') },
  { key: 'revenue', label: 'Revenue', format: (v) => formatAmount(v) }, // values are converted before plotting
  { key: 'quotations', label: 'Quotations', format: (v) => v.toLocaleString('en-US') },
  { key: 'customers', label: 'New customers', format: (v) => v.toLocaleString('en-US') },
];

const shortDate = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

// Long ranges are grouped by week so bars stay readable
const bucket = (points: SnapshotPoint[]) => {
  if (points.length <= 62) return points.map((p) => ({ ...p, label: shortDate(p.date) }));
  const weeks: (SnapshotPoint & { label: string })[] = [];
  for (let i = 0; i < points.length; i += 7) {
    const slice = points.slice(i, i + 7);
    weeks.push({ date: slice[0].date, value: slice.reduce((s, p) => s + p.value, 0), label: `Week of ${shortDate(slice[0].date)}` });
  }
  return weeks;
};

export default function SnapshotChart({ range }: { range: DateRange }) {
  const [metric, setMetric] = useState<SnapshotMetric>('orders');
  const [points, setPoints] = useState<SnapshotPoint[] | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSnapshot(range, metric).then((p) => { if (!cancelled) setPoints(p); }).catch(() => { if (!cancelled) setPoints([]); });
    return () => { cancelled = true; };
  }, [range, metric]);

  const currency = useCurrencySettings();
  // Revenue is plotted in the chosen currency, so the axis gets round numbers in that currency
  const bars = useMemo(
    () => bucket((points ?? []).map((p) => (metric === 'revenue' ? { ...p, value: convertMoney(p.value, currency) } : p))),
    [points, metric, currency],
  );
  const ticks = useMemo(() => niceTicks(Math.max(0, ...bars.map((b) => b.value))), [bars]);
  const top = ticks[ticks.length - 1];
  const fmt = METRICS.find((m) => m.key === metric)!.format;
  const labelEvery = Math.max(1, Math.ceil(bars.length / 5));

  return (
    <Panel
      title="Platform Snapshot"
      action={
        <select
          value={metric}
          onChange={(e) => { setPoints(null); setMetric(e.target.value as SnapshotMetric); }}
          aria-label="Chart metric"
          className="h-9 pl-3 pr-8 rounded-lg border border-outline-variant bg-white text-[13px] text-on-surface"
        >
          {METRICS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
        </select>
      }
    >
      <div className="px-5 pb-5">
        {!points ? <Skeleton className="h-[240px]" /> : bars.length === 0 ? (
          <p className="h-[240px] flex items-center justify-center text-[13px] text-on-surface-variant">No data for this period</p>
        ) : (
          <div className="flex gap-2 h-[240px]">
            {/* Y axis */}
            <div className="relative w-10 shrink-0 mb-6 text-[11px] text-on-surface-variant tabular-nums">
              {ticks.map((t) => (
                <span key={t} className="absolute right-0" style={{ bottom: `${(t / top) * 100}%`, transform: 'translateY(50%)' }}>{compact(t)}</span>
              ))}
            </div>

            <div className="relative flex-1 min-w-0 flex flex-col">
              {/* Plot */}
              <div className="relative flex-1" onMouseLeave={() => setHover(null)}>
                {ticks.map((t) => (
                  <div key={t} className={`absolute inset-x-0 border-t ${t === 0 ? 'border-outline-variant' : 'border-outline-variant/40 border-dashed'}`} style={{ bottom: `${(t / top) * 100}%` }} />
                ))}
                <div className="absolute inset-0 flex items-end gap-[2px]">
                  {bars.map((b, i) => (
                    <button
                      key={b.date}
                      onMouseEnter={() => setHover(i)}
                      onFocus={() => setHover(i)}
                      onBlur={() => setHover(null)}
                      aria-label={`${b.label}: ${fmt(b.value)}`}
                      className="relative flex-1 h-full flex items-end justify-center outline-none"
                    >
                      <span
                        className={`w-full max-w-[14px] rounded-t-[4px] transition-colors ${hover === null || hover === i ? 'bg-primary' : 'bg-primary/35'}`}
                        style={{ height: `${(b.value / top) * 100}%` }}
                      />
                    </button>
                  ))}
                </div>

                {hover !== null && bars[hover] && (
                  <div
                    className="absolute z-10 -translate-x-1/2 pointer-events-none bg-inverse-surface text-inverse-on-surface rounded-lg px-2.5 py-1.5 text-[12px] whitespace-nowrap shadow-lg"
                    style={{
                      left: `${Math.min(88, Math.max(12, ((hover + 0.5) / bars.length) * 100))}%`,
                      bottom: `${(bars[hover].value / top) * 100}%`,
                      marginBottom: 8,
                    }}
                  >
                    <span className="block opacity-75">{bars[hover].label}</span>
                    <span className="block font-semibold">{fmt(bars[hover].value)}</span>
                  </div>
                )}
              </div>

              {/* X axis */}
              <div className="relative h-6 text-[11px] text-on-surface-variant">
                {bars.map((b, i) => (i % labelEvery === 0 || i === bars.length - 1) && (i === bars.length - 1 || bars.length - 1 - i >= labelEvery / 2) ? (
                  <span key={b.date} className="absolute top-1.5 -translate-x-1/2 whitespace-nowrap" style={{ left: `${((i + 0.5) / bars.length) * 100}%` }}>
                    {b.label.replace('Week of ', '')}
                  </span>
                ) : null)}
              </div>
            </div>
          </div>
        )}

        {/* Same numbers as a table for screen readers. sr-only sits on a div because tables ignore its 1px size and would stretch the page */}
        <div className="sr-only">
          <table>
            <caption>{METRICS.find((m) => m.key === metric)!.label} per {bars.length && bars[0].label.startsWith('Week') ? 'week' : 'day'}</caption>
            <tbody>{bars.map((b) => <tr key={b.date}><th>{b.label}</th><td>{fmt(b.value)}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </Panel>
  );
}
