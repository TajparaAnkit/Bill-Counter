import { Bill } from '../types';

export const isQuotation = (b: Pick<Bill, 'docType'>) => b.docType === 'quotation';

// Bills that count in totals, balances, reports and stock (not cancelled).
export const isLiveBill = (b: Bill) => !b.cancelled;

// Heading and field labels for the printed document (screen + PDF).
export const docLabels = (b: Pick<Bill, 'docType' | 'tax'>) =>
  isQuotation(b)
    ? { title: 'Quotation', no: 'Quotation No.', date: 'Quotation Date', due: 'Valid Till' }
    : { title: (b.tax || 0) > 0 ? 'Tax Invoice' : 'Invoice', no: 'Invoice No.', date: 'Invoice Date', due: 'Due Date' };
