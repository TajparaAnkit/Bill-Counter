import React, { useState } from 'react';
import { FaIcon } from '../shared/FaIcon';
import { Bill, UserProfile } from '../../types';
import { generatePDF } from '../../utils/pdf';
import { useToast } from '../../hooks/useToast';

interface BillDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: Bill | null;
  businessProfile: UserProfile | null;
}

export const BillDetailModal: React.FC<BillDetailModalProps> = ({
  isOpen,
  onClose,
  bill,
  businessProfile,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const toast = useToast();

  if (!isOpen || !bill) return null;

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
      await generatePDF('invoice-pdf-content', filename);
      toast.success('PDF downloaded successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 my-8">
        {/* Header Actions */}
        <div className="flex justify-between items-center bg-gray-50 border-b border-gray-150 p-4">
          <h2 className="text-lg font-bold text-gray-800">
            Invoice: {bill.billNo}
          </h2>
          <div className="flex items-center space-x-2">
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

        {/* Invoice PDF Wrapper */}
        <div className="p-6 md:p-10 overflow-y-auto max-h-[70vh] bg-gray-100 flex justify-center">
          <div 
            id="invoice-pdf-content"
            className="w-full max-w-[800px] p-8 md:p-12 bg-white shadow-md rounded-xl text-gray-800"
            style={{ boxSizing: 'border-box' }}
          >
            {/* Header: Brand and Invoice Title */}
            <div className="flex justify-between items-start border-b border-gray-200 pb-6">
              <div>
                <h1 className="text-4xl font-extrabold text-teal-600 uppercase tracking-tight">
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
                <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow text-white font-bold ml-auto mb-2 text-lg">
                  NC
                </div>
                <h3 className="font-bold text-gray-900 text-lg">
                  {businessProfile?.businessName || 'Naitu Crochet'}
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
                  <tr className="bg-teal-600 text-white text-xs font-bold uppercase tracking-wider">
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
              </div>

              <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-100/50 space-y-2 text-sm self-start">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{bill.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (0%)</span>
                  <span>₹0.00</span>
                </div>
                <div className="flex justify-between font-bold text-teal-800 text-base border-t border-teal-100 pt-2 mt-2">
                  <span>Total Due</span>
                  <span>₹{bill.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Footer Thank You */}
            <div className="text-center pt-10 text-xs text-gray-400 font-medium">
              Thank you for supporting {businessProfile?.businessName || 'Naitu Crochet'}! 🧶
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
