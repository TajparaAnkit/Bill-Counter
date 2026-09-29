import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/shared/Layout';
import { BillDetailModal } from '../components/Bills/BillDetailModal';
import { FaIcon } from '../components/shared/FaIcon';
import { Select } from '../components/ui/Select';
import { AgingBar, RankBars, SERIES, SalesChart, Sparkline } from '../components/Dashboard/Charts';
import { useAuth } from '../hooks/useAuth';
import { useFeature } from '../hooks/useAccount';
import { useToast } from '../hooks/useToast';
import { getBills, getBusinessProfile, getProducts } from '../services/db';
import { isLowStock } from '../utils/stock';
import { Bill, UserProfile } from '../types';
import { PAYMENT_META, getAmountDue, getPaymentStatus, paymentMethodLabel } from '../utils/payment';
import { fmtLedgerDate, toISODate } from '../utils/ledger';
import { invoiceReminderUrl } from '../utils/reminder';
import { isLiveBill } from '../utils/docs';
import {
  PERIOD_OPTIONS,
  PeriodKey,
  buildSeries,
  computeAging,
  computeKpis,
  daysOverdue,
  gstSummary,
  inr,
  overdueBills,
  paymentModes,
  pctChange,
  periodFor,
  prevLabel,
  recentActivity,
  topCustomers,
  topProducts,
} from '../utils/dashboard';

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

const Card: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode; className?: string; children: React.ReactNode }> = ({
  title,
  subtitle,
  action,
  className = '',
  children,
}) => (
  <section className={`bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 ${className}`}>
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        <h2 className="text-sm font-bold text-slate-800">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
);

const Empty: React.FC<{ icon: string; text: string; cta?: { to: string; label: string } }> = ({ icon, text, cta }) => (
  <div className="flex flex-col items-center justify-center text-center py-8 gap-2">
    <FaIcon icon={icon} size={22} className="text-slate-300" />
    <p className="text-xs text-slate-400 max-w-55">{text}</p>
    {cta && (
      <Link to={cta.to} className="text-xs font-semibold text-brand-700 hover:underline">
        {cta.label} →
      </Link>
    )}
  </div>
);

// Change vs the previous period, styled for the gradient hero.
const Delta: React.FC<{ value: number | null; label: string }> = ({ value, label }) => {
  if (value === null) return <span className="text-white/60">No data {label.replace(/^vs /, 'for ')}</span>;
  const up = value >= 0;
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-flex items-center gap-0.5 font-semibold ${up ? 'text-emerald-200' : 'text-rose-200'}`}>
        <FaIcon icon={up ? 'fa-solid fa-arrow-trend-up' : 'fa-solid fa-arrow-trend-down'} size={10} />
        {up ? '+' : '−'}
        {Math.abs(value).toFixed(value !== 0 && Math.abs(value) < 10 ? 1 : 0)}%
      </span>
      <span className="text-white/60">{label}</span>
    </span>
  );
};

// Glass KPI tile inside the gradient hero.
const HeroTile: React.FC<{
  to: string;
  label: string;
  icon: string;
  value: string;
  foot: React.ReactNode;
  spark?: number[];
  meter?: { pct: number; caption: string };
}> = ({ to, label, icon, value, foot, spark, meter }) => (
  <Link to={to} className="group flex flex-col rounded-2xl bg-white/10 ring-1 ring-inset ring-white/15 backdrop-blur-sm p-4 hover:bg-white/15 transition">
    <span className="flex items-center gap-2 text-[13px] font-medium text-white/80">
      <FaIcon icon={icon} size={12} />
      {label}
    </span>
    <span className="mt-1.5 text-2xl sm:text-[28px] font-bold tracking-tight leading-tight">{value}</span>
    <span className="mt-1 text-xs">{foot}</span>
    {spark && (
      <span className="mt-2 block opacity-90">
        <Sparkline values={spark} color="#ffffff" />
      </span>
    )}
    {meter && (
      <span className="mt-auto pt-3 block">
        <span className="block h-1.5 rounded-full bg-white/20">
          <span className="block h-1.5 rounded-full bg-white" style={{ width: `${Math.min(100, Math.max(0, meter.pct))}%` }} />
        </span>
        <span className="mt-1 block text-[11px] text-white/65">{meter.caption}</span>
      </span>
    )}
  </Link>
);

const Skeleton: React.FC = () => (
  <div className="space-y-4 animate-pulse" aria-label="Loading dashboard">
    <div className="h-56 rounded-2xl bg-brand-100" />
    <div className="h-72 rounded-xl bg-white border border-slate-200" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-56 rounded-xl bg-white border border-slate-200" />
      ))}
    </div>
  </div>
);

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

const QUICK_ACTIONS = [
  { to: '/bills?new=1', label: 'Sales Invoice', icon: 'fa-solid fa-file-invoice' },
  { to: '/customers?new=1', label: 'Customer', icon: 'fa-solid fa-user-plus' },
  { to: '/products?new=1', label: 'Product', icon: 'fa-solid fa-box' },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const stockOn = useFeature('stock');
  const [lowStock, setLowStock] = useState(0);
  const [bills, setBills] = useState<Bill[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        setIsLoading(true);
        const [b, p] = await Promise.all([getBills(user.uid), getBusinessProfile(user.uid)]);
        setBills(b.filter(isLiveBill));
        setProfile(p);
        if (stockOn) getProducts(user.uid).then((ps) => setLowStock(ps.filter(isLowStock).length)).catch(() => setLowStock(0));
      } catch (err) {
        console.error(err);
        toast.error('Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [user]);

  return (
    <Layout>
      {!isLoading && lowStock > 0 && (
        <Link
          to="/products?stock=low"
          className="mb-4 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 hover:bg-rose-100/70"
        >
          <FaIcon icon="fa-solid fa-triangle-exclamation" size={14} />
          <span>
            <strong>{lowStock}</strong> product{lowStock === 1 ? ' is' : 's are'} low on stock
          </span>
          <span className="ml-auto font-semibold">View →</span>
        </Link>
      )}
      {isLoading ? <Skeleton /> : <DashboardView bills={bills} profile={profile} onBillsChange={setBills} />}
    </Layout>
  );
};

// Presentational dashboard: everything is derived from `bills` + `profile`.
export const DashboardView: React.FC<{
  bills: Bill[];
  profile: UserProfile | null;
  onBillsChange: React.Dispatch<React.SetStateAction<Bill[]>>;
}> = ({ bills, profile, onBillsChange }) => {
  const navigate = useNavigate();
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  const [periodKey, setPeriodKey] = useState<PeriodKey>('this_month');
  const [customFrom, setCustomFrom] = useState(() => toISODate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [customTo, setCustomTo] = useState(() => toISODate(new Date()));
  const [productBy, setProductBy] = useState<'amount' | 'qty'>('amount');

  const period = useMemo(() => periodFor(periodKey, { from: customFrom, to: customTo }), [periodKey, customFrom, customTo]);
  const kpis = useMemo(() => computeKpis(bills, period), [bills, period]);
  const series = useMemo(() => buildSeries(bills, period), [bills, period]);
  const aging = useMemo(() => computeAging(bills), [bills]);
  const customers = useMemo(() => topCustomers(bills, period), [bills, period]);
  const products = useMemo(() => topProducts(bills, period, productBy), [bills, period, productBy]);
  const modes = useMemo(() => paymentModes(bills, period), [bills, period]);
  const gst = useMemo(() => gstSummary(bills, period), [bills, period]);
  const overdue = useMemo(() => overdueBills(bills), [bills]);
  const activity = useMemo(() => recentActivity(bills), [bills]);

  const statementAllowed = useFeature('partyStatement');
  const showGst = !!profile?.taxEnabled || !!profile?.gstRegistered || gst.total > 0;
  const statementOn = statementAllowed && !!profile?.partyStatementEnabled;
  const cmp = prevLabel(periodKey, period);
  const periodText =
    periodKey === 'today' ? fmtLedgerDate(period.from) : `${fmtLedgerDate(period.from)} – ${fmtLedgerDate(period.to)}`;

  const handleUpdated = (updated: Bill) => {
    onBillsChange((bs) => bs.map((b) => (b.id === updated.id ? updated : b)));
    setSelectedBill(updated);
  };

  const businessName = profile?.businessName?.trim();

  return (
    <>
      <div className="space-y-4 animate-slide-up">
        {/* ===== Hero: greeting, period, quick actions, KPIs ===== */}
        <section className="relative overflow-hidden rounded-2xl bg-linear-to-br from-brand-600 via-brand-500 to-blue-600 px-5 py-6 sm:px-8 sm:py-7 text-white shadow-lg shadow-brand-600/20">
          <span aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
          <span aria-hidden="true" className="pointer-events-none absolute left-1/3 -bottom-28 h-64 w-64 rounded-full bg-blue-300/20 blur-3xl" />
          <div className="relative flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {greeting()}
                {businessName ? `, ${businessName}` : ''}
              </h1>
              <p className="mt-1 text-sm text-white/80">
                Here&apos;s how your business is doing · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} · Showing {periodText}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {QUICK_ACTIONS.map((a) => (
                <Link key={a.to} to={a.to} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white/15 hover:bg-white/25 ring-1 ring-inset ring-white/20 text-xs font-semibold">
                  <FaIcon icon="fa-solid fa-plus" size={10} />
                  {a.label}
                </Link>
              ))}
              <div className="w-48">
                <Select aria-label="Dashboard period" size="sm" options={PERIOD_OPTIONS} value={periodKey} onChange={(v) => setPeriodKey(v as PeriodKey)} />
              </div>
            </div>
          </div>
          {periodKey === 'custom' && (
            <div className="relative mt-3 flex items-center justify-end gap-2 text-xs">
              <input type="date" aria-label="From date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="px-2.5 py-1.5 bg-white text-slate-800 rounded-lg" />
              <span className="text-white/70">to</span>
              <input type="date" aria-label="To date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="px-2.5 py-1.5 bg-white text-slate-800 rounded-lg" />
            </div>
          )}

          {bills.length > 0 && (
            <div className="relative mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <HeroTile
                to="/bills"
                label="Sales"
                icon="fa-solid fa-chart-line"
                value={inr(kpis.sales)}
                foot={<Delta value={pctChange(kpis.sales, kpis.salesPrev)} label={cmp} />}
                spark={series.map((x) => x.sales)}
              />
              <HeroTile
                to="/bills?status=paid"
                label="Payments received"
                icon="fa-solid fa-hand-holding-dollar"
                value={inr(kpis.received)}
                foot={<Delta value={pctChange(kpis.received, kpis.receivedPrev)} label={cmp} />}
                spark={series.map((x) => x.received)}
              />
              <HeroTile
                to="/bills?status=unpaid"
                label="To collect"
                icon="fa-solid fa-clock"
                value={inr(kpis.toCollect)}
                foot={
                  kpis.overdueCount > 0 ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-rose-100">
                      <FaIcon icon="fa-solid fa-circle-exclamation" size={10} />
                      {kpis.overdueCount} overdue · {inr(kpis.overdueAmount)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-100">
                      <FaIcon icon="fa-solid fa-circle-check" size={10} /> Nothing overdue
                    </span>
                  )
                }
                meter={
                  kpis.toCollect > 0
                    ? { pct: (kpis.overdueAmount / kpis.toCollect) * 100, caption: `${Math.round((kpis.overdueAmount / kpis.toCollect) * 100)}% of dues are past their due date` }
                    : undefined
                }
              />
              <HeroTile
                to="/bills"
                label="Invoices"
                icon="fa-regular fa-file-lines"
                value={kpis.invoices.toLocaleString('en-IN')}
                foot={<span className="text-white/70">{kpis.invoicesUnpaid === 0 ? 'All paid' : `${kpis.invoicesUnpaid} not fully paid`}</span>}
                meter={
                  kpis.invoices > 0
                    ? { pct: ((kpis.invoices - kpis.invoicesUnpaid) / kpis.invoices) * 100, caption: `${kpis.invoices - kpis.invoicesUnpaid} of ${kpis.invoices} fully paid` }
                    : undefined
                }
              />
            </div>
          )}
        </section>

        {bills.length === 0 ? (
          /* ===== First-run empty state ===== */
          <section className="bg-white rounded-xl border border-slate-200 shadow-xs p-8 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 grid place-items-center">
              <FaIcon icon="fa-solid fa-chart-column" size={24} />
            </div>
            <h2 className="mt-4 text-base font-bold text-slate-800">Your dashboard fills up as you bill</h2>
            <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">Sales, payments received, dues and your best customers and products appear here after your first invoice.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link to="/products?new=1" className="btn-secondary text-sm">1. Add a product</Link>
              <Link to="/customers?new=1" className="btn-secondary text-sm">2. Add a customer</Link>
              <Link to="/bills?new=1" className="btn-primary text-sm">3. Create your first invoice</Link>
            </div>
          </section>
        ) : (
          <>
            {/* ===== Sales vs Payments ===== */}
            <Card title="Sales vs payments received" subtitle={series[0]?.key.split('-').length === 2 ? 'Monthly totals · hover a column for details' : 'Daily totals · hover a column for details'}>
              <SalesChart data={series} />
            </Card>

            {/* ===== Dues, payment modes, GST ===== */}
            <div className={`grid grid-cols-1 gap-4 ${showGst ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
              <Card
                title="Outstanding by age"
                subtitle={`${inr(kpis.toCollect)} to collect, all dates`}
                action={
                  <Link to="/bills?status=unpaid" className="text-xs font-semibold text-brand-700 hover:underline">
                    View all
                  </Link>
                }
              >
                {kpis.toCollect > 0 ? <AgingBar data={aging} /> : <Empty icon="fa-solid fa-circle-check" text="All invoices are paid. Nothing to collect." />}
              </Card>

              <Card title="How customers pay" subtitle="Payments received in this period">
                {modes.length ? (
                  <RankBars rows={modes} color={SERIES.received} />
                ) : (
                  <Empty icon="fa-solid fa-wallet" text="No payments received in this period." />
                )}
              </Card>

              {showGst && (
                <Card title="GST summary" subtitle="Tax on invoices in this period">
                  <div className="space-y-2.5 text-sm">
                    {[
                      ['Taxable amount', gst.taxable],
                      ['CGST', gst.cgst],
                      ['SGST', gst.sgst],
                      ['IGST', gst.igst],
                      ...(gst.other > 0 ? [['Tax (older invoices)', gst.other] as [string, number]] : []),
                    ].map(([k, v]) => (
                      <div key={k as string} className="flex justify-between">
                        <span className="text-slate-500">{k}</span>
                        <span className="font-semibold text-slate-800 tabular-nums">{inr(v as number, 2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2.5 border-t border-slate-200 font-bold">
                      <span className="text-slate-700">Total GST</span>
                      <span className="text-slate-900 tabular-nums">{inr(gst.total, 2)}</span>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* ===== Top customers & products ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card title="Top customers" subtitle={statementOn ? 'By sales in this period · click to open their statement' : 'By sales in this period'}>
                {customers.length ? (
                  <RankBars
                    rows={customers}
                    avatar
                    onSelect={statementOn ? (r) => r.customerId && navigate(`/customers/${r.customerId}/statement`) : undefined}
                  />
                ) : (
                  <Empty icon="fa-solid fa-users" text="No sales in this period." cta={{ to: '/bills?new=1', label: 'Create an invoice' }} />
                )}
              </Card>

              <Card
                title="Top products"
                subtitle={productBy === 'amount' ? 'By sales amount in this period' : 'By quantity sold in this period'}
                action={
                  <div className="flex rounded-md border border-slate-200 p-0.5 text-[11px] font-semibold" role="group" aria-label="Rank products by">
                    {(['amount', 'qty'] as const).map((k) => (
                      <button
                        key={k}
                        onClick={() => setProductBy(k)}
                        aria-pressed={productBy === k}
                        className={`px-2 py-0.5 rounded cursor-pointer ${productBy === k ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        {k === 'amount' ? 'Amount' : 'Quantity'}
                      </button>
                    ))}
                  </div>
                }
              >
                {products.length ? (
                  <RankBars rows={products} avatar format={productBy === 'amount' ? (v) => inr(v) : (v) => v.toLocaleString('en-IN')} />
                ) : (
                  <Empty icon="fa-solid fa-box-open" text="No products sold in this period." />
                )}
              </Card>
            </div>

            {/* ===== Overdue & activity ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card
                title="Overdue invoices"
                subtitle="Most overdue first"
                action={
                  <Link to="/bills?status=unpaid" className="text-xs font-semibold text-brand-700 hover:underline">
                    View all
                  </Link>
                }
              >
                {overdue.length ? (
                  <div className="divide-y divide-slate-100 -my-2">
                    {overdue.map((b) => {
                      const late = daysOverdue(b);
                      return (
                        <div key={b.id} className="flex items-center gap-3 py-2.5">
                          <button onClick={() => setSelectedBill(b)} className="flex-1 min-w-0 text-left cursor-pointer group">
                            <div className="text-sm font-semibold text-slate-800 truncate group-hover:text-brand-700">{b.customerName}</div>
                            <div className="text-xs text-slate-400">
                              {b.billNo} ·{' '}
                              <span className={late > 60 ? 'text-rose-600 font-semibold' : late > 30 ? 'text-orange-600 font-semibold' : 'text-amber-700 font-semibold'}>
                                {late} day{late === 1 ? '' : 's'} overdue
                              </span>
                            </div>
                          </button>
                          <span className="text-sm font-bold text-slate-800 tabular-nums">{inr(getAmountDue(b))}</span>
                          <a
                            href={invoiceReminderUrl(b, profile)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#25D366] hover:bg-[#1ebe5d] text-white text-xs font-semibold"
                            title="Send a payment reminder on WhatsApp"
                          >
                            <FaIcon icon="fa-brands fa-whatsapp" size={13} />
                            <span className="hidden sm:inline">Remind</span>
                          </a>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Empty icon="fa-solid fa-circle-check" text="No overdue invoices. Great job collecting on time!" />
                )}
              </Card>

              <Card title="Recent activity" subtitle="Latest invoices and payments">
                <div className="divide-y divide-slate-100 -my-2">
                  {activity.map((a) => {
                    const isPay = a.kind === 'payment';
                    const meta = PAYMENT_META[getPaymentStatus(a.bill)];
                    return (
                      <button
                        key={`${a.kind}-${a.bill.id}-${isPay ? a.payment.date.getTime() + a.payment.amount : ''}`}
                        onClick={() => setSelectedBill(a.bill)}
                        className="w-full flex items-center gap-3 py-2.5 text-left cursor-pointer group"
                      >
                        <span className={`grid place-items-center w-9 h-9 shrink-0 rounded-lg ${isPay ? 'bg-emerald-50 text-emerald-600' : 'bg-brand-50 text-brand-600'}`}>
                          <FaIcon icon={isPay ? 'fa-solid fa-indian-rupee-sign' : 'fa-solid fa-file-invoice'} size={14} />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-semibold text-slate-800 truncate group-hover:text-brand-700">
                            {isPay ? `Payment in · ${a.bill.customerName}` : `${a.bill.billNo} · ${a.bill.customerName}`}
                          </span>
                          <span className="block text-xs text-slate-400">
                            {fmtLedgerDate(a.date)}
                            {isPay ? ` · ${paymentMethodLabel(a.payment.method) || 'Payment'} for ${a.bill.billNo}` : ''}
                          </span>
                        </span>
                        <span className="text-right shrink-0">
                          <span className={`block text-sm font-bold tabular-nums ${isPay ? 'text-emerald-700' : 'text-slate-800'}`}>
                            {isPay ? '+' : ''}
                            {inr(isPay ? a.payment.amount : a.bill.total || 0)}
                          </span>
                          {!isPay && (
                            <span className={`inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${meta.badgeClass}`}>
                              <FaIcon icon={meta.icon} size={9} />
                              {meta.label}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Card>
            </div>
          </>
        )}
      </div>

      <BillDetailModal
        isOpen={!!selectedBill}
        onClose={() => setSelectedBill(null)}
        bill={selectedBill}
        businessProfile={profile}
        onUpdated={handleUpdated}
      />
    </>
  );
};
