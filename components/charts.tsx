'use client';

import { useMemo, useRef, useState } from 'react';
import type { MonthBucket } from '@/lib/types';

/** Tiny inline trend line — identity comes from context, so single muted stroke. */
export function Sparkline({
  data,
  width = 96,
  height = 28,
}: {
  data: MonthBucket[];
  width?: number;
  height?: number;
}) {
  const d = useMemo(() => {
    if (data.length < 2) return '';
    const max = Math.max(1, ...data.map((b) => b.count));
    const px = (i: number) => (i / (data.length - 1)) * (width - 4) + 2;
    const py = (v: number) => height - 3 - (v / max) * (height - 6);
    return data.map((b, i) => `${i === 0 ? 'M' : 'L'}${px(i).toFixed(1)},${py(b.count).toFixed(1)}`).join(' ');
  }, [data, width, height]);

  if (!d) return null;
  const last = data[data.length - 1];
  const max = Math.max(1, ...data.map((b) => b.count));
  const cx = width - 2;
  const cy = height - 3 - (last.count / max) * (height - 6);

  return (
    <svg width={width} height={height} className="block" aria-hidden>
      <path d={d} fill="none" stroke="var(--ink-3)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="2.5" fill="var(--brand)" />
    </svg>
  );
}

/** Area chart of message volume by month, with crosshair + tooltip. */
export function ActivityChart({ data }: { data: MonthBucket[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const W = 900;
  const H = 220;
  const PAD = { top: 16, right: 12, bottom: 28, left: 40 };
  const iw = W - PAD.left - PAD.right;
  const ih = H - PAD.top - PAD.bottom;

  const max = Math.max(1, ...data.map((b) => b.count));
  // round the axis top to a friendly number
  const nice = (v: number) => {
    const mag = Math.pow(10, Math.floor(Math.log10(v)));
    return Math.ceil(v / mag) * mag;
  };
  const top = nice(max);

  const px = (i: number) => PAD.left + (data.length > 1 ? (i / (data.length - 1)) * iw : iw / 2);
  const py = (v: number) => PAD.top + ih - (v / top) * ih;

  const line = data.map((b, i) => `${i === 0 ? 'M' : 'L'}${px(i).toFixed(1)},${py(b.count).toFixed(1)}`).join(' ');
  const area = `${line} L${px(data.length - 1).toFixed(1)},${py(0)} L${px(0).toFixed(1)},${py(0)} Z`;

  const gridVals = [top / 2, top];
  // label roughly every ~2-3 months depending on density
  const labelEvery = data.length > 14 ? 3 : data.length > 8 ? 2 : 1;

  const onMove = (e: React.MouseEvent) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((x - PAD.left) / iw) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  };

  const h = hover !== null ? data[hover] : null;

  return (
    <div ref={wrapRef} className="relative" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="Messages per month">
        <defs>
          <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--series-blue)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--series-blue)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* hairline grid + y labels */}
        {gridVals.map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={W - PAD.right} y1={py(v)} y2={py(v)} stroke="var(--grid)" strokeWidth="1" />
            <text x={PAD.left - 8} y={py(v) + 4} textAnchor="end" fontSize="11" fill="var(--ink-3)" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {v}
            </text>
          </g>
        ))}
        {/* baseline */}
        <line x1={PAD.left} x2={W - PAD.right} y1={py(0)} y2={py(0)} stroke="var(--baseline)" strokeWidth="1" />

        <path d={area} fill="url(#area-fill)" />
        <path d={line} fill="none" stroke="var(--series-blue)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* x labels */}
        {data.map((b, i) =>
          i % labelEvery === 0 ? (
            <text key={b.key} x={px(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--ink-3)">
              {b.label}
              {b.label === 'Jan' ? ` ’${b.key.slice(2, 4)}` : ''}
            </text>
          ) : null
        )}

        {/* crosshair */}
        {h && hover !== null && (
          <g>
            <line x1={px(hover)} x2={px(hover)} y1={PAD.top} y2={py(0)} stroke="var(--baseline)" strokeWidth="1" />
            <circle cx={px(hover)} cy={py(h.count)} r="4" fill="var(--series-blue)" stroke="var(--surface)" strokeWidth="2" />
          </g>
        )}
      </svg>

      {h && hover !== null && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 rounded-lg border px-3 py-1.5 text-xs shadow-sm"
          style={{
            left: `${(px(hover) / W) * 100}%`,
            top: 0,
            background: 'var(--surface)',
            borderColor: 'var(--hairline-strong)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <span className="font-medium" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {h.count}
          </span>{' '}
          <span className="text-[var(--ink-3)]">
            msgs · {h.label} {h.key.slice(0, 4)}
          </span>
        </div>
      )}
    </div>
  );
}

/** Compact month bars for the detail panel. */
export function MonthBars({ data }: { data: MonthBucket[] }) {
  const max = Math.max(1, ...data.map((b) => b.count));
  const shown = data.slice(-12);
  return (
    <div className="flex h-16 items-end gap-[3px]">
      {shown.map((b) => (
        <div key={b.key} className="group relative flex-1">
          <div
            className="w-full rounded-t-[3px] transition-colors"
            style={{
              height: `${Math.max(3, (b.count / max) * 56)}px`,
              background: b.count === 0 ? 'var(--grid)' : 'var(--series-blue)',
              opacity: b.count === 0 ? 0.6 : 0.85,
            }}
            title={`${b.label}: ${b.count} messages`}
          />
        </div>
      ))}
    </div>
  );
}
