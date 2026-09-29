import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Layout } from '../components/shared/Layout';
import { FaIcon } from '../components/shared/FaIcon';
import { Select } from '../components/ui/Select';
import { PageHeader, SegmentedTabs } from '../components/ui/Table';
import { useAuth } from '../hooks/useAuth';
import { useFeature } from '../hooks/useAccount';
import { useToast } from '../hooks/useToast';
import { getBills, getBusinessProfile, getCustomer } from '../services/db';
import { Bill, Customer, UserProfile } from '../types';
import { isLiveBill } from '../utils/docs';
import { formatCurrency } from '../utils/formatters';
import { PAYMENT_META, getAmountDue, getPaymentStatus } from '../utils/payment';
import {
  RANGE_OPTIONS,
  RangePreset,
  billDate,
  billsForParty,
  buildLedger,
  fmtLedgerDate,
  isoToDate,
  rangeFor,
  toISODate,
} from '../utils/ledger';
import { PdfStatement, generateStatementPDF, generateStatementPdfFile, printStatementPDF } from '../utils/pdf';
import { sharePdfOnWhatsApp } from '../utils/share';

type Tab = 'transactions' | 'profile' | 'ledger';

const TABS: { id: Tab; label: string }[] = [
  { id: 'transactions', label: 'Transactions' },
  { id: 'profile', label: 'Profile' },
  { id: 'ledger', label: 'Ledger (Statement)' },
];

const dateInput =
  'px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600';
const toolBtn =
  'inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors disabled:opacity-60 cursor-pointer';

// Balance in accounting form: "₹1,200.00 Dr" (to collect) / "Cr" (to pay).
const drCr = (n: number) => (Math.abs(n) < 0.005 ? formatCurrency(0) : `${formatCurrency(Math.abs(n))} ${n > 0 ? 'Dr' : 'Cr'}`);

const InfoTile: React.FC<{ label: string; value: React.ReactNode; tone?: 'green' | 'red' | 'default' }> = ({ label, value, tone = 'default' }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-xs px-4 py-3">
    <p className="text-xs font-semibold text-slate-500">{label}</p>
    <p className={`mt-1 text-base font-bold ${tone === 'green' ? 'text-emerald-600' : tone === 'red' ? 'text-rose-600' : 'text-slate-800'}`}>{value}</p>
  </div>
);

export const CustomerStatementPage: React.FC = () => {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const statementAllowed = useFeature('partyStatement');
  const toast = useToast();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('ledger');

  const [preset, setPreset] = useState<RangePreset>('this_fy');
  const initial = rangeFor('this_fy');
  const [customFrom, setCustomFrom] = useState(toISODate(initial.from || new Date()));
  const [customTo, setCustomTo] = useState(toISODate(initial.to));
  const [busy, setBusy] = useState<'download' | 'print' | 'share' | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        setIsLoading(true);
        const [c, b, p] = await Promise.all([getCustomer(id), getBills(user.uid), getBusinessProfile(user.uid)]);
        setCustomer(c && c.userId === user.uid ? c : null);
        setBills(b.filter(isLiveBill));
        setProfile(p);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load party statement');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [user, id]);

  const range = useMemo(() => {
    if (preset !== 'custom') return rangeFor(preset);
    const from = isoToDate(customFrom);
    const to = isoToDate(customTo) || new Date();
    return from && from > to ? { from: to, to: from } : { from, to };
  }, [preset, customFrom, customTo]);

  const partyBills = useMemo(
    () => (customer ? billsForParty(customer, bills).sort((a, b) => billDate(b).getTime() - billDate(a).getTime()) : []),
    [customer, bills]
  );
  const ledger = useMemo(() => (customer ? buildLedger(customer, bills, range.from, range.to) : null), [customer, bills, range]);
  // Overall balance (all time) for the header tile, independent of the period filter.
  const overall = useMemo(() => (customer ? buildLedger(customer, bills, null, new Date()) : null), [customer, bills]);

  const periodLabel = ledger
    ? `${ledger.from ? fmtLedgerDate(ledger.from) : fmtLedgerDate(ledger.entries[0].date)} - ${fmtLedgerDate(ledger.to)}`
    : '';

  const statement = (): PdfStatement | null =>
    customer && ledger
      ? {
          party: { name: customer.name, phone: customer.phone, address: customer.address, gstin: customer.gstin },
          periodLabel,
          entries: ledger.entries,
          totalDebit: ledger.totalDebit,
          totalCredit: ledger.totalCredit,
          closingBalance: ledger.closingBalance,
        }
      : null;

  const filename = () => `Statement_${(customer?.name || 'Party').replace(/[^\w]+/g, '_')}.pdf`;

  const handleDownload = async () => {
    const st = statement();
    if (!st) return;
    try {
      setBusy('download');
      await generateStatementPDF(st, profile, filename());
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate the statement PDF');
    } finally {
      setBusy(null);
    }
  };

  const handlePrint = async () => {
    const st = statement();
    if (!st) return;
    try {
      setBusy('print');
      await printStatementPDF(st, profile);
    } catch (err) {
      console.error(err);
      toast.error('Failed to open the print preview');
    } finally {
      setBusy(null);
    }
  };

  const handleShare = async () => {
    const st = statement();
    if (!st) return;
    try {
      setBusy('share');
      const file = await generateStatementPdfFile(st, profile, filename());
      const res = await sharePdfOnWhatsApp(file, customer?.phone);
      if (res === 'downloaded') toast.info('Attaching PDFs isn’t supported in this browser — downloaded the statement and opened WhatsApp so you can attach it.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to prepare the statement PDF');
    } finally {
      setBusy(null);
    }
  };

  // ---------- states ----------
  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <FaIcon icon="fa-solid fa-spinner" className="animate-spin text-brand-600" size={40} />
          <p className="text-slate-500 font-semibold">Loading party statement...</p>
        </div>
      </Layout>
    );
  }

  if (!statementAllowed || !profile?.partyStatementEnabled || !customer || !ledger || !overall) {
    const notInPlan = !statementAllowed;
    const disabled = notInPlan || !profile?.partyStatementEnabled;
    return (
      <Layout>
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs px-6 py-16 flex flex-col items-center text-center space-y-4 animate-slide-up">
          <div className="w-16 h-16 rounded-lg bg-slate-50 flex items-center justify-center">
            <FaIcon icon={disabled ? 'fa-solid fa-toggle-off' : 'fa-solid fa-user-slash'} size={26} className="text-slate-300" />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-slate-600">{disabled ? 'Party Statement is turned off' : 'Party not found'}</p>
            <p className="text-sm text-slate-400 max-w-sm">
              {notInPlan
                ? 'Party Statement is not included in your plan. Contact us to upgrade.'
                : disabled
                ? 'Enable “Party Statement (Ledger)” under Business Settings → Features to view customer-wise statements.'
                : 'This party may have been deleted.'}
            </p>
          </div>
          <Link to={disabled && !notInPlan ? '/settings' : '/customers'} className="btn-primary text-sm">
            {disabled && !notInPlan ? 'Open Settings' : 'Back to Customers'}
          </Link>
        </div>
      </Layout>
    );
  }

  const closingTone = overall.closingBalance > 0 ? 'green' : overall.closingBalance < 0 ? 'red' : 'default';
  const sellerName = profile.businessName || 'Your Business';

  return (
    <Layout>
      <div className="space-y-5 animate-slide-up">
        <PageHeader
          crumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Customers', to: '/customers' }, { label: customer.name }]}
          title={customer.name}
          subtitle={`${customer.partyType === 'supplier' ? 'Supplier' : 'Customer'} · statement, transactions and profile`}
          actions={
            <Link to="/bills?new=1" className="btn-primary flex items-center gap-2 h-10 px-4 text-sm">
              <FaIcon icon="fa-solid fa-plus" size={12} />
              Create Sales Invoice
            </Link>
          }
        />

        {/* Party summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <InfoTile label="Mobile Number" value={customer.phone || '—'} />
          <InfoTile label="Credit Period" value={customer.creditPeriod ? `${customer.creditPeriod} Days` : '—'} />
          <InfoTile label="Credit Limit" value={customer.creditLimit ? formatCurrency(customer.creditLimit) : '—'} />
          <InfoTile
            label={overall.closingBalance < 0 ? 'Closing Balance (To Pay)' : 'Closing Balance (To Collect)'}
            value={formatCurrency(Math.abs(overall.closingBalance))}
            tone={closingTone}
          />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Tabs */}
          <div className="px-5 pt-5 pb-1">
            <SegmentedTabs<Tab> ariaLabel="Customer sections" value={tab} onChange={setTab} options={TABS.map((t) => ({ value: t.id, label: t.label }))} />
          </div>

          {/* ===== Ledger (Statement) ===== */}
          {tab === 'ledger' && (
            <>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 border-b border-slate-200">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="w-52">
                    <Select aria-label="Statement period" size="sm" options={RANGE_OPTIONS} value={preset} onChange={(v) => setPreset(v as RangePreset)} />
                  </div>
                  {preset === 'custom' && (
                    <div className="flex items-center gap-2">
                      <input type="date" aria-label="From date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className={dateInput} />
                      <span className="text-slate-400 text-xs">to</span>
                      <input type="date" aria-label="To date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className={dateInput} />
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={handleDownload} disabled={!!busy} className={toolBtn}>
                    <FaIcon icon={busy === 'download' ? 'fa-solid fa-spinner' : 'fa-solid fa-download'} size={14} className={busy === 'download' ? 'animate-spin' : ''} />
                    Download PDF
                  </button>
                  <button onClick={handlePrint} disabled={!!busy} className={toolBtn}>
                    <FaIcon icon={busy === 'print' ? 'fa-solid fa-spinner' : 'fa-solid fa-print'} size={14} className={busy === 'print' ? 'animate-spin' : ''} />
                    Print
                  </button>
                  <button
                    onClick={handleShare}
                    disabled={!!busy}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#25D366] hover:bg-[#1ebe5d] text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    <FaIcon icon={busy === 'share' ? 'fa-solid fa-spinner' : 'fa-brands fa-whatsapp'} size={15} className={busy === 'share' ? 'animate-spin' : ''} />
                    Share
                  </button>
                </div>
              </div>

              {/* Statement preview (paper) */}
              <div className="bg-slate-100 p-3 sm:p-6">
                <div className="mx-auto max-w-4xl bg-white rounded-md border border-slate-200 shadow-sm p-5 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between gap-3 border-b border-slate-200 pb-4">
                    <div className="flex items-center gap-3">
                      {profile.logoUrl && <img src={profile.logoUrl} alt="" className="w-12 h-12 object-contain" />}
                      <div>
                        <p className="text-lg font-bold text-brand-700">{sellerName}</p>
                        <p className="text-xs text-slate-500">
                          {[profile.phone && `Mobile: ${profile.phone}`, profile.gstRegistered !== false && profile.gstin && `GSTIN: ${profile.gstin}`].filter(Boolean).join('  |  ')}
                        </p>
                      </div>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-base font-bold text-slate-800 tracking-wide">PARTY LEDGER</p>
                      <p className="text-xs text-slate-500">{periodLabel}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="text-sm">
                      <p className="text-xs font-bold text-slate-400">To,</p>
                      <p className="font-bold text-slate-800 uppercase">{customer.name}</p>
                      {customer.address && <p className="text-slate-600 max-w-xs whitespace-pre-line">{customer.address}</p>}
                      {customer.phone && <p className="text-slate-600">Mobile: {customer.phone}</p>}
                      {customer.gstin && <p className="text-slate-600 font-mono text-xs">GSTIN: {customer.gstin}</p>}
                    </div>
                    <div className="rounded-lg bg-brand-100 px-5 py-3 sm:min-w-56 self-start">
                      <p className="text-xs font-bold text-slate-500">{ledger.closingBalance < 0 ? 'Total Payable' : 'Total Receivable'}</p>
                      <p className="text-xl font-bold text-slate-800">{formatCurrency(Math.abs(ledger.closingBalance))}</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto -mx-1">
                    <table className="w-full min-w-[640px] text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-brand-50 text-[11px] font-semibold text-brand-900 uppercase tracking-wide">
                          <th className="px-3 py-2.5">Date</th>
                          <th className="px-3 py-2.5">Voucher</th>
                          <th className="px-3 py-2.5">Sr No</th>
                          <th className="px-3 py-2.5 text-right">Credit</th>
                          <th className="px-3 py-2.5 text-right">Debit</th>
                          <th className="px-3 py-2.5 text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {ledger.entries.map((e, i) => (
                          <tr key={i} className={e.voucher === 'Opening Balance' ? 'bg-slate-50/60' : 'hover:bg-brand-50/30'}>
                            <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{fmtLedgerDate(e.date)}</td>
                            <td className="px-3 py-2.5 font-semibold text-slate-700">{e.voucher}</td>
                            <td className="px-3 py-2.5 text-slate-500 font-mono text-xs">{e.srNo || '—'}</td>
                            <td className="px-3 py-2.5 text-right text-emerald-600">{e.credit ? formatCurrency(e.credit) : '—'}</td>
                            <td className="px-3 py-2.5 text-right text-rose-600">{e.debit ? formatCurrency(e.debit) : '—'}</td>
                            <td className="px-3 py-2.5 text-right font-bold text-slate-800 whitespace-nowrap">{drCr(e.balance)}</td>
                          </tr>
                        ))}
                        {ledger.entries.length === 1 && (
                          <tr>
                            <td colSpan={6} className="px-3 py-10 text-center text-sm text-slate-400">
                              No invoices or payments for this party in the selected period.
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-100 font-bold text-slate-800">
                          <td className="px-3 py-2.5" colSpan={3}>Total</td>
                          <td className="px-3 py-2.5 text-right">{formatCurrency(ledger.totalCredit)}</td>
                          <td className="px-3 py-2.5 text-right">{formatCurrency(ledger.totalDebit)}</td>
                          <td className="px-3 py-2.5 text-right whitespace-nowrap">{drCr(ledger.closingBalance)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="flex justify-end">
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">
                        Closing Balance: <span className="ml-2">{drCr(ledger.closingBalance)}</span>
                      </p>
                      <p className="text-xs text-slate-500">
                        {ledger.closingBalance < 0 ? 'Amount to be paid to the party' : 'Amount to be collected from the party'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ===== Transactions ===== */}
          {tab === 'transactions' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-y border-slate-200 text-xs font-medium text-slate-500">
                    <th className="p-4">Date</th>
                    <th className="p-4">Transaction Type</th>
                    <th className="p-4">Transaction Number</th>
                    <th className="p-4 text-right">Amount</th>
                    <th className="p-4 text-right">Balance Due</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {partyBills.length ? (
                    partyBills.map((b) => {
                      const meta = PAYMENT_META[getPaymentStatus(b)];
                      return (
                        <tr key={b.id} className="hover:bg-brand-50/30 transition-colors text-sm">
                          <td className="p-4 text-slate-600">{fmtLedgerDate(billDate(b))}</td>
                          <td className="p-4 font-semibold text-slate-700">Sales Invoice</td>
                          <td className="p-4 font-mono text-xs text-slate-500">{b.billNo}</td>
                          <td className="p-4 text-right font-semibold text-slate-800">{formatCurrency(b.total || 0)}</td>
                          <td className="p-4 text-right text-slate-600">{formatCurrency(getAmountDue(b))}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${meta.badgeClass}`}>
                              <FaIcon icon={meta.icon} size={11} />
                              {meta.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center text-sm text-slate-400">
                        No transactions with this party yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ===== Profile ===== */}
          {tab === 'profile' && (
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              {[
                ['Party Name', customer.name],
                ['Party Type', customer.partyType === 'supplier' ? 'Supplier' : 'Customer'],
                ['Mobile Number', customer.phone],
                ['Email', customer.email],
                ['GSTIN', customer.gstin],
                ['PAN Number', customer.pan],
                ['Category', customer.category],
                [
                  'Opening Balance',
                  customer.openingBalance
                    ? `${formatCurrency(customer.openingBalance)} (${customer.openingBalanceType === 'to_pay' ? 'To Pay' : 'To Collect'})`
                    : '',
                ],
                ['Billing Address', customer.address],
                ['Shipping Address', customer.shippingSameAsBilling !== false ? customer.address : customer.shippingAddress],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs font-semibold text-slate-500">{k}</p>
                  <p className="mt-0.5 text-slate-800 font-medium whitespace-pre-line">{v || '—'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
