import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '../components/shared/Layout';
import { FaIcon } from '../components/shared/FaIcon';
import { BillForm, BillDraft } from '../components/Bills/BillForm';
import { BillDetailModal } from '../components/Bills/BillDetailModal';
import { useAuth } from '../hooks/useAuth';
import { useFeature } from '../hooks/useAccount';
import { useInvoiceTemplate } from '../hooks/useInvoiceTemplate';
import { useToast } from '../hooks/useToast';
import {
  getBills,
  getProducts,
  getBusinessProfile,
  getCustomers,
  addBill,
  updateBill,
  setBillCancelled,
  deleteBill,
  getQuotation,
  convertQuotationToBill,
} from '../services/db';
import { Bill, Product, UserProfile, Customer, Quotation } from '../types';
import { applyStockDeltas, stockDeltas } from '../utils/stock';
import { isLiveBill } from '../utils/docs';
import { invoiceReminderUrl } from '../utils/reminder';
import { exportInvoicesToExcel } from '../utils/exportInvoices';
import { getPaymentStatus, getAmountDue } from '../utils/payment';
import { Pagination } from '../components/ui/Pagination';
import { useConfirm } from '../components/ui/confirm';
import { Select } from '../components/ui/Select';
import { formatISODate, todayISO, daysBetweenISO } from '../utils/tax';
import { generateInvoicePDF, generateInvoicePdfFile } from '../utils/pdf';
import { sharePdfOnWhatsApp } from '../utils/share';
import {
  CountBadge,
  IconAction,
  Initials,
  PageHeader,
  SearchInput,
  SegmentedTabs,
  SortDir,
  SortTh,
  StatusPill,
  TableCard,
  TableEmpty,
  nextSort,
  tableCls,
  tdCls,
  thCls,
  theadRowCls,
  trCls,
} from '../components/ui/Table';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../components/ui/dropdown-menu';

type StatusFilter = 'all' | 'paid' | 'unpaid' | 'overdue' | 'cancelled';
type SortKey = 'date' | 'number' | 'party' | 'due' | 'amount';
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
  const [search, setSearch] = useState(searchParams.get('q') || '');
  // `?status=unpaid` (dashboard links) pre-filters the list across all dates.
  const initialStatus = searchParams.get('status');
  const [status, setStatus] = useState<StatusFilter>(initialStatus === 'paid' || initialStatus === 'unpaid' || initialStatus === 'overdue' ? initialStatus : 'all');
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'date', dir: 'desc' });
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [range, setRange] = useState<RangeKey>(initialStatus ? 'all' : '365');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [fromQuote, setFromQuote] = useState<Quotation | null>(null);
  const stockOn = useFeature('stock');
  const template = useInvoiceTemplate(businessProfile);

  // `/bills?new=1` (sidebar button) opens the editor directly; drop the param afterwards.
  useEffect(() => {
    if (searchParams.get('new')) {
      setEditingBill(null);
      setFromQuote(null);
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

  // `?fromQuote=<id>` (Quotations → Convert) opens a new invoice prefilled from the quotation.
  useEffect(() => {
    const qid = searchParams.get('fromQuote');
    if (!qid) return;
    const next = new URLSearchParams(searchParams);
    next.delete('fromQuote');
    setSearchParams(next, { replace: true });
    getQuotation(qid)
      .then((q) => {
        if (!q) return toast.error('Quotation not found');
        if (q.convertedBillNo) return toast.warning(`${q.billNo} was already converted to ${q.convertedBillNo}`);
        setEditingBill(null);
        setFromQuote(q);
        setViewMode('create');
      })
      .catch(() => toast.error('Failed to load quotation'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const closeForm = () => {
    setViewMode('list');
    setEditingBill(null);
    setFromQuote(null);
  };

  const startEdit = (bill: Bill) => {
    setIsDetailOpen(false);
    setSelectedBill(null);
    setFromQuote(null);
    setEditingBill(bill);
    setViewMode('create');
  };

  // Stock is only moved while the Stock feature is on for this client.
  const deltasFor = (before: Bill['items'] = [], after: Bill['items'] = []) => (stockOn ? stockDeltas(products, before, after) : {});

  // `?open=<billId>` (dashboard "Record Payment" / overdue list) opens that invoice once loaded.
  useEffect(() => {
    const openId = searchParams.get('open');
    if (!openId || isLoading) return;
    const target = bills.find((b) => b.id === openId);
    if (target) {
      setSelectedBill(target);
      setIsDetailOpen(true);
    }
    const next = new URLSearchParams(searchParams);
    next.delete('open');
    next.delete('status');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isLoading, bills]);

  const handleSaveBill = async (draft: BillDraft) => {
    if (!user) return;
    try {
      let saved: Bill;
      if (editingBill) {
        const deltas = editingBill.cancelled ? {} : deltasFor(editingBill.items, draft.items);
        saved = await updateBill(editingBill, draft, deltas);
        setProducts((ps) => applyStockDeltas(ps, deltas));
        setBills((prev) => prev.map((b) => (b.id === saved.id ? saved : b)));
        toast.success('Invoice updated');
      } else {
        const deltas = deltasFor([], draft.items);
        saved = fromQuote ? await convertQuotationToBill(user.uid, fromQuote, draft, deltas) : await addBill(user.uid, draft, deltas);
        setProducts((ps) => applyStockDeltas(ps, deltas));
        setBills((prev) => [saved, ...prev]);
        toast.success(fromQuote ? `Invoice created from ${fromQuote.billNo}` : 'Invoice saved successfully');
      }
      setSelectedBill(saved);
      setIsDetailOpen(true);
      closeForm();
    } catch (err) {
      toast.error('Failed to save bill');
      throw err;
    }
  };

  const handleCancelBill = async (bill: Bill) => {
    const paid = bill.amountPaid || 0;
    const ok = await confirm({
      title: 'Cancel Invoice',
      message: `Cancel invoice "${bill.billNo}" for ${bill.customerName}? It stays in your list with its number, but no longer counts in sales, balances or reports${
        stockOn ? ', and its items go back into stock' : ''
      }.${paid > 0 ? ` The ₹${paid.toFixed(2)} received on it will no longer count either.` : ''}`,
      confirmText: 'Cancel Invoice',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      const deltas = deltasFor(bill.items, []);
      const updated = await setBillCancelled(bill, true, deltas);
      setProducts((ps) => applyStockDeltas(ps, deltas));
      setBills((prev) => prev.map((b) => (b.id === bill.id ? updated : b)));
      if (selectedBill?.id === bill.id) setSelectedBill(updated);
      toast.success(`Invoice ${bill.billNo} cancelled`);
    } catch (err) {
      toast.error('Failed to cancel invoice');
    }
  };

  const handleRestoreBill = async (bill: Bill) => {
    try {
      const deltas = deltasFor([], bill.items);
      const updated = await setBillCancelled(bill, false, deltas);
      setProducts((ps) => applyStockDeltas(ps, deltas));
      setBills((prev) => prev.map((b) => (b.id === bill.id ? updated : b)));
      if (selectedBill?.id === bill.id) setSelectedBill(updated);
      toast.success(`Invoice ${bill.billNo} restored`);
    } catch (err) {
      toast.error('Failed to restore invoice');
    }
  };

  const handleDeleteBill = async (bill: Bill) => {
    const ok = await confirm({
      title: 'Delete Invoice',
      message: `Are you sure you want to permanently delete invoice "${bill.billNo}" for ${bill.customerName}? This action cannot be undone.${
        bill.cancelled ? '' : ' Tip: use “Cancel invoice” instead to keep your invoice numbers without gaps (needed for GST).'
      }`,
      confirmText: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      const deltas = bill.cancelled ? {} : deltasFor(bill.items, []);
      await deleteBill(bill.id, deltas);
      setProducts((ps) => applyStockDeltas(ps, deltas));
      setBills((prev) => prev.filter((b) => b.id !== bill.id));
      toast.success('Invoice deleted');
    } catch (err) {
      toast.error('Failed to delete invoice');
    }
  };

  const handleDownload = async (bill: Bill) => {
    try {
      setDownloadingId(bill.id);
      await generateInvoicePDF(bill, businessProfile, `Invoice_${bill.billNo}.pdf`, template);
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
  // Totals and status counts ignore cancelled invoices.
  const liveRangeBills = useMemo(() => rangeBills.filter(isLiveBill), [rangeBills]);

  // ---- Summary tiles (respect the date range, not the status/search filters) ----
  // Overdue = money still due and the due date has passed.
  const isOverdue = (b: Bill) => !b.cancelled && getAmountDue(b) > 0 && !!b.dueDate && daysBetweenISO(todayISO(), b.dueDate) < 0;

  const stats = useMemo(() => {
    const live = liveRangeBills;
    const totalSales = live.reduce((s, b) => s + (b.total || 0), 0);
    const paid = live.reduce((s, b) => s + Math.min(b.total || 0, b.amountPaid || 0), 0);
    const unpaid = live.reduce((s, b) => s + getAmountDue(b), 0);
    const overdueBills = live.filter(isOverdue);
    return {
      totalSales,
      paid,
      unpaid,
      overdue: overdueBills.reduce((s, b) => s + getAmountDue(b), 0),
      count: live.length,
      counts: {
        all: rangeBills.length,
        paid: live.filter((b) => getPaymentStatus(b) === 'paid').length,
        unpaid: live.filter((b) => getPaymentStatus(b) !== 'paid').length,
        overdue: overdueBills.length,
        cancelled: rangeBills.length - live.length,
      } as Record<StatusFilter, number>,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeBills, liveRangeBills]);

  // ---- Table rows ----
  const filteredBills = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = rangeBills.filter((b) => {
      const st = getPaymentStatus(b);
      if (status === 'cancelled') {
        if (!b.cancelled) return false;
      } else if (status !== 'all' && b.cancelled) return false;
      if (status === 'paid' && st !== 'paid') return false;
      if (status === 'unpaid' && st === 'paid') return false;
      if (status === 'overdue' && !isOverdue(b)) return false;
      if (!term) return true;
      return (
        b.customerName?.toLowerCase().includes(term) ||
        b.billNo?.toLowerCase().includes(term) ||
        b.billTo?.gstin?.toLowerCase().includes(term) ||
        (b.customerPhone || '').includes(term)
      );
    });
    const val = (b: Bill): string | number => {
      switch (sort.key) {
        case 'number':
          return b.billSeqNum || 0;
        case 'party':
          return (b.customerName || '').toLowerCase();
        case 'due':
          return b.dueDate || '';
        case 'amount':
          return b.total || 0;
        default:
          return billDate(b)?.getTime() || 0;
      }
    };
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => (val(a) > val(b) ? dir : val(a) < val(b) ? -dir : 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeBills, search, status, sort]);

  const handleShare = async (bill: Bill) => {
    try {
      setSharingId(bill.id);
      const file = await generateInvoicePdfFile(bill, businessProfile, `Invoice_${bill.billNo}.pdf`, template);
      const res = await sharePdfOnWhatsApp(file, bill.customerPhone || bill.billTo?.phone);
      if (res === 'downloaded') toast.info('Downloaded the PDF and opened WhatsApp — attach the file in the chat.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to prepare the invoice PDF');
    } finally {
      setSharingId(null);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [search, status, range, sort, bills.length]);

  const pagedBills = filteredBills.slice((page - 1) * pageSize, page * pageSize);

  // Exports exactly what the table shows (date range + status tab + search), all pages.
  const handleExport = () => {
    if (filteredBills.length === 0) {
      toast.warning('No invoices to export for this filter');
      return;
    }
    try {
      const label = [RANGE_LABEL[range], status !== 'all' ? status : ''].filter(Boolean).join(' ');
      exportInvoicesToExcel(filteredBills, label);
      toast.success(`Exported ${filteredBills.length} invoice${filteredBills.length === 1 ? '' : 's'} to Excel`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to export invoices');
    }
  };

  const dueInfo = (b: Bill): { text: string; cls: string } => {
    if (getPaymentStatus(b) === 'paid') return { text: 'Paid', cls: 'text-emerald-600' };
    if (!b.dueDate) return { text: '—', cls: 'text-slate-400' };
    const days = daysBetweenISO(todayISO(), b.dueDate);
    if (days < 0) return { text: `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`, cls: 'text-rose-600' };
    if (days === 0) return { text: 'Due today', cls: 'text-amber-600' };
    return { text: `Due in ${days} day${days === 1 ? '' : 's'}`, cls: 'text-slate-600' };
  };

  const open = (bill: Bill) => {
    setSelectedBill(bill);
    setIsDetailOpen(true);
  };
  const sortBy = (key: SortKey, first: SortDir = 'asc') => setSort((cur) => nextSort(cur, key, first));

  const kpis = [
    { label: 'Total sales', value: stats.totalSales, icon: 'fa-solid fa-chart-simple', tint: 'bg-brand-50 text-brand-600', sub: `${stats.count} invoices` },
    { label: 'Received', value: stats.paid, icon: 'fa-solid fa-circle-check', tint: 'bg-emerald-50 text-emerald-600', sub: `${stats.counts.paid} fully paid` },
    { label: 'Outstanding', value: stats.unpaid, icon: 'fa-solid fa-hourglass-half', tint: 'bg-amber-50 text-amber-600', sub: `${stats.counts.unpaid} not fully paid` },
    { label: 'Overdue', value: stats.overdue, icon: 'fa-solid fa-triangle-exclamation', tint: 'bg-rose-50 text-rose-600', sub: `${stats.counts.overdue} past due date` },
  ];

  const statusPill = (b: Bill) => {
    if (b.cancelled) return <StatusPill tone="slate" icon="fa-solid fa-ban">Cancelled</StatusPill>;
    const st = getPaymentStatus(b);
    if (st === 'paid') return <StatusPill tone="green">Paid</StatusPill>;
    if (isOverdue(b)) return <StatusPill tone="red">Overdue</StatusPill>;
    if (st === 'partial') return <StatusPill tone="amber">Partial</StatusPill>;
    return <StatusPill tone="slate">Unpaid</StatusPill>;
  };

  return (
    <Layout>
      {viewMode === 'create' && !isLoading ? (
        <BillForm
          key={editingBill?.id || fromQuote?.id || 'new'}
          userId={user?.uid || ''}
          products={products}
          customers={customers}
          profile={businessProfile}
          existingBillNos={bills.map((b) => b.billNo)}
          onSave={handleSaveBill}
          onCancel={closeForm}
          initial={editingBill || fromQuote}
          editing={!!editingBill}
          showStock={stockOn}
        />
      ) : (
        <div>
          <PageHeader
            crumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Sales Invoices' }]}
            title="Sales Invoices"
            subtitle="Create, share and track payments on your invoices."
            actions={
              <>
                <div className="w-44">
                  <Select
                    aria-label="Date range"
                    options={(Object.keys(RANGE_LABEL) as RangeKey[]).map((k) => ({ value: k, label: RANGE_LABEL[k] }))}
                    value={range}
                    onChange={(v) => setRange(v as RangeKey)}
                  />
                </div>
                <button
                  onClick={handleExport}
                  disabled={isLoading}
                  className="btn-secondary flex items-center gap-2 h-10 px-3.5 text-sm disabled:opacity-50"
                  title="Download the invoices shown below (this date range, tab and search) as Excel"
                >
                  <FaIcon icon="fa-solid fa-file-excel" size={13} />
                  Export
                </button>
                <button onClick={() => setViewMode('create')} className="btn-primary flex items-center gap-2 h-10 px-4 text-sm">
                  <FaIcon icon="fa-solid fa-plus" size={12} />
                  Create Invoice
                </button>
              </>
            }
          />

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <FaIcon icon="fa-solid fa-spinner" className="animate-spin text-brand-500" size={36} />
              <p className="text-slate-500 font-semibold">Loading invoices...</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* KPI cards */}
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {kpis.map((k) => (
                  <div key={k.label} className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex items-center gap-4">
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${k.tint}`}>
                      <FaIcon icon={k.icon} size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] text-slate-500">{k.label}</p>
                      <p className="text-xl font-bold tracking-tight text-slate-900 truncate">₹{formatShort(k.value)}</p>
                      <p className="text-xs text-slate-400">{k.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              <TableCard
                title={
                  <>
                    All invoices <CountBadge n={filteredBills.length} />
                  </>
                }
                toolbar={
                  <>
                    <SearchInput value={search} onChange={setSearch} placeholder="Search party, invoice no., GSTIN…" className="sm:w-72" />
                    <SegmentedTabs<StatusFilter>
                      ariaLabel="Filter by status"
                      value={status}
                      onChange={setStatus}
                      options={[
                        { value: 'all', label: 'All', count: stats.counts.all },
                        { value: 'paid', label: 'Paid', count: stats.counts.paid },
                        { value: 'unpaid', label: 'Unpaid', count: stats.counts.unpaid },
                        { value: 'overdue', label: 'Overdue', count: stats.counts.overdue },
                        ...(stats.counts.cancelled > 0 || status === 'cancelled'
                          ? [{ value: 'cancelled' as const, label: 'Cancelled', count: stats.counts.cancelled }]
                          : []),
                      ]}
                    />
                  </>
                }
              >
                <div className="overflow-x-auto">
                  <table className={tableCls}>
                    <thead>
                      <tr className={theadRowCls}>
                        <SortTh label="Invoice" active={sort.key === 'number'} dir={sort.dir} onClick={() => sortBy('number', 'desc')} />
                        <SortTh label="Customer" active={sort.key === 'party'} dir={sort.dir} onClick={() => sortBy('party')} />
                        <SortTh label="Issued" active={sort.key === 'date'} dir={sort.dir} onClick={() => sortBy('date', 'desc')} />
                        <SortTh label="Due" active={sort.key === 'due'} dir={sort.dir} onClick={() => sortBy('due')} />
                        <th className={thCls}>Status</th>
                        <SortTh label="Amount" align="right" active={sort.key === 'amount'} dir={sort.dir} onClick={() => sortBy('amount', 'desc')} />
                        <th className={`${thCls} text-right`}>
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedBills.length > 0 ? (
                        pagedBills.map((bill) => {
                          const st = getPaymentStatus(bill);
                          const due = getAmountDue(bill);
                          const d = dueInfo(bill);
                          const issued = billDate(bill);
                          const sub = [bill.customerPhone || bill.billTo?.phone, bill.billTo?.gstin].filter(Boolean).join(' · ');
                          const live = !bill.cancelled;
                          return (
                            <tr key={bill.id} className={`${trCls} ${live ? '' : 'opacity-60'}`}>
                              <td className={tdCls}>
                                <button type="button" onClick={() => open(bill)} className="font-mono text-[13px] font-semibold text-slate-900 hover:text-brand-700 whitespace-nowrap cursor-pointer">
                                  {bill.billNo}
                                </button>
                              </td>
                              <td className={tdCls}>
                                <div className="flex items-center gap-3 min-w-[180px]">
                                  <Initials name={bill.customerName} size="sm" />
                                  <div className="min-w-0">
                                    <div className="font-semibold text-slate-900 truncate capitalize">{(bill.customerName || '').toLowerCase()}</div>
                                    {sub && <div className="text-xs text-slate-400 truncate">{sub}</div>}
                                  </div>
                                </div>
                              </td>
                              <td className={`${tdCls} text-slate-600 whitespace-nowrap`}>
                                {bill.invoiceDate ? formatISODate(bill.invoiceDate) : issued ? issued.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                              </td>
                              <td className={`${tdCls} whitespace-nowrap`}>
                                <div className="text-slate-600">{bill.dueDate ? formatISODate(bill.dueDate) : '—'}</div>
                                {live && st !== 'paid' && d.text !== '—' && <div className={`text-xs font-medium ${d.cls}`}>{d.text}</div>}
                              </td>
                              <td className={tdCls}>{statusPill(bill)}</td>
                              <td className={`${tdCls} text-right whitespace-nowrap`}>
                                <div className={`font-semibold text-slate-900 tabular-nums ${live ? '' : 'line-through'}`}>₹{formatCurrency(bill.total)}</div>
                                {live && due > 0 && st !== 'paid' && <div className="text-xs text-slate-400 tabular-nums">₹{formatCurrency(due)} due</div>}
                              </td>
                              <td className={`${tdCls} text-right`}>
                                <div className="flex items-center justify-end gap-0.5">
                                  <IconAction icon="fa-solid fa-download" title="Download PDF" busy={downloadingId === bill.id} onClick={() => handleDownload(bill)} />
                                  <IconAction icon="fa-brands fa-whatsapp" title="Share on WhatsApp" tone="whatsapp" busy={sharingId === bill.id} onClick={() => handleShare(bill)} />
                                  {live && due > 0 && (
                                    <IconAction
                                      icon="fa-regular fa-bell"
                                      title="Send payment reminder on WhatsApp"
                                      tone="whatsapp"
                                      onClick={() => window.open(invoiceReminderUrl(bill, businessProfile), '_blank', 'noopener')}
                                    />
                                  )}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button type="button" className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800 cursor-pointer" aria-label="More actions">
                                        <FaIcon icon="fa-solid fa-ellipsis" size={14} />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="min-w-[10rem]">
                                      <DropdownMenuItem onSelect={() => open(bill)}>
                                        <FaIcon icon="fa-regular fa-eye" size={13} className="w-4 text-slate-400" />
                                        View
                                      </DropdownMenuItem>
                                      {live && (
                                        <DropdownMenuItem onSelect={() => startEdit(bill)}>
                                          <FaIcon icon="fa-regular fa-pen-to-square" size={13} className="w-4 text-slate-400" />
                                          Edit
                                        </DropdownMenuItem>
                                      )}
                                      {live && st !== 'paid' && (
                                        <DropdownMenuItem onSelect={() => open(bill)}>
                                          <FaIcon icon="fa-solid fa-indian-rupee-sign" size={13} className="w-4 text-slate-400" />
                                          Record payment
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuSeparator />
                                      {live ? (
                                        <DropdownMenuItem onSelect={() => handleCancelBill(bill)}>
                                          <FaIcon icon="fa-solid fa-ban" size={13} className="w-4 text-slate-400" />
                                          Cancel invoice
                                        </DropdownMenuItem>
                                      ) : (
                                        <DropdownMenuItem onSelect={() => handleRestoreBill(bill)}>
                                          <FaIcon icon="fa-solid fa-rotate-left" size={13} className="w-4 text-slate-400" />
                                          Restore invoice
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem variant="destructive" onSelect={() => handleDeleteBill(bill)}>
                                        <FaIcon icon="fa-regular fa-trash-can" size={13} className="w-4" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <TableEmpty
                          colSpan={7}
                          icon={search || status !== 'all' ? 'fa-solid fa-magnifying-glass' : 'fa-solid fa-file-circle-plus'}
                          title={search || status !== 'all' ? 'No matching invoices' : 'No invoices in this period'}
                          text={search || status !== 'all' ? 'Try a different filter, party name or invoice number.' : 'Create your first sales invoice to start tracking payments.'}
                          action={
                            !search && status === 'all' ? (
                              <button onClick={() => setViewMode('create')} className="btn-primary flex items-center gap-2 text-sm">
                                <FaIcon icon="fa-solid fa-plus" size={12} />
                                Create Invoice
                              </button>
                            ) : undefined
                          }
                        />
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  page={page}
                  pageSize={pageSize}
                  total={filteredBills.length}
                  onPageChange={setPage}
                  onPageSizeChange={(sz) => {
                    setPageSize(sz);
                    setPage(1);
                  }}
                  itemLabel="invoices"
                />
              </TableCard>
            </div>
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
        onEdit={startEdit}
      />
    </Layout>
  );
};
