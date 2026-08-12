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
import { BRAND_NAME } from '../../config/brand';
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
      payeeName: BRAND_NAME,
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

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    return new Date(timestamp).toLocaleDateString();
  };

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
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${PAYMENT_META[status].badgeClass}`}>
              <FaIcon icon={PAYMENT_META[status].icon} size={11} />
              {PAYMENT_META[status].label}
            </span>
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
          <div 
            id="invoice-pdf-content"
            className="w-full max-w-[800px] p-8 md:p-12 bg-white shadow-md rounded-xl text-gray-800"
            style={{ boxSizing: 'border-box' }}
          >
            {/* Header: Brand and Invoice Title */}
            <div className="flex justify-between items-start border-b border-gray-200 pb-6">
              <div>
                <h1 className="text-4xl font-extrabold text-blue-600 uppercase tracking-tight">
                  Invoice
                </h1>
                <p className="text-sm font-semibold text-gray-500 mt-1">
                  Invoice No: <span className="text-gray-800 font-bold">{bill.billNo}</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Date: <span className="text-gray-800 font-medium">{formatDate(bill.createdAt)}</span>
                </p>
              </div>
              <div className="text-right">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow text-white font-bold ml-auto mb-2 text-lg">
                  BC
                </div>
                <h3 className="font-bold text-gray-900 text-lg">
                  {BRAND_NAME}
                </h3>
                {businessProfile?.address && (
                  <p className="text-xs text-gray-500 whitespace-pre-wrap max-w-xs ml-auto">
                    {businessProfile.address}
                  </p>
                )}
                {businessProfile?.phone && (
                  <p className="text-xs text-gray-500">
                    Phone: {businessProfile.phone}
                  </p>
                )}
                {businessProfile?.gstin && (
                  <p className="text-xs text-gray-500">
                    GSTIN: <span className="font-semibold text-gray-700">{businessProfile.gstin}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Info Section */}
            <div className="grid grid-cols-2 gap-6 py-6 border-b border-gray-100">
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                  Billed To
                </span>
                <span className="font-bold text-gray-850 mt-1 block">
                  {bill.customerName}
                </span>
              </div>
            </div>

            {/* Table Details */}
            <div className="py-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-blue-600 text-white text-xs font-bold uppercase tracking-wider">
                    <th className="p-3 rounded-l-lg">Item</th>
                    <th className="p-3 text-center w-24">Qty</th>
                    <th className="p-3 text-right w-32">Price</th>
                    <th className="p-3 text-right w-36 rounded-r-lg">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {bill.items.map((item, index) => (
                    <tr key={index} className="text-sm">
                      <td className="p-3 font-semibold text-gray-800">{item.productName}</td>
                      <td className="p-3 text-center text-gray-650">{item.quantity}</td>
                      <td className="p-3 text-right text-gray-650">₹{item.price.toFixed(2)}</td>
                      <td className="p-3 text-right font-bold text-gray-800">₹{item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals and Terms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div>
                {bill.notes && (
                  <>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Invoice Notes / Payment Terms
                    </span>
                    <p className="text-xs text-gray-500 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border border-gray-100">
                      {bill.notes}
                    </p>
                  </>
                )}
                {!bill.notes && businessProfile?.invoiceNotes && (
                  <>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Terms & Conditions
                    </span>
                    <p className="text-xs text-gray-500 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border border-gray-100">
                      {businessProfile.invoiceNotes}
                    </p>
                  </>
                )}

                {/* Payment QR — real UPI scan-to-pay when a UPI ID is set */}
                {qrUrl && (
                  <div className="flex items-center gap-3 mt-4">
                    <img
                      src={qrUrl}
                      alt={upiId ? 'UPI payment QR code' : 'Invoice QR code'}
                      className="w-24 h-24 rounded-lg border border-gray-150 bg-white p-1.5"
                    />
                    {qrCaption && (
                      <div className="max-w-40">
                        <span className="text-xs text-gray-500 font-medium block">{qrCaption}</span>
                        {upiId && (
                          <span className="text-[10px] text-gray-400 font-mono block mt-0.5">{upiId}</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 space-y-2 text-sm self-start">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{bill.subtotal.toFixed(2)}</span>
                </div>
                {(bill.discount || 0) > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Discount</span>
                    <span className="text-emerald-600">−₹{(bill.discount || 0).toFixed(2)}</span>
                  </div>
                )}
                {(bill.taxRate || 0) > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Tax ({bill.taxRate}%)</span>
                    <span>₹{(bill.tax || 0).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-blue-800 text-base border-t border-blue-100 pt-2 mt-2">
                  <span>Total Due</span>
                  <span>₹{bill.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Footer Thank You */}
            <div className="text-center pt-10 text-xs text-gray-400 font-medium">
              Thank you for supporting {BRAND_NAME}! 🧶
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
