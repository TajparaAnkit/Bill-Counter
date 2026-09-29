import React, { useEffect, useMemo, useState } from 'react';
import { FaIcon } from '../shared/FaIcon';
import { Product } from '../../types';
import { isLowStock, tracksStock } from '../../utils/stock';
import { Pagination } from '../ui/Pagination';
import { CountBadge, IconAction, SearchInput, SortDir, SortTh, TableCard, TableEmpty, nextSort, tableCls, tdCls, thCls, theadRowCls, trCls } from '../ui/Table';

interface ProductTableProps {
  products: Product[];
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onBulkDelete: (products: Product[]) => void;
  onPromote?: (product: Product) => void; // omitted when the Promote feature is off
  initialSearch?: string;
  showStock?: boolean; // Stock column + low-stock filter (Stock feature)
  initialLowOnly?: boolean;
}

type SortKey = 'name' | 'price' | 'added';

const ms = (t: any) => (t?.toDate ? t.toDate().getTime() : t?.seconds ? t.seconds * 1000 : new Date(t || 0).getTime() || 0);

const Check: React.FC<{ checked: boolean; onChange: () => void; label: string }> = ({ checked, onChange, label }) => (
  <input type="checkbox" checked={checked} onChange={onChange} aria-label={label} title={label} className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer accent-brand-600" />
);

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  onView,
  onEdit,
  onDelete,
  onBulkDelete,
  onPromote,
  initialSearch = '',
  showStock = false,
  initialLowOnly = false,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [lowOnly, setLowOnly] = useState(initialLowOnly);
  const lowCount = useMemo(() => (showStock ? products.filter(isLowStock).length : 0), [products, showStock]);
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'added', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const rows = products.filter(
      (p) => (!term || p.name.toLowerCase().includes(term) || (p.hsn || '').toLowerCase().includes(term)) && (!showStock || !lowOnly || isLowStock(p))
    );
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      if (sort.key === 'price') return (a.price - b.price) * dir;
      if (sort.key === 'name') return a.name.localeCompare(b.name) * dir;
      return (ms(a.createdAt) - ms(b.createdAt)) * dir;
    });
  }, [products, searchTerm, sort, lowOnly, showStock]);

  // Reset to first page whenever the search, sort or dataset changes.
  useEffect(() => {
    setPage(1);
  }, [searchTerm, sort, products.length, lowOnly]);

  // Drop any selected ids that no longer exist (e.g. after a delete/reload).
  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set<string>();
      products.forEach((p) => prev.has(p.id) && next.add(p.id));
      return next.size === prev.size ? prev : next;
    });
  }, [products]);

  const pagedProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize);
  const allOnPageSelected = pagedProducts.length > 0 && pagedProducts.every((p) => selectedIds.has(p.id));

  const toggleOne = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleSelectAllOnPage = () =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      pagedProducts.forEach((p) => (allOnPageSelected ? next.delete(p.id) : next.add(p.id)));
      return next;
    });

  const handleBulkDeleteClick = () => {
    const selected = products.filter((p) => selectedIds.has(p.id));
    if (selected.length) onBulkDelete(selected);
  };

  return (
    <TableCard
      title={
        <>
          All products <CountBadge n={filteredProducts.length} />
        </>
      }
      toolbar={
        <>
          {showStock && (lowCount > 0 || lowOnly) && (
            <button
              type="button"
              onClick={() => setLowOnly((v) => !v)}
              aria-pressed={lowOnly}
              className={`inline-flex items-center gap-2 h-10 px-3.5 rounded-lg border text-sm font-semibold transition-colors cursor-pointer ${
                lowOnly ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FaIcon icon="fa-solid fa-triangle-exclamation" size={12} />
              Low stock ({lowCount})
            </button>
          )}
          <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search products by name or HSN…" className="sm:w-72" />
        </>
      }
    >
      {/* Bulk action bar — shown only when something is selected */}
      {selectedIds.size > 0 && (
        <div className="mx-5 mb-4 flex items-center justify-between rounded-xl bg-brand-50 border border-brand-100 px-4 py-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-brand-800">{selectedIds.size} selected</span>
            <button onClick={() => setSelectedIds(new Set())} className="text-xs text-brand-600 hover:text-brand-800 font-semibold cursor-pointer">
              Clear
            </button>
          </div>
          <button onClick={handleBulkDeleteClick} className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer">
            <FaIcon icon="fa-regular fa-trash-can" size={13} />
            <span>Delete Selected</span>
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className={tableCls}>
          <thead>
            <tr className={theadRowCls}>
              <th className={`${thCls} w-12`}>
                <Check checked={allOnPageSelected} onChange={toggleSelectAllOnPage} label="Select all on this page" />
              </th>
              <SortTh label="Product" active={sort.key === 'name'} dir={sort.dir} onClick={() => setSort((c) => nextSort(c, 'name'))} />
              <th className={thCls}>HSN</th>
              <th className={thCls}>Unit</th>
              {showStock && <th className={`${thCls} text-right`}>Stock</th>}
              <SortTh label="Price" align="right" active={sort.key === 'price'} dir={sort.dir} onClick={() => setSort((c) => nextSort(c, 'price', 'desc'))} />
              <th className={`${thCls} text-right`}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {pagedProducts.length > 0 ? (
              pagedProducts.map((p) => {
                const isSelected = selectedIds.has(p.id);
                return (
                  <tr key={p.id} className={`${trCls} ${isSelected ? 'bg-brand-50/50' : ''}`}>
                    <td className={tdCls}>
                      <Check checked={isSelected} onChange={() => toggleOne(p.id)} label={`Select ${p.name}`} />
                    </td>
                    <td className={tdCls}>
                      <button type="button" onClick={() => onView(p)} className="flex items-center gap-3 text-left min-w-50 group cursor-pointer">
                        <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 grid place-items-center">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-xs font-semibold text-slate-400">{p.name.slice(0, 2).toUpperCase()}</span>
                          )}
                        </span>
                        <span className="font-semibold text-slate-900 group-hover:text-brand-700">{p.name}</span>
                      </button>
                    </td>
                    <td className={`${tdCls} font-mono text-xs text-slate-500`}>{p.hsn || <span className="text-slate-300">—</span>}</td>
                    <td className={tdCls}>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{p.unit || 'PCS'}</span>
                    </td>
                    {showStock && (
                      <td className={`${tdCls} text-right tabular-nums whitespace-nowrap`}>
                        {tracksStock(p) ? (
                          <span className={`font-semibold ${isLowStock(p) ? 'text-rose-600' : 'text-slate-700'}`} title={`Low-stock alert at ${p.lowStock ?? 0}`}>
                            {isLowStock(p) && <FaIcon icon="fa-solid fa-triangle-exclamation" size={11} className="mr-1" />}
                            {p.stock}
                          </span>
                        ) : (
                          <span className="text-slate-300" title="Stock not tracked for this product">—</span>
                        )}
                      </td>
                    )}
                    <td className={`${tdCls} text-right font-semibold text-slate-900 tabular-nums whitespace-nowrap`}>₹{p.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className={`${tdCls} text-right`}>
                      <div className="flex items-center justify-end gap-0.5">
                        {onPromote && <IconAction icon="fa-solid fa-bullhorn" title="Promote (Instagram/WhatsApp)" onClick={() => onPromote(p)} />}
                        <IconAction icon="fa-regular fa-eye" title="View Details" onClick={() => onView(p)} />
                        <IconAction icon="fa-regular fa-pen-to-square" title="Edit" onClick={() => onEdit(p)} />
                        <IconAction icon="fa-regular fa-trash-can" title="Delete" tone="danger" onClick={() => onDelete(p)} />
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <TableEmpty
                colSpan={showStock ? 7 : 6}
                icon={searchTerm ? 'fa-solid fa-magnifying-glass' : 'fa-solid fa-box-open'}
                title={searchTerm ? 'No matching products found' : 'No products available'}
                text={searchTerm ? 'Try a different product name or HSN code.' : 'Add a product or import them from Excel to get started.'}
              />
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        pageSize={pageSize}
        total={filteredProducts.length}
        onPageChange={setPage}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(1);
        }}
        itemLabel="products"
      />
    </TableCard>
  );
};
