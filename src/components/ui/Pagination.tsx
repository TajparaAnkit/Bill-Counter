import React from 'react';
import { Select } from './Select';
import { FaIcon } from '../shared/FaIcon';

interface PaginationProps {
  page: number; // 1-based current page
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  /** Noun for the range label, e.g. "invoices". Defaults to "items". */
  itemLabel?: string;
}

// Page numbers with gaps: 1 … 4 5 6 … 12
const pageList = (page: number, total: number): (number | '…')[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | '…')[] = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(total - 1, page + 1);
  if (from > 2) out.push('…');
  for (let i = from; i <= to; i++) out.push(i);
  if (to < total - 1) out.push('…');
  out.push(total);
  return out;
};

export const Pagination: React.FC<PaginationProps> = ({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  itemLabel = 'items',
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  const btn =
    'h-8 min-w-8 px-2.5 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer';

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-slate-200 text-sm">
      <p className="text-[13px] text-slate-500">
        Showing <span className="font-semibold text-slate-700">{from}</span>–<span className="font-semibold text-slate-700">{to}</span> of{' '}
        <span className="font-semibold text-slate-700">{total.toLocaleString('en-IN')}</span> {itemLabel}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-slate-500">Rows</span>
            <Select
              size="sm"
              align="end"
              aria-label="Rows per page"
              options={pageSizeOptions.map((opt) => String(opt))}
              value={String(pageSize)}
              onChange={(v) => onPageSizeChange(Number(v))}
              className="w-[72px]"
            />
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className={btn} aria-label="Previous page">
            <FaIcon icon="fa-solid fa-angle-left" size={11} />
            <span className="hidden sm:inline">Previous</span>
          </button>
          {pageList(page, totalPages).map((p, i) =>
            p === '…' ? (
              <span key={`gap${i}`} className="px-1 text-slate-400">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                aria-current={p === page ? 'page' : undefined}
                className={p === page ? 'h-8 min-w-8 px-2.5 rounded-lg bg-brand-600 text-white text-[13px] font-semibold shadow-sm shadow-brand-600/25' : btn}
              >
                {p}
              </button>
            )
          )}
          <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className={btn} aria-label="Next page">
            <span className="hidden sm:inline">Next</span>
            <FaIcon icon="fa-solid fa-angle-right" size={11} />
          </button>
        </div>
      </div>
    </div>
  );
};
