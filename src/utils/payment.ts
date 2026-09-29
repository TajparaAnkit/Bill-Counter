import { Bill, BillPayment, PaymentMethod, PaymentStatus } from '../types';
import { todayISO } from './tax';

export interface PaymentMeta {
  label: string;
  badgeClass: string; // tailwind classes for a pill badge
  icon: string; // FontAwesome icon
}

export const PAYMENT_META: Record<PaymentStatus, PaymentMeta> = {
  paid: {
    label: 'Paid',
    badgeClass: 'bg-emerald-600 text-white',
    icon: 'fa-solid fa-circle-check',
  },
  partial: {
    label: 'Partial',
    badgeClass: 'bg-amber-400 text-amber-950',
    icon: 'fa-solid fa-circle-half-stroke',
  },
  unpaid: {
    label: 'Unpaid',
    badgeClass: 'bg-rose-600 text-white',
    icon: 'fa-solid fa-circle-exclamation',
  },
};

export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card' },
  { value: 'bank', label: 'Bank' },
  { value: 'other', label: 'Other' },
];

export const paymentMethodLabel = (m?: PaymentMethod) => PAYMENT_METHOD_OPTIONS.find((o) => o.value === m)?.label || '';

// Bills created before payment tracking existed won't have paymentStatus.
export const getPaymentStatus = (bill: Bill): PaymentStatus => bill.paymentStatus || 'unpaid';

export const getAmountDue = (bill: Bill): number =>
  Math.max(0, (bill.total || 0) - (bill.amountPaid || 0));

const round2 = (n: number) => Math.round(n * 100) / 100;

const tsToISO = (t: any): string | null => {
  if (!t) return null;
  const d = t.toDate ? t.toDate() : t.seconds ? new Date(t.seconds * 1000) : new Date(t);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const newPaymentId = () => `pay_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// Payments of a bill, oldest first. Legacy bills only stored a single
// amountPaid, so that is surfaced as one payment dated when the bill was
// marked paid (or on the invoice date for partial payments).
export const getPayments = (bill: Bill): BillPayment[] => {
  if (bill.payments) return [...bill.payments].sort((a, b) => a.date.localeCompare(b.date));
  if ((bill.amountPaid || 0) <= 0) return [];
  const invoiceISO = bill.invoiceDate || tsToISO(bill.createdAt) || todayISO();
  const paidISO = tsToISO(bill.paidAt);
  return [
    {
      id: 'legacy',
      amount: bill.amountPaid,
      date: paidISO && paidISO >= invoiceISO ? paidISO : invoiceISO,
      method: bill.paymentMethod,
    },
  ];
};

// The bill fields that are derived from its payment list.
export const summarizePayments = (total: number, payments: BillPayment[]) => {
  const sorted = [...payments].sort((a, b) => a.date.localeCompare(b.date));
  const amountPaid = round2(sorted.reduce((s, p) => s + (p.amount || 0), 0));
  const paymentStatus: PaymentStatus = amountPaid <= 0 ? 'unpaid' : amountPaid >= round2(total) ? 'paid' : 'partial';
  const last = sorted[sorted.length - 1];
  return {
    payments: sorted,
    amountPaid,
    paymentStatus,
    paymentMethod: last?.method,
    // Date the bill became fully paid = date of the payment that settled it.
    paidAt: paymentStatus === 'paid' && last ? new Date(`${last.date}T00:00:00`) : null,
  };
};
