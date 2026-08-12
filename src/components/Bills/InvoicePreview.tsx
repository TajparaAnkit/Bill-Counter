import { Bill, UserProfile } from '../../types';
import { formatDate } from '../../utils/format';

interface InvoicePreviewProps {
  bill: Bill;
  businessProfile: UserProfile | null;
  qrUrl: string | null;
  qrCaption: string;
  upiId?: string;
}

/**
 * The printable invoice card shown inside the bill-detail modal: business
 * header (with optional GSTIN), billed-to, line items, notes/terms, the
 * payment QR, and the totals block (discount/tax rows appear only when used).
 * Purely presentational — the PDF is generated separately in `utils/pdf.ts`.
 */
export const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  bill,
  businessProfile,
  qrUrl,
  qrCaption,
  upiId,
}) => {
  const business = businessProfile?.businessName || 'Bill Counter';

  return (
    <div
      id="invoice-pdf-content"
      className="w-full max-w-[800px] p-8 md:p-12 bg-white shadow-md rounded-xl text-gray-800"
      style={{ boxSizing: 'border-box' }}
    >
      {/* Header: brand + invoice title */}
      <div className="flex justify-between items-start border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-4xl font-extrabold text-blue-600 uppercase tracking-tight">Invoice</h1>
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
          <h3 className="font-bold text-gray-900 text-lg">{business}</h3>
          {businessProfile?.address && (
            <p className="text-xs text-gray-500 whitespace-pre-wrap max-w-xs ml-auto">
              {businessProfile.address}
            </p>
          )}
          {businessProfile?.phone && (
            <p className="text-xs text-gray-500">Phone: {businessProfile.phone}</p>
          )}
          {businessProfile?.gstin && (
            <p className="text-xs text-gray-500">
              GSTIN: <span className="font-semibold text-gray-700">{businessProfile.gstin}</span>
            </p>
          )}
        </div>
      </div>

      {/* Billed to */}
      <div className="grid grid-cols-2 gap-6 py-6 border-b border-gray-100">
        <div>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
            Billed To
          </span>
          <span className="font-bold text-gray-850 mt-1 block">{bill.customerName}</span>
        </div>
      </div>

      {/* Items */}
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

      {/* Notes / terms + totals */}
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
                Terms &amp; Conditions
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

      {/* Footer */}
      <div className="text-center pt-10 text-xs text-gray-400 font-medium">
        Thank you for supporting {business}! 🧶
      </div>
    </div>
  );
};
