import React from 'react';
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

  const navBtn =
    'w-8 h-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white';

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-slate-100 text-sm">
      <p className="text-xs text-slate-400 order-last sm:order-first">
        {total} {itemLabel}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        {/* Rows per page */}
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Rows per page</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-8 pl-2.5 pr-7 rounded-md border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Page X of Y */}
        <span className="text-slate-600 font-medium whitespace-nowrap">
          Page {page} of {totalPages}
        </span>

        {/* First / Prev / Next / Last */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(1)}
            disabled={page <= 1}
            className={navBtn}
            aria-label="First page"
          >
            <FaIcon icon="fa-solid fa-angles-left" size={12} />
          </button>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className={navBtn}
            aria-label="Previous page"
          >
            <FaIcon icon="fa-solid fa-angle-left" size={13} />
          </button>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className={navBtn}
            aria-label="Next page"
          >
            <FaIcon icon="fa-solid fa-angle-right" size={13} />
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages}
            className={navBtn}
            aria-label="Last page"
          >
            <FaIcon icon="fa-solid fa-angles-right" size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};
