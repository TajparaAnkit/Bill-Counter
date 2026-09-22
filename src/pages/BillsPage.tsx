import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '../components/shared/Layout';
import { FaIcon } from '../components/shared/FaIcon';
import { BillForm, BillDraft } from '../components/Bills/BillForm';
import { BillDetailModal } from '../components/Bills/BillDetailModal';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { getBills, getProducts, getBusinessProfile, getCustomers, addBill, deleteBill } from '../services/db';
import { Bill, Product, UserProfile, Customer } from '../types';
import { PAYMENT_META, getPaymentStatus, getAmountDue } from '../utils/payment';
import { Pagination } from '../components/ui/Pagination';
import { useConfirm } from '../components/ui/confirm';
import { Select } from '../components/ui/Select';
import { formatISODate, todayISO, daysBetweenISO } from '../utils/tax';
import { generateInvoicePDF } from '../utils/pdf';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../components/ui/dropdown-menu';

type StatusFilter = 'all' | 'paid' | 'unpaid';
type RangeKey = '30' | '90' | '365' | 'all';

const RANGE_LABEL: Record<RangeKey, string> = {
  '30': 'Last 30 Days',
  '90': 'Last 90 Days',
  '365': 'Last 365 Days',
  all: 'All Time',
};

const toDate = (timestamp: any): Date | null => {
  if (!timestamp) return null;
  if (timestamp.toDate) return timestamp.toDate();
  if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
  const d = new Date(timestamp);
  return isNaN(d.getTime()) ? null : d;
};

const billDate = (b: Bill): Date | null => (b.invoiceDate ? new Date(b.invoiceDate) : toDate(b.createdAt));

const formatCurrency = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatShort = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 2 });

export const BillsPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();

  const [bills, setBills] = useState<Bill[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [businessProfile, setBusinessProfile] = useState<UserProfile | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'create'>(searchParams.get('new') ? 'create' : 'list');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [range, setRange] = useState<RangeKey>('365');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // `/bills?new=1` (sidebar button) opens the editor directly; drop the param afterwards.
  useEffect(() => {
    if (searchParams.get('new')) {
      setViewMode('create');
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const loadData = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const [billsData, productsData, profileData] = await Promise.all([
        getBills(user.uid),
        getProducts(user.uid),
        getBusinessProfile(user.uid),
      ]);
      setBills(billsData);
      setProducts(productsData);
      setBusinessProfile(profileData);
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
    if (user) loadData();
  }, [user]);

  const handleSaveBill = async (draft: BillDraft) => {
    if (!user) return;
    try {
      const newBill = await addBill(user.uid, draft);
      toast.success('Invoice saved successfully');
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

  const handleDownload = async (bill: Bill) => {
    try {
      setDownloadingId(bill.id);
      await generateInvoicePDF(bill, businessProfile, `Invoice_${bill.billNo}.pdf`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  // ---- Range filter ----
  const inRange = useMemo(() => {
    if (range === 'all') return () => true;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(range));
    cutoff.setHours(0, 0, 0, 0);
    return (b: Bill) => {
      const d = billDate(b);
      return !d || d >= cutoff;
    };
  }, [range]);

  const rangeBills = useMemo(() => bills.filter(inRange), [bills, inRange]);

  // ---- Summary tiles (respect the date range, not the status/search filters) ----
  const stats = useMemo(() => {
    const totalSales = rangeBills.reduce((s, b) => s + (b.total || 0), 0);
    const paid = rangeBills.reduce((s, b) => s + Math.min(b.total || 0, b.amountPaid || 0), 0);
    const unpaid = rangeBills.reduce((s, b) => s + getAmountDue(b), 0);
    return { totalSales, paid, unpaid, count: rangeBills.length };
  }, [rangeBills]);

  // ---- Table rows ----
  const filteredBills = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rangeBills.filter((b) => {
      const st = getPaymentStatus(b);
      if (status === 'paid' && st !== 'paid') return false;
      if (status === 'unpaid' && st === 'paid') return false;
      if (!term) return true;
      return (
        b.customerName?.toLowerCase().includes(term) ||
        b.billNo?.toLowerCase().includes(term) ||
        b.billTo?.gstin?.toLowerCase().includes(term)
      );
    });
  }, [rangeBills, search, status]);

  useEffect(() => {
    setPage(1);
  }, [search, status, range, bills.length]);

  const pagedBills = filteredBills.slice((page - 1) * pageSize, page * pageSize);

  const dueInfo = (b: Bill): { text: string; cls: string } => {
    if (getPaymentStatus(b) === 'paid') return { text: 'Paid', cls: 'text-emerald-600' };
    if (!b.dueDate) return { text: '—', cls: 'text-slate-400' };
    const days = daysBetweenISO(todayISO(), b.dueDate);
    if (days < 0) return { text: `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`, cls: 'text-rose-600' };
    if (days === 0) return { text: 'Due today', cls: 'text-amber-600' };
    return { text: `Due in ${days} day${days === 1 ? '' : 's'}`, cls: 'text-slate-600' };
  };

  const tiles: { key: StatusFilter; label: string; icon: string; value: string; color: string }[] = [
    { key: 'all', label: 'Total Sales', icon: 'fa-solid fa-chart-simple', value: `₹ ${formatShort(stats.totalSales)}`, color: 'text-brand-600' },
    { key: 'paid', label: 'Paid', icon: 'fa-solid fa-circle-check', value: `₹ ${formatShort(stats.paid)}`, color: 'text-emerald-600' },
    { key: 'unpaid', label: 'Unpaid', icon: 'fa-solid fa-circle-exclamation', value: `₹ ${formatShort(stats.unpaid)}`, color: 'text-rose-600' },
  ];

  return (
    <Layout>
      {viewMode === 'create' && !isLoading ? (
        <BillForm
          userId={user?.uid || ''}
          products={products}
          customers={customers}
          profile={businessProfile}
          existingBillNos={bills.map((b) => b.billNo)}
          onSave={handleSaveBill}
          onCancel={() => setViewMode('list')}
        />
      ) : (
        <div className="space-y-4">
          {/* Title row */}
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl font-bold text-slate-800">Sales Invoices</h1>
            <span className="hidden sm:inline text-xs text-slate-400">
              {stats.count} invoice{stats.count === 1 ? '' : 's'} · {RANGE_LABEL[range]}
            </span>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <FaIcon icon="fa-solid fa-spinner" className="animate-spin text-brand-500" size={36} />
              <p className="text-slate-500 font-semibold">Loading invoices...</p>
            </div>
          ) : (
            <>
              {/* Summary tiles (click to filter) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {tiles.map((t) => {
                  const active = status === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setStatus(t.key)}
                      className={`text-left rounded-lg border px-4 py-3 transition-colors ${
                        active ? 'border-brand-500 bg-brand-50/60 ring-1 ring-brand-500' : 'border-slate-200 bg-white hover:border-brand-300'
                      }`}
                    >
                      <span className={`flex items-center gap-2 text-sm ${t.color}`}>
                        <FaIcon icon={t.icon} size={13} />
                        {t.label}
                      </span>
                      <span className="mt-1 block text-xl font-bold text-slate-800">{t.value}</span>
                    </button>
                  );
                })}
              </div>

              {/* Filter bar */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="relative sm:w-72">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <FaIcon icon="fa-solid fa-magnifying-glass" size={13} />
                  </span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search party, invoice no. or GSTIN"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                  />
                </div>
                <div className="relative sm:w-48">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
                    <FaIcon icon="fa-regular fa-calendar" size={13} />
                  </span>
                  <Select
                    aria-label="Date range"
                    options={(Object.keys(RANGE_LABEL) as RangeKey[]).map((k) => ({ value: k, label: RANGE_LABEL[k] }))}
                    value={range}
                    onChange={(v) => setRange(v as RangeKey)}
                    className="pl-9 py-2"
                  />
                </div>
                <div className="sm:ml-auto">
                  <button onClick={() => setViewMode('create')} className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 py-2 px-4 text-sm">
                    <FaIcon icon="fa-solid fa-plus" size={12} />
                    Create Sales Invoice
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600">
                        <th className="px-4 py-3 whitespace-nowrap">Date</th>
                        <th className="px-4 py-3 whitespace-nowrap">Invoice Number</th>
                        <th className="px-4 py-3">Party Name</th>
                        <th className="px-4 py-3 whitespace-nowrap">Due In</th>
                        <th className="px-4 py-3 whitespace-nowrap">Amount</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-2 py-3 w-12" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {pagedBills.length > 0 ? (
                        pagedBills.map((bill) => {
                          const st = getPaymentStatus(bill);
                          const due = getAmountDue(bill);
                          const d = dueInfo(bill);
                          const createdDt = toDate(bill.createdAt);
                          const dateText = bill.invoiceDate
                            ? formatISODate(bill.invoiceDate)
                            : createdDt
                              ? createdDt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                              : 'N/A';
                          return (
                            <tr key={bill.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{dateText}</td>
                              <td className="px-4 py-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedBill(bill);
                                    setIsDetailOpen(true);
                                  }}
                                  className="font-semibold text-brand-700 hover:underline whitespace-nowrap"
                                >
                                  {bill.billNo}
                                </button>
                              </td>
                              <td className="px-4 py-3 text-slate-800 font-medium uppercase">{bill.customerName}</td>
                              <td className={`px-4 py-3 whitespace-nowrap font-medium ${d.cls}`}>{d.text}</td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-slate-800 font-semibold">₹ {formatCurrency(bill.total)}</div>
                                {due > 0 && st !== 'paid' && <div className="text-xs text-slate-500">(₹ {formatCurrency(due)} unpaid)</div>}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold ${PAYMENT_META[st].badgeClass}`}>
                                  {PAYMENT_META[st].label}
                                </span>
                              </td>
                              <td className="px-2 py-3 text-center">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button type="button" className="p-2 rounded-md text-slate-500 hover:bg-slate-100" aria-label="Invoice actions">
                                      {downloadingId === bill.id ? (
                                        <FaIcon icon="fa-solid fa-spinner" size={14} className="animate-spin" />
                                      ) : (
                                        <FaIcon icon="fa-solid fa-ellipsis-vertical" size={14} />
                                      )}
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="min-w-[10rem]">
                                    <DropdownMenuItem
                                      onSelect={() => {
                                        setSelectedBill(bill);
                                        setIsDetailOpen(true);
                                      }}
                                    >
                                      <FaIcon icon="fa-solid fa-eye" size={13} className="w-4 text-slate-400" />
                                      View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleDownload(bill)}>
                                      <FaIcon icon="fa-solid fa-file-arrow-down" size={13} className="w-4 text-slate-400" />
                                      Download PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem variant="destructive" onSelect={() => handleDeleteBill(bill)}>
                                      <FaIcon icon="fa-solid fa-trash" size={13} className="w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-16">
                            <div className="flex flex-col items-center justify-center text-center space-y-3">
                              <div className="w-14 h-14 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
                                <FaIcon icon={search || status !== 'all' ? 'fa-solid fa-magnifying-glass' : 'fa-solid fa-file-circle-plus'} size={22} className="text-slate-300" />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-600">
                                  {search || status !== 'all' ? 'No matching invoices' : 'No invoices in this period'}
                                </p>
                                <p className="text-sm text-slate-400 max-w-xs">
                                  {search || status !== 'all'
                                    ? 'Try a different filter, party name or invoice number.'
                                    : 'Create your first sales invoice to start tracking payments.'}
                                </p>
                              </div>
                              {!search && status === 'all' && (
                                <button onClick={() => setViewMode('create')} className="btn-primary flex items-center gap-2 text-sm">
                                  <FaIcon icon="fa-solid fa-plus" size={12} />
                                  Create Sales Invoice
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
                  total={filteredBills.length}
                  onPageChange={setPage}
                  onPageSizeChange={(s) => {
                    setPageSize(s);
                    setPage(1);
                  }}
                  itemLabel="invoices"
                />
              </div>
            </>
          )}
        </div>
      )}

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
