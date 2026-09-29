// Everything a non-Classic invoice design needs, worked out once so the on-screen
// designs (InvoiceTemplates.tsx) and their PDFs (pdfTemplates.ts) show the same numbers.
// Mirrors the rules of the Classic layout in InvoicePaper.tsx / pdf.ts, which are left as they are.

import { Bill, UserProfile } from '../types';
import { BRAND_NAME } from '../config/brand';
import { amountInWords } from './tax';
import { docLabels, isQuotation } from './docs';

export type ViewBill = Omit<Bill, 'id' | 'userId'> & { id?: string; userId?: string };

const toDate = (t: any): Date | null => {
  if (!t) return null;
  const d = t.toDate ? t.toDate() : t.seconds ? new Date(t.seconds * 1000) : new Date(t);
  return isNaN(d.getTime()) ? null : d;
};
const ddmmyyyy = (d: Date | null) =>
  d ? d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
const fromISO = (iso?: string) => (iso ? ddmmyyyy(new Date(iso)) : '');

export const num = (n: number | undefined) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export interface TotalLine {
  label: string;
  value: number;
  sign?: '+' | '-';
}

export const invoiceView = (bill: ViewBill, profile: Partial<UserProfile> | null) => {
  const items = bill.items || [];
  const quote = isQuotation(bill);
  const labels = docLabels(bill);
  const isGstStyle = bill.taxableAmount !== undefined || bill.cgst !== undefined || bill.igst !== undefined;
  const taxTotal = bill.tax || 0;
  const taxable = bill.taxableAmount ?? (bill.subtotal || 0) - (bill.discount || 0);
  const charges = (bill.additionalCharges || []).filter((c) => c.amount > 0);
  const billDiscount = isGstStyle ? bill.billDiscount || 0 : bill.discount || 0;
  const received = bill.amountPaid || 0;
  const halfRate = bill.taxRate ? ` @${bill.taxRate / 2}%` : '';

  const lines: TotalLine[] = [];
  if (isGstStyle) {
    if ((bill.itemDiscount || 0) > 0) lines.push({ label: 'Item Discount', value: bill.itemDiscount!, sign: '-' });
    lines.push({ label: 'Taxable Amount', value: taxable });
    if ((bill.cgst || 0) > 0) lines.push({ label: `CGST${halfRate}`, value: bill.cgst! });
    if ((bill.sgst || 0) > 0) lines.push({ label: `SGST${halfRate}`, value: bill.sgst! });
    if ((bill.igst || 0) > 0) lines.push({ label: `IGST${bill.taxRate ? ` @${bill.taxRate}%` : ''}`, value: bill.igst! });
    charges.forEach((c) => lines.push({ label: c.label || 'Additional Charge', value: c.amount }));
    if (billDiscount > 0) lines.push({ label: 'Discount', value: billDiscount, sign: '-' });
    if (bill.roundOff) lines.push({ label: 'Round Off', value: Math.abs(bill.roundOff), sign: bill.roundOff > 0 ? '+' : '-' });
  } else {
    lines.push({ label: 'Subtotal', value: bill.subtotal || 0 });
    if (billDiscount > 0) lines.push({ label: 'Discount', value: billDiscount, sign: '-' });
    if ((bill.taxRate || 0) > 0) lines.push({ label: `Tax (${bill.taxRate}%)`, value: taxTotal });
  }

  const bank = bill.showBankDetails
    ? ([
        ['Name', profile?.bankAccountHolder],
        ['Bank', profile?.bankName],
        ['Account No.', profile?.bankAccountNo],
        ['IFSC', profile?.bankIfsc],
        ['Branch', profile?.bankBranch],
      ].filter(([, v]) => !!v) as [string, string][])
    : [];

  const billTo = bill.billTo || { name: bill.customerName, phone: bill.customerPhone };
  const shipTo = bill.shipTo && (bill.shipTo.address || bill.shipTo.name) ? bill.shipTo : null;

  return {
    quote,
    cancelled: !!bill.cancelled,
    labels,
    no: bill.billNo,
    date: bill.invoiceDate ? fromISO(bill.invoiceDate) : ddmmyyyy(toDate(bill.createdAt)),
    due: fromISO(bill.dueDate),
    vehicleNo: bill.vehicleNo || '',
    seller: {
      name: profile?.businessName?.trim() || BRAND_NAME,
      address: [profile?.address, [profile?.city, profile?.state].filter(Boolean).join(', '), profile?.pincode].filter(Boolean).join(', '),
      phone: profile?.phone || '',
      email: profile?.companyEmail || profile?.email || '',
      gstin: profile?.gstRegistered === false ? '' : profile?.gstin || '',
      pan: profile?.pan || '',
      logoUrl: profile?.logoUrl || '',
      signatureUrl: profile?.signatureUrl || '',
      details: profile?.businessDetails || [],
      upiId: profile?.upiId || '',
    },
    billTo,
    shipTo,
    placeOfSupply: bill.placeOfSupply || '',
    items,
    hasHsn: items.some((i) => i.hsn),
    hasLineDiscount: items.some((i) => (i.discount || 0) > 0),
    hasLineTax: items.some((i) => (i.taxRate || 0) > 0),
    totalQty: items.reduce((s, i) => s + (i.quantity || 0), 0),
    subtotal: bill.subtotal || 0,
    itemDiscount: bill.itemDiscount || 0,
    taxTotal,
    lines,
    total: bill.total || 0,
    received,
    balance: Math.max(0, (bill.total || 0) - received),
    words: amountInWords(bill.total || 0),
    notes: bill.notes || '',
    terms: bill.termsAndConditions ?? (bill.notes ? undefined : profile?.invoiceNotes) ?? '',
    bank,
    showQr: !quote && bill.showPaymentQr !== false,
  };
};

export type InvoiceViewData = ReturnType<typeof invoiceView>;
