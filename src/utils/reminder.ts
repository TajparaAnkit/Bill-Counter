import { Bill, UserProfile } from '../types';
import { getAmountDue } from './payment';
import { whatsappUrl } from './share';
import { billDate, fmtLedgerDate, isoToDate } from './ledger';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const signOff = (profile: UserProfile | null) =>
  [profile?.upiId ? `You can pay via UPI: ${profile.upiId}` : '', 'Thank you,', profile?.businessName || ''].filter(Boolean);

// WhatsApp payment reminder for one invoice.
export const invoiceReminderUrl = (b: Bill, profile: UserProfile | null) => {
  const due = b.dueDate ? ` (due ${fmtLedgerDate(isoToDate(b.dueDate)!)})` : '';
  const lines = [
    `Dear ${b.customerName},`,
    `This is a friendly reminder that ${inr(getAmountDue(b))} is pending on invoice ${b.billNo} dated ${fmtLedgerDate(billDate(b))}${due}.`,
    ...signOff(profile),
  ];
  return whatsappUrl(b.customerPhone || b.billTo?.phone, lines.join('\n'));
};

// WhatsApp reminder for a party's whole outstanding balance.
export const partyReminderUrl = (name: string, phone: string | undefined, balance: number, profile: UserProfile | null) => {
  const lines = [`Dear ${name},`, `This is a friendly reminder that ${inr(balance)} is pending on your account with us.`, ...signOff(profile)];
  return whatsappUrl(phone, lines.join('\n'));
};
