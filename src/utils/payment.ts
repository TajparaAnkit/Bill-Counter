import { Bill, PaymentStatus } from '../types';

export interface PaymentMeta {
  label: string;
  badgeClass: string; // tailwind classes for a pill badge
  icon: string; // FontAwesome icon
}

export const PAYMENT_META: Record<PaymentStatus, PaymentMeta> = {
  paid: {
    label: 'Paid',
    badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    icon: 'fa-solid fa-circle-check',
  },
  partial: {
    label: 'Partial',
    badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200',
    icon: 'fa-solid fa-circle-half-stroke',
  },
  unpaid: {
    label: 'Unpaid',
    badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200',
    icon: 'fa-solid fa-circle-exclamation',
  },
};

// Bills created before payment tracking existed won't have paymentStatus.
export const getPaymentStatus = (bill: Bill): PaymentStatus => bill.paymentStatus || 'unpaid';

export const getAmountDue = (bill: Bill): number =>
  Math.max(0, (bill.total || 0) - (bill.amountPaid || 0));
