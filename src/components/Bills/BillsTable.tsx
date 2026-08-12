import { FaIcon } from '../shared/FaIcon';
import { Bill } from '../../types';
import { formatCurrency, formatDate } from '../../utils/format';
import { getInitials, avatarGradient } from '../../utils/avatar';
import { PaymentBadge } from '../shared/PaymentBadge';
import { Pagination } from '../ui/Pagination';

interface BillsTableProps {
  bills: Bill[]; // the current page of bills to render
  total: number; // total matching bills (for the count badge + pagination)
  search: string;
  onSearchChange: (value: string) => void;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onView: (bill: Bill) => void;
  onDelete: (bill: Bill) => void;
  onCreateNew: () => void;
  /** Optional filter control(s) rendered in the toolbar (e.g. a date filter). */
  filter?: React.ReactNode;
}

/**
 * The invoices list card: search toolbar, the invoices table (customer avatar,
 * date, total, payment badge, view/delete actions), an empty state, and the
 * pagination footer. Presentational — all data/handlers come from props.
 */
export const BillsTable: React.FC<BillsTableProps> = ({
  bills,
  total,
  search,
  onSearchChange,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onView,
  onDelete,
  onCreateNew,
  filter,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100/80 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-slate-800">All Invoices</h2>
          <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-0.5 rounded-full">
            {total}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {filter}
          <div className="relative w-full sm:w-64">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <FaIcon icon="fa-solid fa-magnifying-glass" size={14} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by customer or invoice no..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all duration-300"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/60 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <th className="p-4 w-44">Invoice No</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Date</th>
              <th className="p-4 text-right">Total</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center w-28">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {total > 0 ? (
              bills.map((bill) => (
                <tr key={bill.id} className="group hover:bg-blue-50/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center space-x-2.5 font-normal text-slate-700">
                      <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <FaIcon icon="fa-solid fa-file-invoice" size={14} />
                      </span>
                      <span>{bill.billNo}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <span className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarGradient(bill.customerName)} text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm`}>
                        {getInitials(bill.customerName)}
                      </span>
                      <span className="font-normal text-slate-700">{bill.customerName}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-500 font-normal text-xs whitespace-nowrap">
                    {formatDate(bill.createdAt)}
                  </td>
                  <td className="p-4 text-right font-extrabold text-blue-700 whitespace-nowrap">
                    {formatCurrency(bill.total)}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center">
                      <PaymentBadge bill={bill} />
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center items-center gap-1.5">
                      <button
                        onClick={() => onView(bill)}
                        className="bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 flex items-center space-x-1.5"
                        title="View Invoice"
                      >
                        <FaIcon icon="fa-solid fa-eye" size={14} />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => onDelete(bill)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Invoice"
                      >
                        <FaIcon icon="fa-solid fa-trash" size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-20">
                  <div className="flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center">
                      <FaIcon
                        icon={search ? 'fa-solid fa-magnifying-glass' : 'fa-solid fa-file-circle-plus'}
                        size={26}
                        className="text-slate-300"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-slate-600">
                        {search ? 'No matching invoices' : 'No bills created yet'}
                      </p>
                      <p className="text-sm text-slate-400 max-w-xs">
                        {search
                          ? 'Try a different customer name or invoice number.'
                          : 'Generate your first invoice to start tracking transactions.'}
                      </p>
                    </div>
                    {!search && (
                      <button onClick={onCreateNew} className="btn-primary flex items-center space-x-2 mt-1">
                        <FaIcon icon="fa-solid fa-plus" size={14} />
                        <span>Create Invoice</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        itemLabel="invoices"
      />
    </div>
  );
};
