import React, { useState, useEffect } from 'react';
import { FaIcon } from '../shared/FaIcon';
import { Product, BillItem, Customer } from '../../types';
import { getNextBillNumber } from '../../services/db';
import { useToast } from '../../hooks/useToast';

export interface BillCustomerInput {
  name: string;
  customerId?: string;
  customerPhone?: string;
}

export interface BillTotalsInput {
  discount: number; // discount amount in ₹
  taxRate: number; // tax %
}

interface BillFormProps {
  userId: string;
  products: Product[];
  customers?: Customer[];
  billPrefix?: string;
  taxEnabled?: boolean;
  defaultTaxRate?: number;
  onSave: (
    customer: BillCustomerInput,
    items: BillItem[],
    totals: BillTotalsInput,
    notes?: string
  ) => Promise<void>;
  onCancel: () => void;
}

export const BillForm: React.FC<BillFormProps> = ({
  userId,
  products,
  customers = [],
  billPrefix,
  taxEnabled = false,
  defaultTaxRate = 0,
  onSave,
  onCancel,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [billNo, setBillNo] = useState('Loading...');
  const [items, setItems] = useState<BillItem[]>([
    { productName: '', quantity: 1, price: 0, total: 0 }
  ]);
  const [notes, setNotes] = useState('');
  const [discountValue, setDiscountValue] = useState('');
  const [discountMode, setDiscountMode] = useState<'amount' | 'percent'>('amount');
  const [taxRate, setTaxRate] = useState(defaultTaxRate ? String(defaultTaxRate) : '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = useToast();

  // Prefill tax rate from the business default once it's available.
  useEffect(() => {
    if (taxEnabled && defaultTaxRate && !taxRate) {
      setTaxRate(String(defaultTaxRate));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taxEnabled, defaultTaxRate]);

  useEffect(() => {
    const fetchBillNo = async () => {
      try {
        const next = await getNextBillNumber(userId, billPrefix);
        setBillNo(next.billNo);
      } catch (err) {
        console.error(err);
      }
    };
    fetchBillNo();
  }, [userId]);

  const handleAddItem = () => {
    setItems([...items, { productName: '', quantity: 1, price: 0, total: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      toast.warning('A bill must have at least one item');
      return;
    }
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleItemChange = (index: number, field: keyof BillItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index] };

    if (field === 'productName') {
      item.productName = value;
      // If product exists in database, auto-fill price
      const matchedProduct = products.find(
        (p) => p.name.toLowerCase() === value.toLowerCase()
      );
      if (matchedProduct) {
        item.productId = matchedProduct.id;
        item.price = matchedProduct.price;
      }
    } else if (field === 'quantity') {
      const q = parseInt(value) || 0;
      item.quantity = q;
    } else if (field === 'price') {
      const p = parseFloat(value) || 0;
      item.price = p;
    }

    item.total = item.quantity * item.price;
    newItems[index] = item;
    setItems(newItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  // Derived, live totals (discount + tax are both optional)
  const subtotal = calculateSubtotal();
  const rawDiscount =
    discountMode === 'percent'
      ? subtotal * ((parseFloat(discountValue) || 0) / 100)
      : parseFloat(discountValue) || 0;
  const discountAmount = Math.min(subtotal, Math.max(0, rawDiscount));
  const taxable = subtotal - discountAmount;
  const effectiveRate = taxEnabled ? Math.max(0, parseFloat(taxRate) || 0) : 0;
  const taxAmount = taxable * (effectiveRate / 100);
  const grandTotal = taxable + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      toast.error('Customer name is required');
      return;
    }

    const validItems = items.filter(i => i.productName.trim() && i.quantity > 0 && i.price >= 0);
    if (validItems.length === 0) {
      toast.error('Please enter at least one valid item');
      return;
    }

    try {
      setIsSubmitting(true);
      const trimmedName = customerName.trim();
      const matched = customers.find(
        (c) => c.name.toLowerCase() === trimmedName.toLowerCase()
      );
      await onSave(
        {
          name: trimmedName,
          customerId: matched?.id,
          customerPhone: matched?.phone || undefined,
        },
        validItems,
        { discount: discountAmount, taxRate: effectiveRate },
        notes.trim()
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-150 p-6 space-y-6">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between gap-6 border-b border-gray-150 pb-6">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-gray-800">Create New Invoice</h2>
          <div className="text-sm text-gray-500">
            Invoice No: <b className="text-gray-800">{billNo}</b>
          </div>
          <div className="text-sm text-gray-500">
            Date: <span className="text-gray-800">{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        <div className="w-full md:w-80">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Customer Name *
          </label>
          <input
            type="text"
            list="customers-list"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="e.g. Walk-in or select a saved customer"
            className="input-field"
            required
          />
          <datalist id="customers-list">
            {customers.map((c) => (
              <option key={c.id} value={c.name}>
                {c.phone ? `${c.phone}` : ''}
              </option>
            ))}
          </datalist>
        </div>
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-150 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="pb-3 pr-4">Item Name / Product</th>
              <th className="pb-3 px-4 w-28">Quantity</th>
              <th className="pb-3 px-4 w-36">Price (₹)</th>
              <th className="pb-3 px-4 w-36">Total (₹)</th>
              <th className="pb-3 pl-4 w-12 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-150">
            {items.map((item, index) => (
              <tr key={index} className="align-middle">
                {/* Product Name with Suggestions */}
                <td className="py-3 pr-4 relative">
                  <input
                    type="text"
                    list={`products-list-${index}`}
                    value={item.productName}
                    onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                    placeholder="Enter item name or select product"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                    required
                  />
                  <datalist id={`products-list-${index}`}>
                    {products.map((p) => (
                      <option key={p.id} value={p.name}>
                        ₹{p.price.toFixed(2)}
                      </option>
                    ))}
                  </datalist>
                </td>

                {/* Quantity */}
                <td className="py-3 px-4">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm text-center"
                    required
                  />
                </td>

                {/* Price */}
                <td className="py-3 px-4">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.price}
                    onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                    required
                  />
                </td>

                {/* Total */}
                <td className="py-3 px-4 font-bold text-gray-700">
                  ₹{item.total.toFixed(2)}
                </td>

                {/* Delete button */}
                <td className="py-3 pl-4 text-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <FaIcon icon="fa-solid fa-trash" size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Row Button */}
      <button
        type="button"
        onClick={handleAddItem}
        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors"
      >
        <FaIcon icon="fa-solid fa-plus" size={16} />
        <span>Add Line Item</span>
      </button>

      {/* Footer Notes & Total Summary */}
      <div className="flex flex-col md:flex-row justify-between gap-6 border-t border-gray-150 pt-6">
        <div className="flex-1">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Invoice Notes / Payment Terms
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Please pay online via UPI or Bank Transfer. Hand-delivered item."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-gray-50 focus:bg-white"
          />
        </div>

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
                  onClick={() => setDiscountMode('amount')}
                  title="Flat discount in rupees (₹)"
                  aria-label="Discount in rupees"
                  className={`px-1.5 py-0.5 ${discountMode === 'amount' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500'}`}
                >₹</button>
                <button
                  type="button"
                  onClick={() => setDiscountMode('percent')}
                  title="Percentage discount (% of subtotal)"
                  aria-label="Discount as percentage"
                  className={`px-1.5 py-0.5 ${discountMode === 'percent' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500'}`}
                >%</button>
              </div>
            </div>
            <input
              type="number"
              min="0"
              step="0.01"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
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
                    onChange={(e) => setTaxRate(e.target.value)}
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
      </div>

      {/* Action buttons */}
      <div className="flex justify-end space-x-3 border-t border-gray-150 pt-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary flex items-center space-x-2"
        >
          {isSubmitting ? (
            <>
              <FaIcon icon="fa-solid fa-spinner" size={18} className="animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <FaIcon icon="fa-solid fa-floppy-disk" size={18} />
              <span>Save Bill</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
