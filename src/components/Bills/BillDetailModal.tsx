import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaIcon } from '../shared/FaIcon';
import { Bill, UserProfile } from '../../types';
import { generateInvoicePDF, generateInvoicePdfFile } from '../../utils/pdf';
import { INVOICE_QR, INVOICE_QR_CAPTION } from '../../assets/qr';
import { InvoicePaper } from './InvoicePaper';
import { generateUpiQrDataUrl } from '../../utils/upiQr';
import { saveBillPayments } from '../../services/db';
import { PAYMENT_META, getPaymentStatus, getAmountDue, getPayments, newPaymentId, paymentMethodLabel } from '../../utils/payment';
import { BillPayment } from '../../types';
import { todayISO } from '../../utils/tax';
import { RecordPaymentModal } from './RecordPaymentModal';
import { sharePdfOnWhatsApp } from '../../utils/share';
import { invoiceReminderUrl } from '../../utils/reminder';
import { BRAND_NAME } from '../../config/brand';
import { useConfirm } from '../ui/confirm';
import { useToast } from '../../hooks/useToast';
import { useInvoiceTemplate } from '../../hooks/useInvoiceTemplate';

const formatISODate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

interface BillDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: Bill | null;
  businessProfile: UserProfile | null;
  onUpdated?: (bill: Bill) => void;
  onEdit?: (bill: Bill) => void; // shows an Edit button (not for cancelled invoices)
}

export const BillDetailModal: React.FC<BillDetailModalProps> = ({
  isOpen,
  onClose,
  bill,
  businessProfile,
  onUpdated,
  onEdit,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const toast = useToast();
  const confirm = useConfirm();
  const template = useInvoiceTemplate(businessProfile);

  const upiId = businessProfile?.upiId?.trim();

  // Generate a real UPI scan-to-pay QR when the modal opens (falls back to the
  // decorative sample if no UPI ID is configured).
  useEffect(() => {
    let cancelled = false;
    if (!isOpen || !bill) {
      setQrUrl(null);
      return;
    }
    if (!upiId) {
      setQrUrl(INVOICE_QR);
      return;
    }
    generateUpiQrDataUrl({
      upiId,
      payeeName: businessProfile?.businessName?.trim() || BRAND_NAME,
      amount: bill.total,
      note: bill.billNo,
    }).then((url) => {
      if (!cancelled) setQrUrl(url || INVOICE_QR);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, bill, upiId, businessProfile?.businessName]);

  if (!isOpen || !bill) return null;

  const qrCaption = upiId ? `Scan to pay ₹${bill.total.toFixed(2)}` : INVOICE_QR_CAPTION;

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const filename = `Invoice_${bill.billNo}.pdf`;
      await generateInvoicePDF(bill, businessProfile, filename, template);
      toast.success('PDF downloaded successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const status = getPaymentStatus(bill);
  const cancelled = !!bill.cancelled;
  const amountDue = cancelled ? 0 : getAmountDue(bill);

  const handleShareWhatsApp = async () => {
    try {
      setIsSharing(true);
      const file = await generateInvoicePdfFile(bill, businessProfile, `Invoice_${bill.billNo}.pdf`, template);
      const res = await sharePdfOnWhatsApp(file, bill.customerPhone || bill.billTo?.phone);
      if (res === 'downloaded') toast.info('Attaching PDFs isn’t supported in this browser — downloaded the PDF and opened WhatsApp so you can attach it.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to prepare the invoice PDF');
    } finally {
      setIsSharing(false);
    }
  };

  const payments = getPayments(bill);

  const persistPayments = async (next: BillPayment[], message: string) => {
    try {
      setIsSavingPayment(true);
      const updated = await saveBillPayments(bill, next);
      onUpdated?.(updated);
      toast.success(message);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update payment');
      throw err;
    } finally {
      setIsSavingPayment(false);
    }
  };

  const handleAddPayment = (payment: BillPayment) =>
    persistPayments([...payments, payment], `Payment of ₹${payment.amount.toFixed(2)} recorded`);

  // Quick action: receive the whole remaining balance today.
  const handleMarkFullyPaid = async () => {
    if (amountDue <= 0) return;
    await persistPayments(
      [...payments, { id: newPaymentId(), amount: amountDue, date: todayISO(), method: bill.paymentMethod || 'cash' }],
      'Invoice marked as fully paid'
    ).catch(() => undefined);
  };

  const handleDeletePayment = async (p: BillPayment) => {
    const ok = await confirm({
      title: 'Delete Payment',
      message: `Remove the payment of ₹${p.amount.toFixed(2)} received on ${formatISODate(p.date)}? The invoice balance will go up by this amount.`,
      confirmText: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    await persistPayments(payments.filter((x) => x.id !== p.id), 'Payment deleted').catch(() => undefined);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4">
      <div className="flex flex-col bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header Actions */}
        <div className="shrink-0 flex justify-between items-center gap-3 bg-white border-b border-slate-200 px-4 sm:px-5 py-3 sm:py-4">
          <h2 className="min-w-0 truncate text-base sm:text-lg font-bold text-slate-800">
            <span className="hidden sm:inline">Invoice: </span>
            <span className="sr-only sm:hidden">Invoice: </span>
            {bill.billNo}
          </h2>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {onEdit && !cancelled && (
              <button
                onClick={() => onEdit(bill)}
                className="btn-secondary flex items-center space-x-2 text-sm py-1.5 px-3 cursor-pointer"
                title="Edit this invoice"
                aria-label="Edit"
              >
                <FaIcon icon="fa-regular fa-pen-to-square" size={15} />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}
            <button
              onClick={handleShareWhatsApp}
              disabled={isSharing}
              className="flex items-center space-x-2 text-sm py-1.5 px-3 rounded-lg font-semibold bg-[#25D366] hover:bg-[#1ebe5d] text-white shadow-sm transition-colors cursor-pointer disabled:opacity-60"
              title="Share invoice PDF on WhatsApp"
            >
              {isSharing ? (
                <>
                  <FaIcon icon="fa-solid fa-spinner" size={16} className="animate-spin" />
                  <span className="hidden sm:inline">Preparing...</span>
                </>
              ) : (
                <>
                  <FaIcon icon="fa-brands fa-whatsapp" size={16} />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="btn-primary flex items-center space-x-2 text-sm py-1.5 px-3 cursor-pointer"
              aria-label="Download PDF"
              title="Download PDF"
            >
              {isDownloading ? (
                <>
                  <FaIcon icon="fa-solid fa-spinner" size={16} className="animate-spin" />
                  <span className="hidden sm:inline">Generating PDF...</span>
                </>
              ) : (
                <>
                  <FaIcon icon="fa-solid fa-file-arrow-down" size={16} />
                  <span className="hidden sm:inline">Download PDF</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors"
            >
              <FaIcon icon="fa-solid fa-xmark" size={20} />
            </button>
          </div>
        </div>

        {/* Payment status bar */}
        <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-3">
            {cancelled ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
                <FaIcon icon="fa-solid fa-ban" size={11} />
                Cancelled · not counted in sales or balances
              </span>
            ) : (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${PAYMENT_META[status].badgeClass}`}>
              <FaIcon icon={PAYMENT_META[status].icon} size={11} />
              {PAYMENT_META[status].label}
            </span>
            )}
            {amountDue > 0 && (
              <span className="text-xs font-semibold text-slate-500">
                Due: <span className="text-rose-600 font-bold">₹{amountDue.toFixed(2)}</span>
              </span>
            )}
          </div>
          {!cancelled && (
          <div className="flex items-center gap-2">
            {amountDue > 0 && (
              <a
                href={invoiceReminderUrl(bill, businessProfile)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50"
                title="Send a payment reminder on WhatsApp"
              >
                <FaIcon icon="fa-brands fa-whatsapp" size={12} />
                Remind
              </a>
            )}
            {amountDue > 0 && (
              <button
                onClick={handleMarkFullyPaid}
                disabled={isSavingPayment}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:brightness-95 disabled:opacity-50 cursor-pointer"
                title={`Record ₹${amountDue.toFixed(2)} received today`}
              >
                Mark Fully Paid
              </button>
            )}
            <button
              onClick={() => setIsPaymentOpen(true)}
              disabled={isSavingPayment || amountDue <= 0}
              className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3 disabled:opacity-50"
              title={amountDue <= 0 ? 'This invoice is fully paid' : 'Record a full or partial payment'}
            >
              <FaIcon icon="fa-solid fa-plus" size={11} />
              Record Payment
            </button>
          </div>
          )}
        </div>

        {/* Payment history */}
        {payments.length > 0 && (
          <div className="shrink-0 bg-white border-b border-slate-200 px-4 py-2.5">
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-600 cursor-pointer"
            >
              <span>
                Payment History ({payments.length}) · Received <span className="text-emerald-600">₹{(bill.amountPaid || 0).toFixed(2)}</span>
              </span>
              <FaIcon icon="fa-solid fa-chevron-down" size={11} className={`text-slate-400 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
            </button>
            {showHistory && (
              <div className="mt-2 max-h-40 overflow-y-auto divide-y divide-slate-100 rounded-md border border-slate-200">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-3 py-2 text-xs">
                    <span className="w-24 shrink-0 text-slate-600">{formatISODate(p.date)}</span>
                    <span className="w-14 shrink-0 font-semibold text-slate-500">{paymentMethodLabel(p.method) || '—'}</span>
                    <span className="flex-1 min-w-0 truncate text-slate-400">{p.note || ''}</span>
                    <span className="font-bold text-emerald-600">₹{p.amount.toFixed(2)}</span>
                    <button
                      onClick={() => handleDeletePayment(p)}
                      disabled={isSavingPayment || cancelled}
                      className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-40 cursor-pointer"
                      title="Delete payment"
                    >
                      <FaIcon icon="fa-solid fa-trash" size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Invoice preview (scrolls within the modal) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 md:p-10 bg-slate-100 flex justify-center">
          <InvoicePaper bill={bill} profile={businessProfile} qrUrl={qrUrl} qrCaption={qrCaption} template={template} />
        </div>
      </div>
      <RecordPaymentModal isOpen={isPaymentOpen} bill={bill} onClose={() => setIsPaymentOpen(false)} onSave={handleAddPayment} />
    </div>,
    document.body
  );
};
