import React from 'react';
import { Link } from 'react-router-dom';
import { FaIcon } from '../shared/FaIcon';

// Shared page + table building blocks (soft SaaS look): page header with
// breadcrumb, card with toolbar, segmented filter tabs, search box, sortable
// headers, status pills and row icon actions.

export const PageHeader: React.FC<{
  title: string;
  subtitle?: string;
  crumbs?: { label: string; to?: string }[];
  actions?: React.ReactNode;
}> = ({ title, subtitle, crumbs, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
    <div className="min-w-0">
      {crumbs && crumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-[13px] text-slate-500 mb-1.5" aria-label="Breadcrumb">
          {crumbs.map((c, i) => (
            <React.Fragment key={i}>
              {i > 0 && <FaIcon icon="fa-solid fa-chevron-right" size={9} className="text-slate-300" />}
              {c.to ? (
                <Link to={c.to} className="hover:text-brand-700">
                  {c.label}
                </Link>
              ) : (
                <span className="text-slate-700 font-medium">{c.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export const TableCard: React.FC<{ title?: React.ReactNode; toolbar?: React.ReactNode; children: React.ReactNode; className?: string }> = ({
  title,
  toolbar,
  children,
  className = '',
}) => (
  <section className={`bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden ${className}`}>
    {(title || toolbar) && (
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-5 pt-5 pb-4">
        {title && <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">{title}</h2>}
        {toolbar && <div className="flex flex-col sm:flex-row sm:items-center gap-2 lg:ml-auto">{toolbar}</div>}
      </div>
    )}
    {children}
  </section>
);

export const CountBadge: React.FC<{ n: number }> = ({ n }) => (
  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">{n.toLocaleString('en-IN')}</span>
);

export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div className="inline-flex max-w-full items-center overflow-x-auto rounded-xl bg-slate-100 p-1" role="tablist" aria-label={ariaLabel}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap transition cursor-pointer ${
              on ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {o.label}
            {o.count !== undefined && <span className={`text-[11px] ${on ? 'text-brand-600' : 'text-slate-400'}`}>{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export const SearchInput: React.FC<{ value: string; onChange: (v: string) => void; placeholder: string; className?: string }> = ({
  value,
  onChange,
  placeholder,
  className = 'sm:w-64',
}) => (
  <div className={`relative ${className}`}>
    <FaIcon icon="fa-solid fa-magnifying-glass" size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 transition"
    />
  </div>
);

// ---- table ----

export const tableCls = 'w-full text-left border-collapse text-sm';
export const theadRowCls = 'border-y border-slate-200';
// `relative` anchors absolutely positioned children (e.g. sr-only labels) inside the table's scroll box.
export const thCls = 'relative px-5 py-3 text-xs font-medium text-slate-500 whitespace-nowrap';
export const tdCls = 'px-5 py-3.5 align-middle';
export const trCls = 'border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors';

export type SortDir = 'asc' | 'desc';

export const SortTh: React.FC<{
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  align?: 'left' | 'right';
  className?: string;
}> = ({ label, active, dir, onClick, align = 'left', className = '' }) => (
  <th className={`${thCls} ${align === 'right' ? 'text-right' : ''} ${className}`} aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 hover:text-slate-800 cursor-pointer ${active ? 'text-slate-800' : ''} ${align === 'right' ? 'flex-row-reverse' : ''}`}
    >
      {label}
      <FaIcon icon={active ? (dir === 'asc' ? 'fa-solid fa-arrow-up' : 'fa-solid fa-arrow-down') : 'fa-solid fa-arrows-up-down'} size={9} className={active ? 'text-brand-600' : 'text-slate-300'} />
    </button>
  </th>
);

// Toggle helper for sortable columns.
export const nextSort = <K extends string>(cur: { key: K; dir: SortDir }, key: K, firstDir: SortDir = 'asc') =>
  cur.key === key ? { key, dir: (cur.dir === 'asc' ? 'desc' : 'asc') as SortDir } : { key, dir: firstDir };

const PILL = {
  green: 'bg-emerald-600 text-white',
  amber: 'bg-amber-400 text-amber-950',
  red: 'bg-rose-600 text-white',
  violet: 'bg-brand-600 text-white',
  brandSoft: 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100',
  slate: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200',
};
export type PillTone = keyof typeof PILL;

export const StatusPill: React.FC<{ tone: PillTone; children: React.ReactNode; icon?: string }> = ({ tone, children, icon }) => (
  <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${PILL[tone]}`}>
    {icon && <FaIcon icon={icon} size={9} />}
    {children}
  </span>
);

export const IconAction: React.FC<{
  icon: string;
  title: string;
  onClick?: () => void;
  tone?: 'default' | 'danger' | 'whatsapp';
  busy?: boolean;
  disabled?: boolean;
}> = ({ icon, title, onClick, tone = 'default', busy, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled || busy}
    title={title}
    aria-label={title}
    className={`grid h-8 w-8 place-items-center rounded-lg transition-colors disabled:opacity-40 cursor-pointer ${
      tone === 'danger'
        ? 'text-slate-400 hover:bg-rose-50 hover:text-rose-600'
        : tone === 'whatsapp'
          ? 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'
          : 'text-slate-400 hover:bg-slate-100 hover:text-slate-800'
    }`}
  >
    <FaIcon icon={busy ? 'fa-solid fa-spinner' : icon} size={14} className={busy ? 'animate-spin' : ''} />
  </button>
);

const AVATAR_TINTS = ['bg-brand-50 text-brand-700', 'bg-sky-50 text-sky-700', 'bg-emerald-50 text-emerald-700', 'bg-amber-50 text-amber-700', 'bg-rose-50 text-rose-700'];

export const Initials: React.FC<{ name: string; size?: 'sm' | 'md' }> = ({ name, size = 'md' }) => {
  const text =
    (name || '?')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || '?';
  const tint = AVATAR_TINTS[(name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_TINTS.length];
  return <span className={`grid shrink-0 place-items-center rounded-full font-semibold ${tint} ${size === 'sm' ? 'h-8 w-8 text-[11px]' : 'h-9 w-9 text-xs'}`}>{text}</span>;
};

// Empty/zero state inside a table.
export const TableEmpty: React.FC<{ colSpan: number; icon: string; title: string; text: string; action?: React.ReactNode }> = ({ colSpan, icon, title, text, action }) => (
  <tr>
    <td colSpan={colSpan} className="px-6 py-16">
      <div className="flex flex-col items-center justify-center text-center gap-3">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
          <FaIcon icon={icon} size={22} />
        </span>
        <div>
          <p className="font-semibold text-slate-700">{title}</p>
          <p className="text-sm text-slate-400 max-w-xs">{text}</p>
        </div>
        {action}
      </div>
    </td>
  </tr>
);
