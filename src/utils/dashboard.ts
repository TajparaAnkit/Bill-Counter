// Pure calculations behind the dashboard. Everything is keyed off the invoice
// date (not the save time) and the per-bill payment list, so backdated bills
// and instalment payments land on the right day.

import { Bill, PaymentMethod } from '../types';
import { billDate, isoToDate } from './ledger';
import { getAmountDue, getPayments, paymentMethodLabel } from './payment';

export type PeriodKey = 'today' | 'this_week' | 'this_month' | 'last_month' | 'this_fy' | 'custom';

export const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Previous Month' },
  { value: 'this_fy', label: 'Current Fiscal Year' },
  { value: 'custom', label: 'Custom Date Range' },
];

export interface Period {
  from: Date; // start of day
  to: Date; // end of day
}

const DAY = 86400000;
const sod = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const eod = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
const round2 = (n: number) => Math.round(n * 100) / 100;

export const periodFor = (key: PeriodKey, custom?: { from?: string; to?: string }, now = new Date()): Period => {
  const today = sod(now);
  switch (key) {
    case 'today':
      return { from: today, to: eod(today) };
    case 'this_week': {
      // Week starts Monday
      const offset = (today.getDay() + 6) % 7;
      return { from: new Date(today.getTime() - offset * DAY), to: eod(today) };
    }
    case 'last_month':
      return { from: new Date(today.getFullYear(), today.getMonth() - 1, 1), to: eod(new Date(today.getFullYear(), today.getMonth(), 0)) };
    case 'this_fy': {
      const y = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
      return { from: new Date(y, 3, 1), to: eod(today) };
    }
    case 'custom': {
      const f = isoToDate(custom?.from) || today;
      const t = isoToDate(custom?.to) || today;
      return f <= t ? { from: sod(f), to: eod(t) } : { from: sod(t), to: eod(f) };
    }
    case 'this_month':
    default:
      return { from: new Date(today.getFullYear(), today.getMonth(), 1), to: eod(today) };
  }
};

// The same-length window immediately before `p` — used for "vs previous" deltas.
export const previousPeriod = (p: Period): Period => {
  const days = Math.round((sod(p.to).getTime() - p.from.getTime()) / DAY) + 1;
  const to = eod(new Date(p.from.getTime() - DAY));
  return { from: sod(new Date(p.from.getTime() - days * DAY)), to };
};

export const prevLabel = (key: PeriodKey, p: Period): string => {
  if (key === 'today') return 'vs yesterday';
  if (key === 'last_month') return 'vs month before';
  const days = Math.round((sod(p.to).getTime() - p.from.getTime()) / DAY) + 1;
  return `vs previous ${days} days`;
};

const inPeriod = (d: Date, p: Period) => d >= p.from && d <= p.to;

export interface PaymentEntry {
  billId: string;
  billNo: string;
  customerName: string;
  amount: number;
  date: Date;
  method?: PaymentMethod;
}

export const allPayments = (bills: Bill[]): PaymentEntry[] =>
  bills.flatMap((b) =>
    getPayments(b).map((p) => ({
      billId: b.id,
      billNo: b.billNo,
      customerName: b.customerName,
      amount: p.amount || 0,
      date: isoToDate(p.date) || billDate(b),
      method: p.method,
    }))
  );

// ---- KPI tiles ----

export interface Kpis {
  sales: number;
  salesPrev: number;
  invoices: number;
  invoicesUnpaid: number;
  received: number;
  receivedPrev: number;
  receivedCount: number; // invoices that got at least one payment in the period
  toCollect: number; // all-time outstanding
  overdueCount: number;
  overdueAmount: number;
}

export const dueDateOf = (b: Bill): Date => {
  const iso = isoToDate(b.dueDate);
  if (iso) return iso;
  const d = billDate(b);
  return new Date(d.getTime() + (b.paymentTerms || 0) * DAY);
};

export const daysOverdue = (b: Bill, now = new Date()) => Math.floor((sod(now).getTime() - sod(dueDateOf(b)).getTime()) / DAY);

export const computeKpis = (bills: Bill[], p: Period, now = new Date()): Kpis => {
  const prev = previousPeriod(p);
  const cur = bills.filter((b) => inPeriod(billDate(b), p));
  const pays = allPayments(bills);
  const payCur = pays.filter((x) => inPeriod(x.date, p));
  const outstanding = bills.filter((b) => getAmountDue(b) > 0);
  const overdue = outstanding.filter((b) => daysOverdue(b, now) > 0);
  return {
    sales: round2(cur.reduce((s, b) => s + (b.total || 0), 0)),
    salesPrev: round2(bills.filter((b) => inPeriod(billDate(b), prev)).reduce((s, b) => s + (b.total || 0), 0)),
    invoices: cur.length,
    invoicesUnpaid: cur.filter((b) => getAmountDue(b) > 0).length,
    received: round2(payCur.reduce((s, x) => s + x.amount, 0)),
    receivedPrev: round2(pays.filter((x) => inPeriod(x.date, prev)).reduce((s, x) => s + x.amount, 0)),
    receivedCount: new Set(payCur.map((x) => x.billId)).size,
    toCollect: round2(outstanding.reduce((s, b) => s + getAmountDue(b), 0)),
    overdueCount: overdue.length,
    overdueAmount: round2(overdue.reduce((s, b) => s + getAmountDue(b), 0)),
  };
};

// Signed % change; null when there is nothing to compare against.
export const pctChange = (cur: number, prev: number): number | null => (prev > 0 ? ((cur - prev) / prev) * 100 : null);

// ---- Sales vs Received series ----

export interface SeriesBucket {
  key: string;
  label: string; // axis label
  fullLabel: string; // tooltip label
  sales: number;
  received: number;
}

// Daily buckets for short ranges (at least the last 7 days for context),
// monthly buckets once the range is longer than ~2 months.
export const buildSeries = (bills: Bill[], p: Period): SeriesBucket[] => {
  const spanDays = Math.round((sod(p.to).getTime() - p.from.getTime()) / DAY) + 1;
  const monthly = spanDays > 62;
  const buckets: SeriesBucket[] = [];
  const index = new Map<string, SeriesBucket>();

  if (monthly) {
    const cur = new Date(p.from.getFullYear(), p.from.getMonth(), 1);
    while (cur <= p.to) {
      const key = `${cur.getFullYear()}-${cur.getMonth()}`;
      const b = {
        key,
        label: cur.toLocaleDateString('en-IN', { month: 'short' }),
        fullLabel: cur.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
        sales: 0,
        received: 0,
      };
      buckets.push(b);
      index.set(key, b);
      cur.setMonth(cur.getMonth() + 1);
    }
  } else {
    const start = spanDays < 7 ? new Date(sod(p.to).getTime() - 6 * DAY) : p.from;
    for (let t = start.getTime(); t <= p.to.getTime(); t += DAY) {
      const d = new Date(t);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const b = {
        key,
        label: spanDays <= 7 ? d.toLocaleDateString('en-IN', { weekday: 'short' }) : String(d.getDate()),
        fullLabel: d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }),
        sales: 0,
        received: 0,
      };
      buckets.push(b);
      index.set(key, b);
    }
  }

  const keyOf = (d: Date) => (monthly ? `${d.getFullYear()}-${d.getMonth()}` : `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  bills.forEach((b) => {
    const hit = index.get(keyOf(billDate(b)));
    if (hit) hit.sales += b.total || 0;
  });
  allPayments(bills).forEach((x) => {
    const hit = index.get(keyOf(x.date));
    if (hit) hit.received += x.amount;
  });
  buckets.forEach((b) => {
    b.sales = round2(b.sales);
    b.received = round2(b.received);
  });
  return buckets;
};

// ---- Outstanding by age ----

export interface AgingBucket {
  key: 'not_due' | 'd30' | 'd60' | 'd60p';
  label: string;
  amount: number;
  count: number;
}

export const computeAging = (bills: Bill[], now = new Date()): AgingBucket[] => {
  const buckets: AgingBucket[] = [
    { key: 'not_due', label: 'Not yet due', amount: 0, count: 0 },
    { key: 'd30', label: '1–30 days overdue', amount: 0, count: 0 },
    { key: 'd60', label: '31–60 days overdue', amount: 0, count: 0 },
    { key: 'd60p', label: '60+ days overdue', amount: 0, count: 0 },
  ];
  bills.forEach((b) => {
    const due = getAmountDue(b);
    if (due <= 0) return;
    const late = daysOverdue(b, now);
    const i = late <= 0 ? 0 : late <= 30 ? 1 : late <= 60 ? 2 : 3;
    buckets[i].amount += due;
    buckets[i].count += 1;
  });
  buckets.forEach((b) => (b.amount = round2(b.amount)));
  return buckets;
};

// ---- Rankings ----

export interface RankRow {
  key: string;
  label: string;
  value: number;
  sub?: string;
  customerId?: string;
}

export const topCustomers = (bills: Bill[], p: Period, limit = 5): RankRow[] => {
  const map = new Map<string, RankRow & { due: number }>();
  const dueByKey = new Map<string, number>();
  const keyOf = (b: Bill) => b.customerId || `name:${(b.customerName || '').trim().toLowerCase()}`;
  bills.forEach((b) => dueByKey.set(keyOf(b), (dueByKey.get(keyOf(b)) || 0) + getAmountDue(b)));
  bills
    .filter((b) => inPeriod(billDate(b), p))
    .forEach((b) => {
      const k = keyOf(b);
      const row = map.get(k) || { key: k, label: b.customerName || 'Walk-in', value: 0, due: 0, customerId: b.customerId };
      row.value += b.total || 0;
      map.set(k, row);
    });
  return [...map.values()]
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
    .map((r) => {
      const due = round2(dueByKey.get(r.key) || 0);
      return { key: r.key, label: r.label, value: round2(r.value), customerId: r.customerId, sub: due > 0 ? `₹${due.toLocaleString('en-IN')} outstanding` : 'No dues' };
    });
};

export const topProducts = (bills: Bill[], p: Period, by: 'amount' | 'qty', limit = 5): RankRow[] => {
  const map = new Map<string, { label: string; amount: number; qty: number; unit?: string }>();
  bills
    .filter((b) => inPeriod(billDate(b), p))
    .forEach((b) =>
      (b.items || []).forEach((it) => {
        const k = (it.productName || '').trim().toLowerCase();
        if (!k) return;
        const row = map.get(k) || { label: it.productName, amount: 0, qty: 0, unit: it.unit };
        row.amount += it.total || 0;
        row.qty += it.quantity || 0;
        map.set(k, row);
      })
    );
  return [...map.entries()]
    .map(([k, r]) => ({
      key: k,
      label: r.label,
      value: round2(by === 'amount' ? r.amount : r.qty),
      sub: by === 'amount' ? `${r.qty.toLocaleString('en-IN')} ${r.unit || 'sold'}` : `₹${round2(r.amount).toLocaleString('en-IN')}`,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
};

export const paymentModes = (bills: Bill[], p: Period): RankRow[] => {
  const map = new Map<string, RankRow>();
  allPayments(bills)
    .filter((x) => inPeriod(x.date, p))
    .forEach((x) => {
      const k = x.method || 'other';
      const row = map.get(k) || { key: k, label: paymentMethodLabel(x.method) || 'Not specified', value: 0 };
      row.value += x.amount;
      map.set(k, row);
    });
  const total = [...map.values()].reduce((s, r) => s + r.value, 0);
  return [...map.values()]
    .map((r) => ({ ...r, value: round2(r.value), sub: total > 0 ? `${Math.round((r.value / total) * 100)}%` : '' }))
    .sort((a, b) => b.value - a.value);
};

// ---- GST ----

export interface GstSummary {
  cgst: number;
  sgst: number;
  igst: number;
  other: number; // tax on legacy bills without a CGST/SGST/IGST split
  total: number;
  taxable: number;
}

export const gstSummary = (bills: Bill[], p: Period): GstSummary => {
  const s: GstSummary = { cgst: 0, sgst: 0, igst: 0, other: 0, total: 0, taxable: 0 };
  bills
    .filter((b) => inPeriod(billDate(b), p))
    .forEach((b) => {
      const split = (b.cgst || 0) + (b.sgst || 0) + (b.igst || 0);
      s.cgst += b.cgst || 0;
      s.sgst += b.sgst || 0;
      s.igst += b.igst || 0;
      if (!split && (b.tax || 0) > 0) s.other += b.tax;
      s.total += split || b.tax || 0;
      s.taxable += b.taxableAmount ?? Math.max(0, (b.total || 0) - (b.tax || 0));
    });
  (Object.keys(s) as (keyof GstSummary)[]).forEach((k) => (s[k] = round2(s[k])));
  return s;
};

// ---- Lists ----

export const overdueBills = (bills: Bill[], limit = 5, now = new Date()) =>
  bills
    .filter((b) => getAmountDue(b) > 0 && daysOverdue(b, now) > 0)
    .sort((a, b) => daysOverdue(b, now) - daysOverdue(a, now))
    .slice(0, limit);

export type ActivityItem =
  | { kind: 'invoice'; date: Date; bill: Bill }
  | { kind: 'payment'; date: Date; payment: PaymentEntry; bill: Bill };

export const recentActivity = (bills: Bill[], limit = 6): ActivityItem[] => {
  const byId = new Map(bills.map((b) => [b.id, b]));
  const items: ActivityItem[] = [
    ...bills.map((b) => ({ kind: 'invoice' as const, date: billDate(b), bill: b })),
    ...allPayments(bills).map((x) => ({ kind: 'payment' as const, date: x.date, payment: x, bill: byId.get(x.billId)! })),
  ];
  // Newest first; on the same day a payment shows above the invoice it settles.
  return items.sort((a, b) => b.date.getTime() - a.date.getTime() || (a.kind === 'payment' ? -1 : 1)).slice(0, limit);
};

// ---- Formatting ----

export const inr = (n: number, decimals = 0) =>
  '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

// Compact Indian units for axes/tiles: ₹950, ₹12.5K, ₹3.2L, ₹1.1Cr
export const inrCompact = (n: number) => {
  const a = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (a >= 1e7) return `${sign}₹${(a / 1e7).toFixed(a >= 1e8 ? 0 : 1).replace(/\.0$/, '')}Cr`;
  if (a >= 1e5) return `${sign}₹${(a / 1e5).toFixed(a >= 1e6 ? 0 : 1).replace(/\.0$/, '')}L`;
  if (a >= 1e3) return `${sign}₹${(a / 1e3).toFixed(a >= 1e4 ? 0 : 1).replace(/\.0$/, '')}K`;
  return `${sign}₹${Math.round(a)}`;
};
