import React, { useLayoutEffect, useRef, useState } from 'react';
import { AgingBucket, RankRow, SeriesBucket, inr, inrCompact } from '../../utils/dashboard';

// Hand-rolled SVG charts (no chart library — keeps the bundle small and the
// look on-brand). Palette validated for CVD separation + 3:1 contrast on white:
//   sales    #6d45f9 (brand-600)   received #059669 (emerald-600)
// Aging uses the reserved status steps, always paired with a text label.
export const SERIES = { sales: '#6d45f9', received: '#059669' };
export const AGING_COLORS: Record<AgingBucket['key'], string> = {
  not_due: '#94a3b8',
  d30: '#fab219',
  d60: '#ec835a',
  d60p: '#d03b3b',
};
const GRID = '#e7e7ee';
const AXIS_TEXT = '#a0a0ae';

const useWidth = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
};

// 0 / 5K / 10K … — a "nice" ceiling so y ticks land on round numbers.
const niceMax = (v: number) => {
  if (v <= 0) return 100;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step * pow;
};

// Column with a 4px rounded data-end and a square baseline.
const columnPath = (x: number, y: number, w: number, h: number) => {
  if (h <= 0) return '';
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
};

const Tooltip: React.FC<{ x: number; y: number; containerW: number; children: React.ReactNode }> = ({ x, y, containerW, children }) => (
  <div
    className="pointer-events-none absolute z-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg whitespace-nowrap"
    style={{ left: Math.min(Math.max(8, x), containerW - 8), top: y, transform: `translate(${x > containerW / 2 ? '-100%' : '0'}, -100%) translate(${x > containerW / 2 ? '-10px' : '10px'}, -6px)` }}
  >
    {children}
  </div>
);

const Swatch: React.FC<{ color: string; line?: boolean }> = ({ color, line }) => (
  <span className={`inline-block shrink-0 ${line ? 'w-3 h-0.5' : 'w-2.5 h-2.5 rounded-sm'}`} style={{ background: color }} />
);

// ---------------------------------------------------------------------------
// Sparkline for stat tiles (single series, current point emphasised).
// ---------------------------------------------------------------------------
export const Sparkline: React.FC<{ values: number[]; color: string }> = ({ values, color }) => {
  const [ref, w] = useWidth<HTMLDivElement>();
  const h = 28;
  if (values.length < 2) return <div ref={ref} className="h-7" />;
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * (w - 6) + 3, h - 3 - (v / max) * (h - 6)]);
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('');
  const [lx, ly] = pts[pts.length - 1];
  return (
    <div ref={ref} className="h-7" aria-hidden="true">
      {w > 0 && (
        <svg width={w} height={h}>
          <path d={`${d}L${lx},${h}L3,${h}Z`} fill={color} opacity={0.1} />
          <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={lx} cy={ly} r={3.5} fill={color} stroke="#fff" strokeWidth={2} />
        </svg>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sales vs Payments Received — grouped columns on ONE ₹ axis.
// ---------------------------------------------------------------------------
export const SalesChart: React.FC<{ data: SeriesBucket[] }> = ({ data }) => {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);

  const totalSales = data.reduce((s, d) => s + d.sales, 0);
  const totalReceived = data.reduce((s, d) => s + d.received, 0);
  const H = 230;
  const M = { top: 10, right: 8, bottom: 26, left: 52 };
  const plotW = Math.max(0, width - M.left - M.right);
  const plotH = H - M.top - M.bottom;
  const max = niceMax(Math.max(0, ...data.map((d) => Math.max(d.sales, d.received))));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const band = data.length ? plotW / data.length : 0;
  const barW = Math.max(2, Math.min(18, (band * 0.7 - 2) / 2));
  const y = (v: number) => M.top + plotH - (v / max) * plotH;
  const labelEvery = Math.max(1, Math.ceil(data.length / Math.max(1, Math.floor(plotW / 44))));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <Swatch color={SERIES.sales} /> Sales <strong className="text-slate-800">{inr(totalSales)}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <Swatch color={SERIES.received} /> Payments received <strong className="text-slate-800">{inr(totalReceived)}</strong>
          </span>
        </div>
        <button
          onClick={() => setAsTable((v) => !v)}
          className="text-xs font-semibold text-brand-700 hover:underline cursor-pointer"
          aria-pressed={asTable}
        >
          {asTable ? 'Show chart' : 'View as table'}
        </button>
      </div>

      {asTable ? (
        <div className="max-h-[230px] overflow-y-auto rounded-md border border-slate-200">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-50 text-slate-500">
              <tr>
                <th className="text-left px-3 py-2 font-semibold">Date</th>
                <th className="text-right px-3 py-2 font-semibold">Sales</th>
                <th className="text-right px-3 py-2 font-semibold">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 tabular-nums">
              {data.map((d) => (
                <tr key={d.key}>
                  <td className="px-3 py-1.5 text-slate-600">{d.fullLabel}</td>
                  <td className="px-3 py-1.5 text-right text-slate-800">{inr(d.sales)}</td>
                  <td className="px-3 py-1.5 text-right text-slate-800">{inr(d.received)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div ref={ref} className="relative" style={{ height: H }} onMouseLeave={() => setHover(null)}>
          {width > 0 && (
            <svg width={width} height={H} role="img" aria-label={`Sales ${inr(totalSales)} and payments received ${inr(totalReceived)} for the selected period`}>
              {ticks.map((t) => (
                <g key={t}>
                  <line x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
                  <text x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={10} fill={AXIS_TEXT} className="tabular-nums">
                    {inrCompact(t)}
                  </text>
                </g>
              ))}
              {data.map((d, i) => {
                const cx = M.left + band * i + band / 2;
                const x1 = cx - barW - 1;
                const x2 = cx + 1;
                return (
                  <g key={d.key} opacity={hover === null || hover === i ? 1 : 0.45}>
                    {hover === i && <rect x={M.left + band * i} y={M.top} width={band} height={plotH} fill="#f1f5f9" />}
                    <path d={columnPath(x1, y(d.sales), barW, M.top + plotH - y(d.sales))} fill={SERIES.sales} />
                    <path d={columnPath(x2, y(d.received), barW, M.top + plotH - y(d.received))} fill={SERIES.received} />
                    {i % labelEvery === 0 && (
                      <text x={cx} y={H - 8} textAnchor="middle" fontSize={10} fill={AXIS_TEXT}>
                        {d.label}
                      </text>
                    )}
                    <rect
                      x={M.left + band * i}
                      y={M.top}
                      width={band}
                      height={plotH}
                      fill="transparent"
                      onMouseEnter={() => setHover(i)}
                      onTouchStart={() => setHover(i)}
                    />
                  </g>
                );
              })}
              <line x1={M.left} x2={width - M.right} y1={M.top + plotH} y2={M.top + plotH} stroke="#cbd5e1" strokeWidth={1} />
            </svg>
          )}
          {hover !== null && data[hover] && (
            <Tooltip x={M.left + band * hover + band / 2} y={y(Math.max(data[hover].sales, data[hover].received))} containerW={width}>
              <div className="font-semibold text-slate-800 mb-1">{data[hover].fullLabel}</div>
              <div className="flex items-center gap-2 text-slate-600">
                <Swatch color={SERIES.sales} /> Sales <span className="ml-auto pl-4 font-semibold text-slate-800 tabular-nums">{inr(data[hover].sales)}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Swatch color={SERIES.received} /> Received <span className="ml-auto pl-4 font-semibold text-slate-800 tabular-nums">{inr(data[hover].received)}</span>
              </div>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Outstanding by age — one 100% stacked bar, 2px surface gaps, status colours
// always paired with a text label in the legend.
// ---------------------------------------------------------------------------
export const AgingBar: React.FC<{ data: AgingBucket[] }> = ({ data }) => {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.amount, 0);
  const visible = data.filter((d) => d.amount > 0);
  const gaps = Math.max(0, visible.length - 1) * 2;
  const firstIdx = data.findIndex((d) => d.amount > 0);
  const lastIdx = data.length - 1 - [...data].reverse().findIndex((d) => d.amount > 0);
  let x = 0;
  const segs = data.map((d) => {
    const w = total > 0 && d.amount > 0 ? Math.max(3, ((width - gaps) * d.amount) / total) : 0;
    const seg = { x, w };
    if (w > 0) x += w + 2;
    return seg;
  });

  return (
    <div>
      <div ref={ref} className="relative h-6" onMouseLeave={() => setHover(null)}>
        {width > 0 &&
          (total > 0 ? (
            <svg width={width} height={24} role="img" aria-label={`Outstanding ${inr(total)} by age`}>
              {data.map((d, i) =>
                segs[i].w > 0 ? (
                  <rect
                    key={d.key}
                    x={segs[i].x}
                    y={0}
                    width={segs[i].w}
                    height={24}
                    rx={i === firstIdx || i === lastIdx ? 4 : 0}
                    fill={AGING_COLORS[d.key]}
                    opacity={hover === null || hover === i ? 1 : 0.45}
                    onMouseEnter={() => setHover(i)}
                  />
                ) : null
              )}
            </svg>
          ) : (
            <div className="h-6 rounded bg-slate-100" />
          ))}
        {hover !== null && segs[hover]?.w > 0 && (
          <Tooltip x={segs[hover].x + segs[hover].w / 2} y={0} containerW={width}>
            <div className="font-semibold text-slate-800">{data[hover].label}</div>
            <div className="text-slate-600 tabular-nums">
              {inr(data[hover].amount)} · {data[hover].count} invoice{data[hover].count === 1 ? '' : 's'}
            </div>
          </Tooltip>
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
        {data.map((d) => (
          <div key={d.key} className="flex items-start gap-2 text-xs">
            <Swatch color={AGING_COLORS[d.key]} />
            <div className="min-w-0 -mt-0.5">
              <div className="text-slate-500">{d.label}</div>
              <div className="font-bold text-slate-800 tabular-nums">
                {inr(d.amount)} <span className="font-normal text-slate-400">({d.count})</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Ranked horizontal bars (single series — the title names it, no legend).
// ---------------------------------------------------------------------------
export const RankBars: React.FC<{
  rows: RankRow[];
  color?: string;
  format?: (v: number) => string;
  onSelect?: (row: RankRow) => void;
  avatar?: boolean;
}> = ({ rows, color = SERIES.sales, format = (v) => inr(v), onSelect, avatar }) => {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="space-y-3">
      {rows.map((r) => {
        const body = (
          <>
            <div className="flex items-center justify-between gap-3 text-xs mb-1">
              <span className="flex items-center gap-2 min-w-0">
                {avatar && (
                  <span className="grid place-items-center w-6 h-6 shrink-0 rounded-md bg-brand-50 text-brand-700 text-[10px] font-bold">
                    {r.label
                      .trim()
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((p) => p[0]?.toUpperCase())
                      .join('')}
                  </span>
                )}
                <span className="font-semibold text-slate-700 truncate">{r.label}</span>
              </span>
              <span className="font-bold text-slate-800 tabular-nums shrink-0">{format(r.value)}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full transition-all" style={{ width: `${Math.max(2, (r.value / max) * 100)}%`, background: color }} />
            </div>
            {r.sub && <div className="mt-1 text-[11px] text-slate-400">{r.sub}</div>}
          </>
        );
        return onSelect ? (
          <button key={r.key} onClick={() => onSelect(r)} className="block w-full text-left rounded-md -mx-1.5 px-1.5 py-1 hover:bg-slate-50 cursor-pointer" title={`Open ${r.label}`}>
            {body}
          </button>
        ) : (
          <div key={r.key} className="py-1">
            {body}
          </div>
        );
      })}
    </div>
  );
};
