import React from 'react';
import { FaIcon } from '../shared/FaIcon';

// Building blocks for Knowledge Base articles.
//
// "Screen examples" are static mock-ups drawn with the app's own styles, so
// they always match the real UI and never go stale like screenshots. Mock-ups
// deliberately use <div>/<span> (not <p>/<ul>/<a>) so the .kb-article prose
// styles don't leak into them.

// Numbered callout that points at a spot in a screen example.
export const Mark: React.FC<{ n: number; className?: string }> = ({ n, className = '' }) => (
  <span
    className={`inline-grid place-items-center w-5 h-5 shrink-0 rounded-full bg-amber-400 text-slate-900 text-[10px] font-bold ring-2 ring-white shadow ${className}`}
    aria-label={`Marker ${n}`}
  >
    {n}
  </span>
);

// Browser-style frame around a mock-up.
export const Screen: React.FC<{ title: string; children: React.ReactNode; bare?: boolean }> = ({ title, children, bare }) => (
  <figure className="my-4 rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
    <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 border-b border-slate-200">
      <span className="flex gap-1" aria-hidden="true">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-300" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
      </span>
      <span className="flex-1 min-w-0 flex items-center gap-1.5 rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[11px] text-slate-500 truncate">
        <FaIcon icon="fa-solid fa-image" size={9} className="text-slate-400" />
        Screen example · {title}
      </span>
    </div>
    <div className={`${bare ? '' : 'bg-canvas p-3 sm:p-4'} text-xs text-slate-700 overflow-x-auto`}>{children}</div>
  </figure>
);

// Explains each numbered marker under a screen example.
export const Legend: React.FC<{ items: [number, React.ReactNode][] }> = ({ items }) => (
  <div className="space-y-1.5 mb-4">
    {items.map(([n, text]) => (
      <div key={n} className="flex items-start gap-2">
        <Mark n={n} className="mt-0.5" />
        <span>{text}</span>
      </div>
    ))}
  </div>
);

// Numbered step. `data-kb-step` lets the article page build its "On this page" list.
export const Step: React.FC<{ n: number; title: string; children: React.ReactNode }> = ({ n, title, children }) => (
  <section className="mt-8 first:mt-2 scroll-mt-24" id={`step-${n}`} data-kb-step={title}>
    <h3 className="flex items-center gap-2.5 text-[15px] font-bold text-slate-800 mb-2">
      <span className="grid place-items-center w-7 h-7 rounded-full bg-brand-600 text-white text-xs shrink-0">{n}</span>
      {title}
    </h3>
    <div>{children}</div>
  </section>
);

const CALLOUT = {
  tip: { icon: 'fa-solid fa-lightbulb', cls: 'bg-brand-50 border-brand-200 text-brand-900', label: 'Tip' },
  note: { icon: 'fa-solid fa-circle-info', cls: 'bg-sky-50 border-sky-200 text-sky-900', label: 'Good to know' },
  warning: { icon: 'fa-solid fa-triangle-exclamation', cls: 'bg-amber-50 border-amber-200 text-amber-900', label: 'Careful' },
};

export const Callout: React.FC<{ type?: keyof typeof CALLOUT; children: React.ReactNode }> = ({ type = 'tip', children }) => {
  const c = CALLOUT[type];
  return (
    <div className={`my-4 flex gap-3 rounded-lg border px-4 py-3 text-[13px] leading-relaxed ${c.cls}`}>
      <FaIcon icon={c.icon} size={14} className="mt-0.5 shrink-0" />
      <div>
        <strong className="block text-xs uppercase tracking-wide mb-0.5">{c.label}</strong>
        {children}
      </div>
    </div>
  );
};

// ---------- mock UI pieces ----------

const BTN = {
  primary: 'bg-brand-600 text-white shadow-sm shadow-brand-600/25',
  dark: 'bg-brand-800 text-white',
  secondary: 'bg-white border border-slate-200 text-slate-700 shadow-xs',
  whatsapp: 'bg-[#25D366] text-white',
  danger: 'bg-rose-600 text-white',
  soft: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  ghost: 'text-slate-500',
};

export const MockBtn: React.FC<{ variant?: keyof typeof BTN; icon?: string; mark?: number; children?: React.ReactNode }> = ({
  variant = 'primary',
  icon,
  mark,
  children,
}) => (
  <span className="inline-flex items-center gap-1.5">
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap ${BTN[variant]}`}>
      {icon && <FaIcon icon={icon} size={11} />}
      {children}
    </span>
    {mark !== undefined && <Mark n={mark} />}
  </span>
);

export const MockField: React.FC<{
  label?: string;
  value?: string;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  mark?: number;
  required?: boolean;
  select?: boolean;
  tall?: boolean;
  className?: string;
}> = ({ label, value, placeholder, prefix, suffix, mark, required, select, tall, className = '' }) => (
  <div className={className}>
    {label && (
      <div className="flex items-center gap-1.5 mb-1 text-[11px] font-semibold text-slate-600">
        {label}
        {required && <span className="text-rose-500">*</span>}
        {mark !== undefined && <Mark n={mark} />}
      </div>
    )}
    <div className={`flex items-stretch bg-white border border-slate-200 rounded-lg overflow-hidden ${tall ? 'min-h-[52px]' : ''}`}>
      {prefix && <span className="px-2 flex items-center bg-slate-50 border-r border-slate-200 text-slate-500">{prefix}</span>}
      <span className={`flex-1 px-2.5 py-1.5 truncate ${value ? 'text-slate-800' : 'text-slate-400'}`}>{value || placeholder || ' '}</span>
      {select && <FaIcon icon="fa-solid fa-chevron-down" size={9} className="self-center mr-2 text-slate-400" />}
      {suffix && <span className="px-2 flex items-center bg-slate-50 border-l border-slate-200 text-slate-500">{suffix}</span>}
    </div>
  </div>
);

export const MockToggle: React.FC<{ on?: boolean }> = ({ on }) => (
  <span className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full ${on ? 'bg-brand-600' : 'bg-slate-300'}`}>
    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow ${on ? 'translate-x-4' : 'translate-x-0.5'}`} />
  </span>
);

export const MockCheck: React.FC<{ on?: boolean; label?: React.ReactNode }> = ({ on, label }) => (
  <span className="inline-flex items-center gap-1.5">
    <span className={`grid place-items-center w-3.5 h-3.5 rounded border ${on ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-slate-300'}`}>
      {on && <FaIcon icon="fa-solid fa-check" size={8} />}
    </span>
    {label}
  </span>
);

const BADGE = {
  paid: ['bg-emerald-600 text-white border-transparent', 'fa-solid fa-circle-check', 'Paid'],
  partial: ['bg-amber-400 text-amber-950 border-transparent', 'fa-solid fa-circle-half-stroke', 'Partial'],
  unpaid: ['bg-slate-100 text-slate-600 border-slate-200', 'fa-solid fa-circle-exclamation', 'Unpaid'],
} as const;

export const MockBadge: React.FC<{ status: keyof typeof BADGE }> = ({ status }) => {
  const [cls, icon, label] = BADGE[status];
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-semibold ${cls}`}>
      <FaIcon icon={icon} size={8} />
      {label}
    </span>
  );
};

// White panel inside a screen example.
export const Panel: React.FC<{ title?: string; subtitle?: string; right?: React.ReactNode; className?: string; children: React.ReactNode }> = ({
  title,
  subtitle,
  right,
  className = '',
  children,
}) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden ${className}`}>
    {title && (
      <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2 border-b border-slate-100">
        <div>
          <div className="font-bold text-slate-700">{title}</div>
          {subtitle && <div className="text-[10px] text-slate-400">{subtitle}</div>}
        </div>
        {right}
      </div>
    )}
    <div className="p-3">{children}</div>
  </div>
);

// Simple table for mock-ups. Cells may contain markers/badges.
export const MockTable: React.FC<{ cols: React.ReactNode[]; rows: React.ReactNode[][]; align?: ('l' | 'r' | 'c')[]; minW?: number }> = ({
  cols,
  rows,
  align = [],
  minW = 460,
}) => {
  const a = (i: number) => (align[i] === 'r' ? 'text-right' : align[i] === 'c' ? 'text-center' : 'text-left');
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden" style={{ minWidth: minW }}>
      <div className="grid gap-2 px-3 py-2 border-b border-slate-200 text-[10px] font-medium text-slate-500" style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))` }}>
        {cols.map((c, i) => (
          <span key={i} className={a(i)}>
            {c}
          </span>
        ))}
      </div>
      {rows.map((r, ri) => (
        <div key={ri} className="grid gap-2 items-center px-3 py-2 border-b border-slate-100 last:border-0" style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))` }}>
          {r.map((c, i) => (
            <span key={i} className={`${a(i)} min-w-0 truncate`}>
              {c}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
};

// Small "where to find it" path, e.g. Sidebar → Settings → Business Settings.
export const Path: React.FC<{ items: string[] }> = ({ items }) => (
  <span className="inline-flex flex-wrap items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[12px] font-semibold text-slate-700 align-middle">
    {items.map((it, i) => (
      <React.Fragment key={i}>
        {i > 0 && <FaIcon icon="fa-solid fa-chevron-right" size={8} className="text-slate-400" />}
        {it}
      </React.Fragment>
    ))}
  </span>
);
