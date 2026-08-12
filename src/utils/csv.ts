// CSV export helpers.
//
// Amounts are written as bare numbers (no ₹, no thousands separators) so that
// Excel / Sheets treat them as numeric cells instead of text. Dates use the
// ISO-ish `YYYY-MM-DD HH:mm` form for the same reason — it sorts correctly in
// every locale.

import { Bill } from '../types';
import { toDate } from './format';

/** Escape a single CSV field: wrap in quotes and double any inner quotes. */
const cell = (value: any): string => {
  if (value === null || value === undefined) return '';
  const s = String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const toRows = (rows: any[][]): string =>
  rows.map((r) => r.map(cell).join(',')).join('\r\n');

const csvDate = (value: any): string => {
  const d = toDate(value);
  if (!d) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(
    d.getMinutes()
  )}`;
};

const money = (n: number | undefined): string => Number(n || 0).toFixed(2);

/** Triggers a browser download of `content` as a UTF-8 CSV file. */
export const downloadCsv = (filename: string, content: string) => {
  // Leading BOM so Excel opens the file as UTF-8 rather than the system codepage.
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const BILL_HEADERS = [
  'Bill No',
  'Date',
  'Customer',
  'Phone',
  'Items',
  'Quantity',
  'Subtotal',
  'Discount',
  'Tax Rate (%)',
  'Tax',
  'Total',
  'Amount Paid',
  'Balance',
  'Payment Status',
  'Payment Method',
  'Notes',
];

/**
 * One row per bill — a summary export suited to accounting/reconciliation.
 * Line items are collapsed into a count + total quantity; use the per-invoice
 * PDF when item-level detail is needed.
 */
export const buildBillsCsv = (bills: Bill[]): string => {
  const rows = bills.map((b) => {
    const items = b.items || [];
    const qty = items.reduce((sum, it) => sum + (it.quantity || 0), 0);
    const paid = b.amountPaid || 0;
    return [
      b.billNo,
      csvDate(b.createdAt),
      b.customerName,
      b.customerPhone,
      items.length,
      qty,
      money(b.subtotal),
      money(b.discount),
      b.taxRate ?? 0,
      money(b.tax),
      money(b.total),
      money(paid),
      money(Math.max(0, (b.total || 0) - paid)),
      b.paymentStatus,
      b.paymentMethod,
      b.notes,
    ];
  });
  return toRows([BILL_HEADERS, ...rows]);
};

/** `bills-2026-08-05.csv` */
export const billsCsvFilename = (): string => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `bills-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.csv`;
};
