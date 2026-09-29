import * as XLSX from 'xlsx';
import { Bill } from '../types';
import { getAmountDue, getPaymentStatus, paymentMethodLabel } from './payment';
import { billDate, toISODate } from './ledger';
import { round2 } from './tax';

// Excel export of an invoice list: an "Invoices" sheet (one row per invoice +
// totals) and an "Items" sheet (one row per line, for the accountant).
// Cancelled invoices are listed with status "Cancelled" but left out of the totals.

const ddmmyyyy = (d: Date) => `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
const isoToDisplay = (iso?: string) => (iso ? ddmmyyyy(new Date(`${iso}T00:00:00`)) : '');

const statusLabel = (b: Bill) => {
  if (b.cancelled) return 'Cancelled';
  const s = getPaymentStatus(b);
  return s === 'paid' ? 'Paid' : s === 'partial' ? 'Partial' : 'Unpaid';
};

const taxableOf = (b: Bill) => b.taxableAmount ?? round2((b.subtotal || 0) - (b.tax || 0));
const chargesOf = (b: Bill) => round2((b.additionalCharges || []).reduce((s, c) => s + (c.amount || 0), 0));

export const invoiceRows = (bills: Bill[]) => {
  const rows = bills.map((b) => ({
    'Invoice No.': b.billNo,
    'Invoice Date': ddmmyyyy(billDate(b)),
    'Due Date': isoToDisplay(b.dueDate),
    Customer: b.customerName,
    Phone: b.customerPhone || b.billTo?.phone || '',
    GSTIN: b.billTo?.gstin || '',
    'Place of Supply': b.placeOfSupply || '',
    'Taxable Amount': taxableOf(b),
    CGST: b.cgst || 0,
    SGST: b.sgst || 0,
    IGST: b.igst || 0,
    'Total Tax': b.tax || 0,
    Discount: round2((b.itemDiscount || 0) + (b.billDiscount || 0)) || b.discount || 0,
    'Additional Charges': chargesOf(b),
    'Round Off': b.roundOff || 0,
    'Invoice Total': b.total || 0,
    Received: b.cancelled ? 0 : Math.min(b.total || 0, b.amountPaid || 0),
    Balance: b.cancelled ? 0 : getAmountDue(b),
    Status: statusLabel(b),
    'Payment Mode': b.cancelled ? '' : paymentMethodLabel(b.paymentMethod),
  }));

  const live = rows.filter((r) => r.Status !== 'Cancelled');
  const sum = (k: keyof (typeof rows)[number]) => round2(live.reduce((s, r) => s + (Number(r[k]) || 0), 0));
  const totals = {
    'Invoice No.': `TOTAL (${live.length} invoice${live.length === 1 ? '' : 's'}${rows.length > live.length ? `, ${rows.length - live.length} cancelled excluded` : ''})`,
    'Invoice Date': '',
    'Due Date': '',
    Customer: '',
    Phone: '',
    GSTIN: '',
    'Place of Supply': '',
    'Taxable Amount': sum('Taxable Amount'),
    CGST: sum('CGST'),
    SGST: sum('SGST'),
    IGST: sum('IGST'),
    'Total Tax': sum('Total Tax'),
    Discount: sum('Discount'),
    'Additional Charges': sum('Additional Charges'),
    'Round Off': sum('Round Off'),
    'Invoice Total': sum('Invoice Total'),
    Received: sum('Received'),
    Balance: sum('Balance'),
    Status: '',
    'Payment Mode': '',
  };
  return { rows, totals };
};

export const itemRows = (bills: Bill[]) =>
  bills
    .filter((b) => !b.cancelled)
    .flatMap((b) =>
      (b.items || []).map((i) => ({
        'Invoice No.': b.billNo,
        'Invoice Date': ddmmyyyy(billDate(b)),
        Customer: b.customerName,
        GSTIN: b.billTo?.gstin || '',
        Item: i.productName,
        HSN: i.hsn || '',
        Qty: i.quantity || 0,
        Unit: i.unit || '',
        Rate: i.price || 0,
        Discount: i.discount || 0,
        'Taxable Amount': i.taxable ?? round2((i.quantity || 0) * (i.price || 0) - (i.discount || 0)),
        'GST %': i.taxRate ?? b.taxRate ?? 0,
        'Tax Amount': i.taxAmount || 0,
        Amount: i.total || 0,
      }))
    );

// Builds the workbook and triggers the download. Returns the file name.
export const exportInvoicesToExcel = (bills: Bill[], periodLabel: string): string => {
  const { rows, totals } = invoiceRows(bills);
  const wb = XLSX.utils.book_new();

  const inv = XLSX.utils.json_to_sheet([...rows, totals]);
  inv['!cols'] = Object.keys(totals).map((k) => ({ wch: k === 'Invoice No.' ? 18 : k === 'Customer' ? 28 : Math.max(10, k.length + 2) }));
  XLSX.utils.book_append_sheet(wb, inv, 'Invoices');

  const items = itemRows(bills);
  const it = XLSX.utils.json_to_sheet(items.length ? items : [{ Note: 'No invoice lines in this period' }]);
  it['!cols'] = [{ wch: 14 }, { wch: 12 }, { wch: 28 }, { wch: 17 }, { wch: 30 }, { wch: 10 }, { wch: 8 }, { wch: 7 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 7 }, { wch: 12 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, it, 'Items');

  const fileName = `Sales_Invoices_${periodLabel.replace(/[^A-Za-z0-9]+/g, '_')}_${toISODate(new Date())}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return fileName;
};
