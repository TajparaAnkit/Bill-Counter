interface BillTotalsSummaryProps {
  subtotal: number;
  discountValue: string;
  discountMode: 'amount' | 'percent';
  onDiscountValueChange: (value: string) => void;
  onDiscountModeChange: (mode: 'amount' | 'percent') => void;
  discountAmount: number;
  taxEnabled: boolean;
  taxRate: string;
  onTaxRateChange: (value: string) => void;
  taxAmount: number;
  grandTotal: number;
}

/**
 * Totals box for the invoice form: subtotal, an optional discount (flat ₹ or %
 * via the toggle), an optional tax rate (only when GST is enabled in Settings),
 * and the grand total. Discount and tax rows only affect the total when used.
 */
export const BillTotalsSummary: React.FC<BillTotalsSummaryProps> = ({
  subtotal,
  discountValue,
  discountMode,
  onDiscountValueChange,
  onDiscountModeChange,
  discountAmount,
  taxEnabled,
  taxRate,
  onTaxRateChange,
  taxAmount,
  grandTotal,
}) => {
  return (
    <div className="w-full md:w-80 bg-gray-50 p-4 rounded-xl space-y-2.5">
      <div className="flex justify-between text-sm text-gray-600">
        <span>Subtotal</span>
        <span>₹{subtotal.toFixed(2)}</span>
      </div>

      {/* Discount (optional) */}
      <div className="flex justify-between items-center text-sm text-gray-600 gap-2">
        <div className="flex items-center gap-1.5">
          <span>Discount</span>
          <div className="flex rounded-md border border-gray-300 overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => onDiscountModeChange('amount')}
              title="Flat discount in rupees (₹)"
              aria-label="Discount in rupees"
              className={`px-1.5 py-0.5 ${discountMode === 'amount' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500'}`}
            >
              ₹
            </button>
            <button
              type="button"
              onClick={() => onDiscountModeChange('percent')}
              title="Percentage discount (% of subtotal)"
              aria-label="Discount as percentage"
              className={`px-1.5 py-0.5 ${discountMode === 'percent' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500'}`}
            >
              %
            </button>
          </div>
        </div>
        <input
          type="number"
          min="0"
          step="0.01"
          value={discountValue}
          onChange={(e) => onDiscountValueChange(e.target.value)}
          placeholder="0"
          className="w-20 text-right px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
        />
      </div>
      {discountAmount > 0 && (
        <div className="flex justify-between text-xs text-blue-600">
          <span>Discount applied</span>
          <span>−₹{discountAmount.toFixed(2)}</span>
        </div>
      )}

      {/* Tax (optional — only when enabled in Settings) */}
      {taxEnabled && (
        <div className="flex justify-between items-center text-sm text-gray-600 gap-2">
          <div className="flex items-center gap-1.5">
            <span>Tax</span>
            <div className="flex items-center">
              <input
                type="number"
                min="0"
                step="0.01"
                value={taxRate}
                onChange={(e) => onTaxRateChange(e.target.value)}
                placeholder="0"
                className="w-14 text-right px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              />
              <span className="ml-1">%</span>
            </div>
          </div>
          <span>₹{taxAmount.toFixed(2)}</span>
        </div>
      )}

      <div className="flex justify-between font-bold text-gray-900 text-lg border-t border-gray-200 pt-2 mt-1">
        <span>Total</span>
        <span className="text-blue-600">₹{grandTotal.toFixed(2)}</span>
      </div>
    </div>
  );
};
