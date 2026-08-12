import React, { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/shared/Layout';
import { FaIcon } from '../components/shared/FaIcon';
import { BillForm, BillCustomerInput, BillTotalsInput } from '../components/Bills/BillForm';
import { BillDetailModal } from '../components/Bills/BillDetailModal';
import { BillStatCards } from '../components/Bills/BillStatCards';
import { BillsTable } from '../components/Bills/BillsTable';
import { DateRangeFilter, DatePreset } from '../components/Bills/DateRangeFilter';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import {
  getBills,
  getProducts,
  getBusinessProfile,
  getCustomers,
  getNextBillNumber,
  addBill,
  deleteBill
} from '../services/db';
import { Bill, Product, UserProfile, BillItem, Customer } from '../types';
import { useConfirm } from '../components/ui/confirm';
import { toDate, toMillis } from '../utils/format';
import { buildBillsCsv, billsCsvFilename, downloadCsv } from '../utils/csv';

export const BillsPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();

  const [bills, setBills] = useState<Bill[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [businessProfile, setBusinessProfile] = useState<UserProfile | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Date-range filter
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDateStr, setToDateStr] = useState('');

  // Selection
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const loadData = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const [billsData, productsData, profileData] = await Promise.all([
        getBills(user.uid),
        getProducts(user.uid),
        getBusinessProfile(user.uid)
      ]);
      setBills(billsData);
      setProducts(productsData);
      setBusinessProfile(profileData);

      // Customers are optional for invoicing — never let a customers failure
      // block the bill list from loading.
      try {
        setCustomers(await getCustomers(user.uid));
      } catch (custErr) {
        console.error('Could not load customers (autocomplete disabled):', custErr);
        setCustomers([]);
      }
    } catch (err) {
      toast.error('Failed to load invoicing data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const handleSaveBill = async (
    customer: BillCustomerInput,
    items: BillItem[],
    totals: BillTotalsInput,
    notes?: string
  ) => {
    if (!user) return;
    try {
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const discount = Math.min(subtotal, Math.max(0, totals.discount || 0));
      const taxRate = Math.max(0, totals.taxRate || 0);
      const taxable = subtotal - discount;
      const tax = taxable * (taxRate / 100);
      const total = taxable + tax;

      // Calculate sequential bill details
      const next = await getNextBillNumber(user.uid, businessProfile?.billPrefix);

      const billData = {
        billNo: next.billNo,
        billSeqNum: next.billSeqNum,
        customerName: customer.name,
        customerId: customer.customerId,
        customerPhone: customer.customerPhone,
        items,
        subtotal,
        discount,
        taxRate,
        tax,
        total,
        paymentStatus: 'unpaid' as const,
        amountPaid: 0,
        notes
      };

      const newBill = await addBill(user.uid, billData);
      toast.success('Invoice saved successfully');

      // Update local state and show detail modal
      setBills([newBill, ...bills]);
      setSelectedBill(newBill);
      setIsDetailOpen(true);
      setViewMode('list');
    } catch (err) {
      toast.error('Failed to save bill');
      throw err;
    }
  };

  const handleDeleteBill = async (bill: Bill) => {
    const ok = await confirm({
      title: 'Delete Invoice',
      message: `Are you sure you want to permanently delete invoice "${bill.billNo}" for ${bill.customerName}? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteBill(bill.id);
      setBills((prev) => prev.filter((b) => b.id !== bill.id));
      toast.success('Invoice deleted');
    } catch (err) {
      toast.error('Failed to delete invoice');
    }
  };

  // Derived summary stats
  const stats = useMemo(() => {
    const totalRevenue = bills.reduce((sum, b) => sum + (b.total || 0), 0);
    const now = new Date();
    const thisMonth = bills
      .filter((b) => {
        const d = toDate(b.createdAt);
        return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, b) => sum + (b.total || 0), 0);
    const avg = bills.length ? totalRevenue / bills.length : 0;
    return { count: bills.length, totalRevenue, thisMonth, avg };
  }, [bills]);

  // Resolve the selected preset / custom inputs into a [startMs, endMs] window.
  // `null` means "no date restriction".
  const dateRange = useMemo<{ start: number; end: number } | null>(() => {
    const now = new Date();
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    if (datePreset === 'all') return null;
    if (datePreset === '15d' || datePreset === '30d') {
      const days = datePreset === '15d' ? 15 : 30;
      const start = new Date(now);
      start.setDate(now.getDate() - (days - 1));
      start.setHours(0, 0, 0, 0);
      return { start: start.getTime(), end: endOfToday.getTime() };
    }
    if (datePreset === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      return { start: start.getTime(), end: endOfToday.getTime() };
    }
    // custom
    const start = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : -Infinity;
    const end = toDateStr ? new Date(`${toDateStr}T23:59:59.999`).getTime() : Infinity;
    return { start, end };
  }, [datePreset, fromDate, toDateStr]);

  // Combined search + date-range filter
  const filteredBills = useMemo(() => {
    const term = search.trim().toLowerCase();
    return bills.filter((b) => {
      const matchesSearch =
        !term ||
        b.customerName?.toLowerCase().includes(term) ||
        b.billNo?.toLowerCase().includes(term);
      if (!matchesSearch) return false;

      if (dateRange) {
        const t = toMillis(b.createdAt);
        if (t < dateRange.start || t > dateRange.end) return false;
      }
      return true;
    });
  }, [bills, search, dateRange]);

  // Reset to first page when the search, filter, or dataset changes.
  useEffect(() => {
    setPage(1);
  }, [search, datePreset, fromDate, toDateStr, bills.length]);

  const pagedBills = filteredBills.slice((page - 1) * pageSize, page * pageSize);

  // Exports whatever the current search + date filter has narrowed down to
  // (not just the visible page), so the file matches what the user sees.
  const handleExportCsv = () => {
    if (!filteredBills.length) {
      toast.error('No invoices to export');
      return;
    }
    try {
      downloadCsv(billsCsvFilename(), buildBillsCsv(filteredBills));
      toast.success(`Exported ${filteredBills.length} invoice(s)`);
    } catch (err) {
      console.error('CSV export failed:', err);
      toast.error('Failed to export invoices');
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-slide-up">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              <FaIcon icon="fa-solid fa-file-invoice-dollar" size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 font-display">
                {viewMode === 'create' ? 'New Invoice' : 'Bills & Invoices'}
              </h1>
              <p className="text-slate-500 mt-0.5 text-sm font-medium">
                {viewMode === 'create'
                  ? 'Generate a customer invoice'
                  : 'Create and manage client transactions'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            {viewMode === 'create' ? (
              <button
                onClick={() => setViewMode('list')}
                className="btn-secondary flex items-center space-x-2 py-2.5 px-4.5"
              >
                <FaIcon icon="fa-solid fa-arrow-left" size={16} />
                <span>Back to List</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleExportCsv}
                  disabled={isLoading || !filteredBills.length}
                  title="Export the filtered invoices to CSV"
                  className="btn-secondary flex items-center space-x-2 py-2.5 px-4.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaIcon icon="fa-solid fa-file-export" size={16} />
                  <span>Export</span>
                </button>
                <button
                  onClick={() => setViewMode('create')}
                  className="btn-primary flex items-center space-x-2 py-2.5 px-4.5"
                >
                  <FaIcon icon="fa-solid fa-plus" size={16} />
                  <span>New Bill</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <FaIcon icon="fa-solid fa-spinner" className="animate-spin text-blue-500" size={40} />
            <p className="text-slate-500 font-semibold">Loading invoices...</p>
          </div>
        ) : viewMode === 'create' ? (
          <BillForm
            userId={user?.uid || ''}
            products={products}
            customers={customers}
            billPrefix={businessProfile?.billPrefix}
            taxEnabled={businessProfile?.taxEnabled}
            defaultTaxRate={businessProfile?.defaultTaxRate}
            onSave={handleSaveBill}
            onCancel={() => setViewMode('list')}
          />
        ) : (
          <>
            <BillStatCards stats={stats} />

            <BillsTable
              bills={pagedBills}
              total={filteredBills.length}
              search={search}
              onSearchChange={setSearch}
              filter={
                <DateRangeFilter
                  preset={datePreset}
                  onPresetChange={setDatePreset}
                  from={fromDate}
                  to={toDateStr}
                  onFromChange={setFromDate}
                  onToChange={setToDateStr}
                />
              }
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(s) => {
                setPageSize(s);
                setPage(1);
              }}
              onView={(bill) => {
                setSelectedBill(bill);
                setIsDetailOpen(true);
              }}
              onDelete={handleDeleteBill}
              onCreateNew={() => setViewMode('create')}
            />
          </>
        )}
      </div>

      {/* Bill Detail Modal */}
      <BillDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedBill(null);
        }}
        bill={selectedBill}
        businessProfile={businessProfile}
        onUpdated={(updated) => {
          setBills((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
          setSelectedBill(updated);
        }}
      />
    </Layout>
  );
};
