// Party ledger (statement) builder.
//
// Convention (same as myBillBook's Party Ledger): a sales invoice is a DEBIT
// to the party (they owe us), a payment received is a CREDIT. A positive
// balance means "To Collect", a negative one means "To Pay".

import { Bill, Customer } from '../types';
import { getPayments } from './payment';

export type LedgerVoucher = 'Opening Balance' | 'Sales Invoice' | 'Payment In';

export interface LedgerEntry {
  date: Date;
  voucher: LedgerVoucher;
  srNo: string; // invoice number (blank for opening balance)
  debit: number;
  credit: number;
  balance: number; // running balance after this entry
  billId?: string;
}

export interface Ledger {
  from: Date | null; // null = from the beginning
  to: Date;
  openingBalance: number; // balance carried in at `from`
  entries: LedgerEntry[]; // only entries inside the period (opening row included)
  totalDebit: number; // invoices inside the period
  totalCredit: number; // payments inside the period
  closingBalance: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export const toDate = (t: any): Date | null => {
  if (!t) return null;
  if (t.toDate) return t.toDate();
  if (t.seconds) return new Date(t.seconds * 1000);
  const d = new Date(t);
  return isNaN(d.getTime()) ? null : d;
};

// Parses "yyyy-mm-dd" as a LOCAL date (new Date(iso) would read it as UTC).
export const isoToDate = (iso?: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
};

export const billDate = (b: Bill): Date => isoToDate(b.invoiceDate) || toDate(b.createdAt) || new Date();

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

// Bills saved with a party link match by id. Older bills (before parties were
// linked) fall back to an exact, case-insensitive name match.
export const billsForParty = (customer: Customer, bills: Bill[]): Bill[] => {
  const name = (customer.name || '').trim().toLowerCase();
  return bills.filter((b) =>
    b.customerId ? b.customerId === customer.id : !!name && (b.customerName || '').trim().toLowerCase() === name
  );
};

export const buildLedger = (customer: Customer, bills: Bill[], from: Date | null, to: Date): Ledger => {
  const start = from ? startOfDay(from) : null;
  const end = endOfDay(to);

  const signedOpening =
    (customer.openingBalance || 0) * (customer.openingBalanceType === 'to_pay' ? -1 : 1);

  type Raw = Omit<LedgerEntry, 'balance'>;
  const raw: Raw[] = [];
  billsForParty(customer, bills).forEach((b) => {
    const date = billDate(b);
    raw.push({ date, voucher: 'Sales Invoice', srNo: b.billNo, debit: b.total || 0, credit: 0, billId: b.id });
    // One row per payment received, on the day it was received.
    getPayments(b).forEach((p) => {
      raw.push({
        date: isoToDate(p.date) || date,
        voucher: 'Payment In',
        srNo: b.billNo,
        debit: 0,
        credit: p.amount || 0,
        billId: b.id,
      });
    });
  });
  // Oldest first; on the same day an invoice comes before its payment.
  raw.sort((a, b) => a.date.getTime() - b.date.getTime() || (a.voucher === 'Sales Invoice' ? -1 : 1));

  let opening = signedOpening;
  const inside: Raw[] = [];
  raw.forEach((e) => {
    if (e.date > end) return;
    if (start && e.date < start) opening += e.debit - e.credit;
    else inside.push(e);
  });
  opening = round2(opening);

  let running = opening;
  const entries: LedgerEntry[] = [
    {
      date: start || (inside[0]?.date ?? startOfDay(end)),
      voucher: 'Opening Balance',
      srNo: '',
      debit: opening > 0 ? opening : 0,
      credit: opening < 0 ? -opening : 0,
      balance: opening,
    },
  ];
  let totalDebit = 0;
  let totalCredit = 0;
  inside.forEach((e) => {
    running = round2(running + e.debit - e.credit);
    totalDebit += e.debit;
    totalCredit += e.credit;
    entries.push({ ...e, balance: running });
  });

  return {
    from: start,
    to: end,
    openingBalance: opening,
    entries,
    totalDebit: round2(totalDebit),
    totalCredit: round2(totalCredit),
    closingBalance: running,
  };
};

// ---- Date range presets (mirrors myBillBook's report filter) ----

export type RangePreset =
  | 'this_month'
  | 'last_month'
  | 'last_30'
  | 'this_quarter'
  | 'this_fy'
  | 'last_fy'
  | 'last_365'
  | 'all'
  | 'custom';

export const RANGE_OPTIONS: { value: RangePreset; label: string }[] = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Previous Month' },
  { value: 'last_30', label: 'Last 30 Days' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'this_fy', label: 'Current Fiscal Year' },
  { value: 'last_fy', label: 'Previous Fiscal Year' },
  { value: 'last_365', label: 'Last 365 Days' },
  { value: 'all', label: 'All Time' },
  { value: 'custom', label: 'Custom Date Range' },
];

// Indian financial year runs 1 April – 31 March.
const fyStart = (d: Date) => new Date(d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1, 3, 1);

export const rangeFor = (preset: RangePreset, now = new Date()): { from: Date | null; to: Date } => {
  const today = startOfDay(now);
  const daysAgo = (n: number) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - n);
  switch (preset) {
    case 'this_month':
      return { from: new Date(today.getFullYear(), today.getMonth(), 1), to: today };
    case 'last_month':
      return {
        from: new Date(today.getFullYear(), today.getMonth() - 1, 1),
        to: new Date(today.getFullYear(), today.getMonth(), 0),
      };
    case 'last_30':
      return { from: daysAgo(29), to: today };
    case 'this_quarter': {
      // Financial quarters: Apr–Jun, Jul–Sep, Oct–Dec, Jan–Mar
      const q = Math.floor(((today.getMonth() + 9) % 12) / 3);
      const startMonth = (q * 3 + 3) % 12;
      const year = startMonth > today.getMonth() ? today.getFullYear() - 1 : today.getFullYear();
      return { from: new Date(year, startMonth, 1), to: today };
    }
    case 'this_fy':
      return { from: fyStart(today), to: today };
    case 'last_fy': {
      const s = fyStart(today);
      return { from: new Date(s.getFullYear() - 1, 3, 1), to: new Date(s.getFullYear(), 2, 31) };
    }
    case 'last_365':
      return { from: daysAgo(364), to: today };
    case 'all':
    case 'custom':
    default:
      return { from: null, to: today };
  }
};

export const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const fmtLedgerDate = (d: Date) =>
  d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
