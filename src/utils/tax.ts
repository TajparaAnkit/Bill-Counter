// Invoice calculation engine.
//
// Every line item carries its own optional discount and GST rate. Totals are
// derived from the lines, then bill-level additional charges, a bill-level
// discount and an optional round-off are applied. GST is split into
// CGST + SGST (same state) or IGST (inter-state) using Place of Supply.

import { AdditionalCharge, BillItem } from '../types';

export const INDIAN_STATES: { code: string; name: string }[] = [
  { code: '01', name: 'Jammu and Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' },
  { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' },
  { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '26', name: 'Dadra and Nagar Haveli and Daman and Diu' },
  { code: '27', name: 'Maharashtra' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '31', name: 'Lakshadweep' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '34', name: 'Puducherry' },
  { code: '35', name: 'Andaman and Nicobar Islands' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh' },
  { code: '38', name: 'Ladakh' },
];

// Guess the state from a GSTIN's first two digits.
export const stateFromGSTIN = (gstin?: string): string => {
  const code = (gstin || '').trim().slice(0, 2);
  return INDIAN_STATES.find((s) => s.code === code)?.name || '';
};

export const GST_RATES = [0, 0.1, 0.25, 1.5, 3, 5, 12, 18, 28];

export const UNITS = ['PCS', 'KGS', 'GMS', 'LTR', 'MTR', 'BOX', 'SET', 'PKT', 'NOS', 'DOZ', 'HRS', 'SQF', 'BAG'];

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

// Compute the derived fields for a single line item.
export const computeLine = (
  item: Pick<BillItem, 'quantity' | 'price' | 'discount' | 'discountPercent' | 'taxRate'>,
  discountMode: 'amount' | 'percent' = 'amount'
) => {
  const qty = Math.max(0, item.quantity || 0);
  const price = Math.max(0, item.price || 0);
  const gross = qty * price;
  let discount =
    discountMode === 'percent'
      ? gross * (Math.max(0, item.discountPercent || 0) / 100)
      : Math.max(0, item.discount || 0);
  discount = Math.min(gross, discount);
  const taxable = gross - discount;
  const rate = Math.max(0, item.taxRate || 0);
  const taxAmount = taxable * (rate / 100);
  return {
    gross: round2(gross),
    discount: round2(discount),
    discountPercent: gross > 0 ? round2((discount / gross) * 100) : 0,
    taxable: round2(taxable),
    taxRate: rate,
    taxAmount: round2(taxAmount),
    total: round2(taxable + taxAmount),
  };
};

export interface BillTotalsInput {
  items: BillItem[];
  additionalCharges?: AdditionalCharge[];
  billDiscount?: number; // ₹, applied after tax
  autoRoundOff?: boolean;
  manualRoundOff?: number; // signed ₹, used when autoRoundOff is false
  interState?: boolean; // true -> IGST, false -> CGST+SGST
}

export interface BillTotals {
  subtotal: number; // sum of line totals (incl. line tax)
  taxableAmount: number;
  itemDiscount: number;
  tax: number;
  cgst: number;
  sgst: number;
  igst: number;
  charges: number;
  billDiscount: number;
  roundOff: number;
  total: number;
  uniformTaxRate?: number; // set when every taxed line shares one rate
}

export const computeBillTotals = (input: BillTotalsInput): BillTotals => {
  const lines = input.items.map((it) => computeLine(it));
  const subtotal = round2(lines.reduce((s, l) => s + l.total, 0));
  const taxableAmount = round2(lines.reduce((s, l) => s + l.taxable, 0));
  const itemDiscount = round2(lines.reduce((s, l) => s + l.discount, 0));
  const tax = round2(lines.reduce((s, l) => s + l.taxAmount, 0));

  const rates = Array.from(new Set(lines.filter((l) => l.taxAmount > 0).map((l) => l.taxRate)));
  const uniformTaxRate = rates.length === 1 ? rates[0] : undefined;

  const charges = round2((input.additionalCharges || []).reduce((s, c) => s + Math.max(0, c.amount || 0), 0));
  const beforeDiscount = subtotal + charges;
  const billDiscount = round2(Math.min(beforeDiscount, Math.max(0, input.billDiscount || 0)));
  const preRound = round2(beforeDiscount - billDiscount);

  let roundOff = 0;
  if (input.autoRoundOff) {
    roundOff = round2(Math.round(preRound) - preRound);
  } else if (input.manualRoundOff) {
    roundOff = round2(input.manualRoundOff);
  }
  const total = round2(preRound + roundOff);

  const interState = !!input.interState;
  return {
    subtotal,
    taxableAmount,
    itemDiscount,
    tax,
    cgst: interState ? 0 : round2(tax / 2),
    sgst: interState ? 0 : round2(tax - tax / 2),
    igst: interState ? tax : 0,
    charges,
    billDiscount,
    roundOff,
    total,
    uniformTaxRate,
  };
};

// ---- date helpers for invoice/due dates (ISO yyyy-mm-dd strings) ----
export const todayISO = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

export const addDaysISO = (iso: string, days: number) => {
  const d = new Date(iso || todayISO());
  if (isNaN(d.getTime())) return todayISO();
  d.setDate(d.getDate() + (days || 0));
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

export const daysBetweenISO = (from: string, to: string) => {
  const a = new Date(from);
  const b = new Date(to);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return 0;
  return Math.round((b.getTime() - a.getTime()) / 86400000);
};

export const formatISODate = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ---- Amount in words (Indian numbering) ----
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const twoDigits = (n: number) => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ' ' + ONES[n % 10] : ''}`);
const threeDigits = (n: number) => {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return `${h ? ONES[h] + ' Hundred' : ''}${h && rest ? ' ' : ''}${rest ? twoDigits(rest) : ''}`;
};

export const amountInWords = (amount: number): string => {
  const n = Math.round(Math.abs(amount || 0) * 100);
  const rupees = Math.floor(n / 100);
  const paise = n % 100;
  if (rupees === 0 && paise === 0) return 'Zero Rupees Only';

  const parts: string[] = [];
  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const hundred = rupees % 1000;
  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (hundred) parts.push(threeDigits(hundred));

  let out = parts.length ? `${parts.join(' ')} Rupees` : '';
  if (paise) out += `${out ? ' and ' : ''}${twoDigits(paise)} Paise`;
  return `${out} Only`;
};
