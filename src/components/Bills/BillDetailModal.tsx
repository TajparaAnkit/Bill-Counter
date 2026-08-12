import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaIcon } from '../shared/FaIcon';
import { Bill, UserProfile } from '../../types';
import { generateInvoicePDF, generateInvoicePdfFile } from '../../utils/pdf';
import { INVOICE_QR, INVOICE_QR_CAPTION } from '../../assets/qr';
import { generateUpiQrDataUrl } from '../../utils/upiQr';
import { updateBillPayment } from '../../services/db';
import { PAYMENT_META, getPaymentStatus, getAmountDue } from '../../utils/payment';
import { PaymentStatus } from '../../types';
import { PaymentBadge } from '../shared/PaymentBadge';
import { InvoicePreview } from './InvoicePreview';
import { usePrompt } from '../ui/confirm';
import { useToast } from '../../hooks/useToast';

interface BillDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: Bill | null;
  businessProfile: UserProfile | null;
  onUpdated?: (bill: Bill) => void;
}

export const BillDetailModal: React.FC<BillDetailModalProps> = ({
  isOpen,
  onClose,
  bill,
  businessProfile,
  onUpdated,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const toast = useToast();
  const prompt = usePrompt();

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
      payeeName: businessProfile?.businessName || 'Bill Counter',
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
      await generateInvoicePDF(bill, businessProfile, filename);
      toast.success('PDF downloaded successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const status = getPaymentStatus(bill);
  const amountDue = getAmountDue(bill);

  const openWhatsAppChat = () => {
    // Normalize phone to WhatsApp format (digits + country code, no +).
    let phone = (bill.customerPhone || '').replace(/\D/g, '');
    if (phone.startsWith('0')) phone = phone.replace(/^0+/, '');
    if (phone.length === 10) phone = `91${phone}`; // assume India if 10 digits

    // No `text` param — we send the PDF only, not a text summary.
    const url = phone ? `https://wa.me/${phone}` : `https://wa.me/`;
    window.open(url, '_blank', 'noopener');
  };

  const handleShareWhatsApp = async () => {
    const filename = `Invoice_${bill.billNo}.pdf`;

    try {
      setIsSharing(true);
      const file = await generateInvoicePdfFile(bill, businessProfile, filename);
      const nav = navigator as any;

      // Preferred path: native share sheet with the PDF ONLY (mobile / some
      // desktops). No text is attached — just the invoice PDF.
      if (file && nav.canShare && nav.canShare({ files: [file] })) {
        try {
          await nav.share({ files: [file] });
          return;
        } catch (err: any) {
          if (err?.name === 'AbortError') return; // user dismissed the sheet
          // otherwise fall through to the download fallback
        }
      }

      // Fallback (most desktop browsers can't share files): download the PDF so
      // it can be attached manually, and open the WhatsApp chat (no text).
      if (file) {
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }
      openWhatsAppChat();
      toast.info('Attaching PDFs isn’t supported in this browser — downloaded the PDF and opened WhatsApp so you can attach it.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to prepare the invoice PDF');
    } finally {
      setIsSharing(false);
    }
  };

  const handleSetPayment = async (next: PaymentStatus) => {
    let amountPaid = 0;
    if (next === 'paid') amountPaid = bill.total;
    if (next === 'partial') {
      const input = await prompt({
        title: 'Record Partial Payment',
        message: `How much has been received? (Total ₹${bill.total.toFixed(2)})`,
        inputType: 'number',
        prefix: '₹',
        placeholder: '0.00',
        defaultValue: bill.amountPaid ? String(bill.amountPaid) : '',
        confirmText: 'Save Payment',
        variant: 'primary',
        min: 0,
        max: bill.total,
        step: 0.01,
        validate: (v) => {
          const n = parseFloat(v);
          if (isNaN(n) || n <= 0) return 'Enter an amount greater than 0';
          if (n > bill.total) return `Cannot exceed the total (₹${bill.total.toFixed(2)})`;
          return null;
        },
      });
      if (input === null) return; // cancelled
      amountPaid = Math.min(bill.total, Math.max(0, parseFloat(input) || 0));
    }
    try {
      setIsSavingPayment(true);
      await updateBillPayment(bill.id, {
        paymentStatus: next,
        amountPaid,
        paymentMethod: next === 'unpaid' ? undefined : bill.paymentMethod,
      });
      onUpdated?.({
        ...bill,
        paymentStatus: next,
        amountPaid,
        paidAt: next === 'paid' ? new Date() : undefined,
      });
      toast.success('Payment status updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update payment');
    } finally {
      setIsSavingPayment(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="flex flex-col bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header Actions */}
        <div className="shrink-0 flex justify-between items-center bg-gray-50 border-b border-gray-150 p-4">
          <h2 className="text-lg font-bold text-gray-800">
            Invoice: {bill.billNo}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleShareWhatsApp}
              disabled={isSharing}
              className="flex items-center space-x-2 text-sm py-1.5 px-3 rounded-xl font-semibold bg-[#25D366] hover:bg-[#1ebe5d] text-white shadow-sm transition-colors cursor-pointer disabled:opacity-60"
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
            >
              {isDownloading ? (
                <>
                  <FaIcon icon="fa-solid fa-spinner" size={16} className="animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <FaIcon icon="fa-solid fa-file-arrow-down" size={16} />
                  <span>Download PDF</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition-colors"
            >
              <FaIcon icon="fa-solid fa-xmark" size={20} />
            </button>
          </div>
        </div>

        {/* Payment status bar */}
        <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border-b border-gray-150 px-4 py-3">
          <div className="flex items-center gap-3">
            <PaymentBadge bill={bill} />
            {amountDue > 0 && (
              <span className="text-xs font-semibold text-slate-500">
                Due: <span className="text-rose-600 font-bold">₹{amountDue.toFixed(2)}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 mr-1">Mark as:</span>
            {(['paid', 'partial', 'unpaid'] as const).map((s) => (
              <button
                key={s}
                onClick={() => handleSetPayment(s)}
                disabled={isSavingPayment || status === s}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${PAYMENT_META[s].badgeClass} hover:brightness-95`}
              >
                {PAYMENT_META[s].label}
              </button>
            ))}
          </div>
        </div>

        {/* Invoice preview (scrolls within the modal) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 md:p-10 bg-gray-100 flex justify-center">
          <InvoicePreview
            bill={bill}
            businessProfile={businessProfile}
            qrUrl={qrUrl}
            qrCaption={qrCaption}
            upiId={upiId}
          />
        </div>
      </div>
    </div>,
    document.body
  );
};
