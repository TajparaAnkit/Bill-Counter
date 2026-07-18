import React, { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/shared/Layout';
import { FaIcon } from '../components/shared/FaIcon';
import { BillForm, BillCustomerInput, BillTotalsInput } from '../components/Bills/BillForm';
import { BillDetailModal } from '../components/Bills/BillDetailModal';
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
import { PAYMENT_META, getPaymentStatus } from '../utils/payment';
import { Pagination } from '../components/ui/Pagination';
import { useConfirm } from '../components/ui/confirm';

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

  const toDate = (timestamp: any): Date | null => {
    if (!timestamp) return null;
    if (timestamp.toDate) return timestamp.toDate();
    return new Date(timestamp);
  };

  const formatDate = (timestamp: any) => {
    const d = toDate(timestamp);
    if (!d) return 'N/A';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (n: number) =>
    n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

  // Search filter
  const filteredBills = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return bills;
    return bills.filter(
      (b) =>
        b.customerName?.toLowerCase().includes(term) ||
        b.billNo?.toLowerCase().includes(term)
    );
  }, [bills, search]);

  // Reset to first page when the search or dataset changes.
  useEffect(() => {
    setPage(1);
  }, [search, bills.length]);

  const pagedBills = filteredBills.slice((page - 1) * pageSize, page * pageSize);

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
  };

  const avatarPalette = [
    'from-blue-700 to-blue-500',
    'from-sky-500 to-blue-500',
    'from-violet-500 to-purple-500',
    'from-amber-500 to-orange-500',
    'from-rose-500 to-pink-500',
  ];
  const avatarColor = (name: string) => {
    const code = (name || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return avatarPalette[code % avatarPalette.length];
  };

  const statCards = [
    {
      label: 'Total Invoices',
      value: stats.count.toString(),
      icon: 'fa-solid fa-file-invoice',
      tint: 'from-blue-700 to-blue-500',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
    },
    {
      label: 'Total Revenue',
      value: `₹${formatCurrency(stats.totalRevenue)}`,
      icon: 'fa-solid fa-indian-rupee-sign',
      tint: 'from-sky-500 to-blue-500',
      bg: 'bg-sky-50',
      text: 'text-sky-600',
    },
    {
      label: 'This Month',
      value: `₹${formatCurrency(stats.thisMonth)}`,
      icon: 'fa-solid fa-calendar-day',
      tint: 'from-violet-500 to-purple-500',
      bg: 'bg-violet-50',
      text: 'text-violet-600',
    },
    {
      label: 'Avg. Invoice',
      value: `₹${formatCurrency(stats.avg)}`,
      icon: 'fa-solid fa-chart-line',
      tint: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-50',
      text: 'text-amber-600',
    },
  ];

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

          <div>
            {viewMode === 'create' ? (
              <button
                onClick={() => setViewMode('list')}
                className="btn-secondary flex items-center space-x-2 py-2.5 px-4.5"
              >
                <FaIcon icon="fa-solid fa-arrow-left" size={16} />
                <span>Back to List</span>
              </button>
            ) : (
              <button
                onClick={() => setViewMode('create')}
                className="btn-primary flex items-center space-x-2 py-2.5 px-4.5"
              >
                <FaIcon icon="fa-solid fa-plus" size={16} />
                <span>New Bill</span>
              </button>
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
            {/* Summary stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((card) => (
                <div
                  key={card.label}
                  className="group bg-white rounded-2xl border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-5 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(16,185,129,0.08)] hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.tint} flex items-center justify-center shadow-md shadow-slate-900/5`}>
                      <FaIcon icon={card.icon} size={16} className="text-white" />
                    </div>
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-4">
                    {card.label}
                  </p>
                  <p className="text-2xl font-extrabold text-slate-800 mt-1 tracking-tight truncate">
                    {card.value}
                  </p>
                </div>
              ))}
            </div>

            {/* List card */}
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100/80 overflow-hidden">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-slate-800">All Invoices</h2>
                  <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-0.5 rounded-full">
                    {filteredBills.length}
                  </span>
                </div>
                <div className="relative w-full sm:w-72">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <FaIcon icon="fa-solid fa-magnifying-glass" size={14} />
                  </span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by customer or invoice no..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all duration-300"
                  />
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
                    {filteredBills.length > 0 ? (
                      pagedBills.map((bill) => (
                        <tr key={bill.id} className="group hover:bg-blue-50/30 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center space-x-2.5 font-bold text-slate-700">
                              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <FaIcon icon="fa-solid fa-file-invoice" size={14} />
                              </span>
                              <span>{bill.billNo}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <span className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarColor(bill.customerName)} text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm`}>
                                {getInitials(bill.customerName)}
                              </span>
                              <span className="font-bold text-slate-700">{bill.customerName}</span>
                            </div>
                          </td>
                          <td className="p-4 text-slate-500 font-semibold text-xs whitespace-nowrap">
                            {formatDate(bill.createdAt)}
                          </td>
                          <td className="p-4 text-right font-extrabold text-blue-700 whitespace-nowrap">
                            ₹{formatCurrency(bill.total)}
                          </td>
                          <td className="p-4">
                            <div className="flex justify-center">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${PAYMENT_META[getPaymentStatus(bill)].badgeClass}`}>
                                <FaIcon icon={PAYMENT_META[getPaymentStatus(bill)].icon} size={11} />
                                {PAYMENT_META[getPaymentStatus(bill)].label}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex justify-center items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedBill(bill);
                                  setIsDetailOpen(true);
                                }}
                                className="bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 flex items-center space-x-1.5"
                                title="View Invoice"
                              >
                                <FaIcon icon="fa-solid fa-eye" size={14} />
                                <span>View</span>
                              </button>
                              <button
                                onClick={() => handleDeleteBill(bill)}
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
                              <button
                                onClick={() => setViewMode('create')}
                                className="btn-primary flex items-center space-x-2 mt-1"
                              >
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
