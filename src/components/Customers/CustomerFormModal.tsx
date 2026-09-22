import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaIcon } from '../shared/FaIcon';
import { Customer, OpeningBalanceType, PartyType } from '../../types';
import { useToast } from '../../hooks/useToast';
import { validateEmail, validateGSTIN, validatePAN, panFromGSTIN } from '../../utils/validators';
import { CustomerInput } from '../../services/db';
import { Select, Combobox } from '../ui/Select';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CustomerInput) => Promise<void>;
  customer?: Customer | null;
}

const PARTY_CATEGORIES = ['Retail', 'Wholesale', 'Dealer', 'Distributor', 'Online', 'Walk-in', 'Corporate'];

const Field: React.FC<{ label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode }> = ({
  label,
  required,
  hint,
  error,
  children,
}) => (
  <div>
    <label className="block text-sm font-semibold text-slate-600 mb-1.5">
      {label}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    {children}
    {error ? (
      <p className="mt-1 text-xs text-rose-600">{error}</p>
    ) : hint ? (
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
    ) : null}
  </div>
);

const inputCls =
  'w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition';
const inputErrCls = 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20';

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  customer,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [partyType, setPartyType] = useState<PartyType>('customer');
  const [category, setCategory] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [openingBalanceType, setOpeningBalanceType] = useState<OpeningBalanceType>('to_collect');
  const [address, setAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [creditPeriod, setCreditPeriod] = useState('30');
  const [creditLimit, setCreditLimit] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveAndNew, setSaveAndNew] = useState(false);
  const toast = useToast();

  const reset = (c?: Customer | null) => {
    setName(c?.name || '');
    setPhone(c?.phone || '');
    setEmail(c?.email || '');
    setGstin(c?.gstin || '');
    setPan(c?.pan || '');
    setPartyType(c?.partyType || 'customer');
    setCategory(c?.category || '');
    setOpeningBalance(c?.openingBalance ? String(c.openingBalance) : '');
    setOpeningBalanceType(c?.openingBalanceType || 'to_collect');
    setAddress(c?.address || '');
    setShippingAddress(c?.shippingAddress || '');
    setSameAsBilling(c ? c.shippingSameAsBilling !== false : true);
    setCreditPeriod(c?.creditPeriod != null ? String(c.creditPeriod) : '30');
    setCreditLimit(c?.creditLimit ? String(c.creditLimit) : '');
    setErrors({});
  };

  useEffect(() => {
    if (isOpen) reset(customer);
  }, [isOpen, customer]);

  // Lock body scroll while the sheet is open.
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const clearError = (k: string) =>
    setErrors((e) => {
      if (!e[k]) return e;
      const n = { ...e };
      delete n[k];
      return n;
    });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Customer name is required';
    if (email.trim() && !validateEmail(email.trim())) e.email = 'Enter a valid email address';
    if (phone.trim() && phone.replace(/\D/g, '').length < 10) e.phone = 'Enter a valid mobile number';
    if (!validateGSTIN(gstin)) e.gstin = 'Invalid GSTIN format (e.g. 24AAYFG2879D1ZZ)';
    if (!validatePAN(pan)) e.pan = 'Invalid PAN format (e.g. AAYFG2879D)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleGstinChange = (v: string) => {
    const upper = v.toUpperCase();
    setGstin(upper);
    clearError('gstin');
    const derived = panFromGSTIN(upper);
    if (derived && !pan) setPan(derived);
  };

  const buildPayload = (): CustomerInput => ({
    name: name.trim(),
    phone: phone.trim(),
    email: email.trim(),
    gstin: gstin.trim().toUpperCase(),
    pan: pan.trim().toUpperCase(),
    partyType,
    category: category.trim(),
    openingBalance: parseFloat(openingBalance) || 0,
    openingBalanceType,
    address: address.trim(),
    shippingAddress: sameAsBilling ? address.trim() : shippingAddress.trim(),
    shippingSameAsBilling: sameAsBilling,
    creditPeriod: parseInt(creditPeriod) || 0,
    creditLimit: parseFloat(creditLimit) || 0,
  });

  const submit = async (andNew: boolean) => {
    if (!validate()) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    try {
      setIsSubmitting(true);
      setSaveAndNew(andNew);
      await onSubmit(buildPayload());
      if (andNew && !customer) {
        reset(null);
      } else {
        onClose();
      }
    } catch (err) {
      // error toast handled by caller
    } finally {
      setIsSubmitting(false);
      setSaveAndNew(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(false);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-100 animate-in fade-in duration-200">
      {/* Top bar */}
      <div className="shrink-0 flex items-center justify-between gap-3 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Back"
          >
            <FaIcon icon="fa-solid fa-arrow-left" size={16} />
          </button>
          <h2 className="text-lg font-bold text-slate-800 truncate">
            {customer ? 'Edit Customer' : 'Create Customer'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {!customer && (
            <button
              type="button"
              onClick={() => submit(true)}
              disabled={isSubmitting}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-700 text-brand-700 text-sm font-semibold hover:bg-brand-50 transition-colors disabled:opacity-60"
            >
              {isSubmitting && saveAndNew ? (
                <FaIcon icon="fa-solid fa-spinner" size={14} className="animate-spin" />
              ) : null}
              Save &amp; New
            </button>
          )}
          <button
            type="button"
            onClick={() => submit(false)}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-brand-800 hover:bg-brand-900 text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-60"
          >
            {isSubmitting && !saveAndNew ? (
              <FaIcon icon="fa-solid fa-spinner" size={14} className="animate-spin" />
            ) : (
              <FaIcon icon="fa-solid fa-floppy-disk" size={14} />
            )}
            Save
          </button>
        </div>
      </div>

      {/* Body */}
      <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-4">
          {/* General details */}
          <section className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <header className="px-5 py-3 border-b border-slate-200 bg-slate-50/60">
              <h3 className="text-sm font-bold text-slate-700">General Details</h3>
            </header>
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Field label="Customer Name" required error={errors.name}>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      clearError('name');
                    }}
                    placeholder="Enter name"
                    className={`${inputCls} ${errors.name ? inputErrCls : ''}`}
                    autoFocus
                  />
                </Field>
                <Field label="Mobile Number" error={errors.phone}>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      clearError('phone');
                    }}
                    placeholder="Enter mobile number"
                    className={`${inputCls} ${errors.phone ? inputErrCls : ''}`}
                  />
                </Field>
                <Field label="Email" error={errors.email}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearError('email');
                    }}
                    placeholder="Enter email"
                    className={`${inputCls} ${errors.email ? inputErrCls : ''}`}
                  />
                </Field>
                <Field label="Opening Balance">
                  <div className="flex rounded-lg border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-600">
                    <span className="px-3 flex items-center text-sm text-slate-500 bg-slate-50 border-r border-slate-200">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={openingBalance}
                      onChange={(e) => setOpeningBalance(e.target.value)}
                      placeholder="0"
                      className="flex-1 min-w-0 px-3 py-2.5 text-sm text-slate-800 focus:outline-none"
                    />
                    <Select
                      variant="embedded"
                      align="end"
                      aria-label="Opening balance type"
                      options={[
                        { value: 'to_collect', label: 'To Collect' },
                        { value: 'to_pay', label: 'To Pay' },
                      ]}
                      value={openingBalanceType}
                      onChange={(v) => setOpeningBalanceType(v as OpeningBalanceType)}
                      className="border-l border-slate-200 bg-white font-normal"
                    />
                  </div>
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2">
                  <Field
                    label="GSTIN"
                    error={errors.gstin}
                    hint="Note: PAN is auto-filled from a valid GSTIN"
                  >
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={gstin}
                        onChange={(e) => handleGstinChange(e.target.value)}
                        placeholder="ex: 29XXXXX9438X1XX"
                        maxLength={15}
                        className={`${inputCls} uppercase font-mono ${errors.gstin ? inputErrCls : ''}`}
                      />
                      <button
                        type="button"
                        disabled
                        title="Auto-fetch party details from the GST portal is not available in this version"
                        className="shrink-0 px-4 py-2.5 rounded-lg bg-brand-100 text-brand-400 text-sm font-semibold cursor-not-allowed"
                      >
                        Get Details
                      </button>
                    </div>
                  </Field>
                </div>
                <Field label="PAN Number" error={errors.pan}>
                  <input
                    type="text"
                    value={pan}
                    onChange={(e) => {
                      setPan(e.target.value.toUpperCase());
                      clearError('pan');
                    }}
                    placeholder="Enter customer PAN Number"
                    maxLength={10}
                    className={`${inputCls} uppercase font-mono ${errors.pan ? inputErrCls : ''}`}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
                <Field label="Customer Type" required>
                  <Select
                    aria-label="Customer type"
                    options={[
                      { value: 'customer', label: 'Customer' },
                      { value: 'supplier', label: 'Supplier' },
                    ]}
                    value={partyType}
                    onChange={(v) => setPartyType(v as PartyType)}
                  />
                </Field>
                <Field label="Category">
                  <Combobox
                    aria-label="Customer category"
                    options={PARTY_CATEGORIES}
                    value={category}
                    onChange={setCategory}
                    placeholder="Search Categories"
                    className={inputCls}
                  />
                </Field>
              </div>
            </div>
          </section>

          {/* Address */}
          <section className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <header className="px-5 py-3 border-b border-slate-200 bg-slate-50/60">
              <h3 className="text-sm font-bold text-slate-700">Address</h3>
            </header>
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Field label="Billing Address">
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter billing address"
                    rows={3}
                    className={inputCls}
                  />
                </Field>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-semibold text-slate-600">Shipping Address</label>
                    <label className="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={sameAsBilling}
                        onChange={(e) => setSameAsBilling(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500"
                      />
                      Same as Billing address
                    </label>
                  </div>
                  <textarea
                    value={sameAsBilling ? address : shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Enter shipping address"
                    rows={3}
                    disabled={sameAsBilling}
                    className={`${inputCls} disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
                <Field label="Credit Period" hint="Default payment terms used on new invoices">
                  <div className="flex rounded-lg border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-600">
                    <input
                      type="number"
                      min="0"
                      value={creditPeriod}
                      onChange={(e) => setCreditPeriod(e.target.value)}
                      placeholder="30"
                      className="flex-1 min-w-0 px-3 py-2.5 text-sm text-slate-800 focus:outline-none"
                    />
                    <span className="px-3 flex items-center text-sm text-slate-500 bg-slate-50 border-l border-slate-200">Days</span>
                  </div>
                </Field>
                <Field label="Credit Limit">
                  <div className="flex rounded-lg border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-600">
                    <span className="px-3 flex items-center text-sm text-slate-500 bg-slate-50 border-r border-slate-200">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(e.target.value)}
                      placeholder="0"
                      className="flex-1 min-w-0 px-3 py-2.5 text-sm text-slate-800 focus:outline-none"
                    />
                  </div>
                </Field>
              </div>
            </div>
          </section>

          {/* Mobile-only Save & New */}
          {!customer && (
            <button
              type="button"
              onClick={() => submit(true)}
              disabled={isSubmitting}
              className="sm:hidden w-full py-2.5 rounded-lg border border-brand-700 text-brand-700 text-sm font-semibold hover:bg-brand-50 disabled:opacity-60"
            >
              Save &amp; New
            </button>
          )}
        </div>
        {/* hidden submit so Enter saves */}
        <button type="submit" className="hidden" aria-hidden />
      </form>
    </div>,
    document.body
  );
};
