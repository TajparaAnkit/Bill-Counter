import React, { useEffect, useState } from 'react';
import { FaIcon } from '../shared/FaIcon';
import { Product } from '../../types';
import { Pagination } from '../ui/Pagination';

interface ProductTableProps {
  products: Product[];
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onBulkDelete: (products: Product[]) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  onView,
  onEdit,
  onDelete,
  onBulkDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Reset to first page whenever the search or dataset changes.
  useEffect(() => {
    setPage(1);
  }, [searchTerm, products.length]);

  // Drop any selected ids that no longer exist (e.g. after a delete/reload).
  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set<string>();
      products.forEach((p) => {
        if (prev.has(p.id)) next.add(p.id);
      });
      return next.size === prev.size ? prev : next;
    });
  }, [products]);

  const pagedProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize);

  const allOnPageSelected =
    pagedProducts.length > 0 && pagedProducts.every((p) => selectedIds.has(p.id));

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        pagedProducts.forEach((p) => next.delete(p.id));
      } else {
        pagedProducts.forEach((p) => next.add(p.id));
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkDeleteClick = () => {
    const selected = products.filter((p) => selectedIds.has(p.id));
    if (selected.length) onBulkDelete(selected);
  };

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaIcon icon="fa-solid fa-magnifying-glass" size={18} className="text-gray-400" />
        </span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search products by name..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Bulk action bar — shown only when something is selected */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-blue-800">
              {selectedIds.size} selected
            </span>
            <button
              onClick={clearSelection}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear
            </button>
          </div>
          <button
            onClick={handleBulkDeleteClick}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <FaIcon icon="fa-solid fa-trash" size={15} />
            <span>Delete Selected</span>
          </button>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-150 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-150 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="p-4 w-12">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleSelectAllOnPage}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    title="Select all on this page"
                  />
                </th>
                <th className="p-4 w-20">Image</th>
                <th className="p-4">Product Name</th>
                <th className="p-4">Price</th>
                <th className="p-4 text-center w-40">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150">
              {pagedProducts.length > 0 ? (
                pagedProducts.map((p) => {
                  const isSelected = selectedIds.has(p.id);
                  return (
                    <tr
                      key={p.id}
                      className={`transition-colors ${isSelected ? 'bg-blue-50/60' : 'hover:bg-gray-50/50'}`}
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOne(p.id)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-4">
                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg">
                              🧶
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-gray-800">
                        {p.name}
                      </td>
                      <td className="p-4 font-bold text-blue-600">
                        ₹{p.price.toFixed(2)}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center items-center space-x-2">
                          <button
                            onClick={() => onView(p)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <FaIcon icon="fa-solid fa-eye" size={18} />
                          </button>
                          <button
                            onClick={() => onEdit(p)}
                            className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <FaIcon icon="fa-solid fa-pen-to-square" size={18} />
                          </button>
                          <button
                            onClick={() => onDelete(p)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <FaIcon icon="fa-solid fa-trash" size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    {searchTerm ? 'No matching products found.' : 'No products available.'}
                  </td>
                </tr>
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
      </div>
    </div>
  );
};
