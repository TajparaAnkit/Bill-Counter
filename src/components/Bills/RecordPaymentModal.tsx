import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaIcon } from '../shared/FaIcon';
import { Select } from '../ui/Select';
import { Bill, BillPayment, PaymentMethod } from '../../types';
import { PAYMENT_METHOD_OPTIONS, getAmountDue, newPaymentId } from '../../utils/payment';
import { todayISO } from '../../utils/tax';

interface RecordPaymentModalProps {
  isOpen: boolean;
  bill: Bill;
  onClose: () => void;
  onSave: (payment: BillPayment) => Promise<void>;
}

const label = 'block text-xs font-semibold text-slate-600 mb-1.5';
const field =
  'w-full px-3 py-2.5 bg-white border border-slate-300 rounded-md text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600';

// "Payment In" dialog (myBillBook-style): amount received now, date, mode and
// an optional note. Opens above the invoice modal (z-[60]).
export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ isOpen, bill, onClose, onSave }) => {
  const due = getAmountDue(bill);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setAmount(due > 0 ? String(due) : '');
    setDate(todayISO());
    setMethod(bill.paymentMethod || 'cash');
    setNote('');
    setError(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const value = parseFloat(amount);
  const remaining = Math.max(0, Math.round((due - (isNaN(value) ? 0 : value)) * 100) / 100);

  const submit = async () => {
    if (isNaN(value) || value <= 0) return setError('Enter an amount greater than 0');
    if (value > due + 0.001) return setError(`Cannot exceed the balance due (₹${due.toFixed(2)})`);
    if (!date) return setError('Choose the payment date');
    try {
      setSaving(true);
      await onSave({ id: newPaymentId(), amount: Math.round(value * 100) / 100, date, method, note: note.trim() || undefined });
      onClose();
    } catch {
      // parent shows the toast; keep the dialog open so nothing is lost
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <FaIcon icon="fa-solid fa-indian-rupee-sign" size={15} />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-800">Record Payment In</h3>
              <p className="text-xs text-slate-500">
                {bill.billNo} · {bill.customerName}
              </p>
            </div>
          </div>
          <button onClick={onClose} disabled={saving} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-full" aria-label="Close">
            <FaIcon icon="fa-solid fa-xmark" size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              ['Invoice Total', bill.total || 0, 'text-slate-800'],
              ['Received', bill.amountPaid || 0, 'text-emerald-600'],
              ['Balance Due', due, 'text-rose-600'],
            ].map(([k, v, c]) => (
              <div key={k as string} className="rounded-lg bg-slate-50 border border-slate-200 px-2 py-2">
                <p className="text-[11px] font-semibold text-slate-500">{k}</p>
                <p className={`text-sm font-bold ${c}`}>₹{(v as number).toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div>
            <label className={label} htmlFor="pay-amount">
              Amount Received <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold pointer-events-none">₹</span>
              <input
                id="pay-amount"
                autoFocus
                type="number"
                inputMode="decimal"
                min={0}
                max={due}
                step="0.01"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                className={`${field} pl-7 ${error ? 'border-rose-400' : ''}`}
              />
            </div>
            {error ? (
              <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>
            ) : (
              <p className="mt-1 text-xs text-slate-400">
                Enter only the money received now. Balance after this payment: <strong className="text-slate-600">₹{remaining.toFixed(2)}</strong>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label} htmlFor="pay-date">
                Payment Date
              </label>
              <input id="pay-date" type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} className={field} />
            </div>
            <div>
              <label className={label}>Payment Mode</label>
              <Select aria-label="Payment mode" options={PAYMENT_METHOD_OPTIONS} value={method} onChange={(v) => setMethod(v as PaymentMethod)} />
            </div>
          </div>

          <div>
            <label className={label} htmlFor="pay-note">
              Notes (optional)
            </label>
            <input id="pay-note" type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. UPI ref 4123…, cheque no." maxLength={120} className={field} />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-5 pb-5">
          <button onClick={onClose} disabled={saving} className="px-4 py-2 rounded-lg font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={submit} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving && <FaIcon icon="fa-solid fa-spinner" size={14} className="animate-spin" />}
            Save Payment
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
