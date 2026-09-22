import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FaIcon } from '../shared/FaIcon';
import {
  AdditionalCharge,
  Bill,
  BillItem,
  Customer,
  PartySnapshot,
  PaymentMethod,
  Product,
  UserProfile,
} from '../../types';
import { getNextBillNumber } from '../../services/db';
import { useToast } from '../../hooks/useToast';
import {
  GST_RATES,
  INDIAN_STATES,
  addDaysISO,
  computeBillTotals,
  computeLine,
  daysBetweenISO,
  round2,
  stateFromGSTIN,
  todayISO,
} from '../../utils/tax';
import { InvoicePaper } from './InvoicePaper';
import { Select, Combobox } from '../ui/Select';
import { generateUpiQrDataUrl } from '../../utils/upiQr';
import { validateGSTIN, validatePAN, panFromGSTIN } from '../../utils/validators';
import { BRAND_NAME } from '../../config/brand';

export type BillDraft = Omit<Bill, 'id' | 'userId' | 'createdAt'>;

interface BillFormProps {
  userId: string;
  products: Product[];
  customers?: Customer[];
  profile: UserProfile | null;
  existingBillNos?: string[];
  onSave: (bill: BillDraft) => Promise<void>;
  onCancel: () => void;
}

interface Row {
  key: number;
  productId?: string;
  productName: string;
  description: string;
  showDescription: boolean;
  hsn: string;
  unit: string;
  quantity: string;
  price: string;
  discountMode: 'amount' | 'percent';
  discountValue: string;
  taxRate: string;
}

let rowKey = 1;
const newRow = (defaultTax: number): Row => ({
  key: rowKey++,
  productName: '',
  description: '',
  showDescription: false,
  hsn: '',
  unit: 'PCS',
  quantity: '1',
  price: '',
  discountMode: 'amount',
  discountValue: '',
  taxRate: String(defaultTax || 0),
});

const money = (n: number) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const cell =
  'w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition';
const field =
  'w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition';
const label = 'block text-sm font-semibold text-slate-600 mb-1.5';
const linkBtn =
  'flex items-center gap-2.5 w-full text-left px-5 py-3.5 text-sm font-semibold text-brand-700 hover:bg-brand-50/60 transition-colors border-b border-slate-200';

const partyFromCustomer = (c: Customer): PartySnapshot => ({
  name: c.name,
  address: c.address || '',
  phone: c.phone || '',
  email: c.email || '',
  gstin: c.gstin || '',
  pan: c.pan || '',
});

export const BillForm: React.FC<BillFormProps> = ({
  userId,
  products,
  customers = [],
  profile,
  existingBillNos = [],
  onSave,
  onCancel,
}) => {
  const toast = useToast();
  const defaultTax = profile?.taxEnabled ? profile.defaultTaxRate || 0 : 0;

  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ---- Party ----
  const [customerId, setCustomerId] = useState<string | undefined>();
  const [billTo, setBillTo] = useState<PartySnapshot>({ name: '' });
  const [shipTo, setShipTo] = useState<PartySnapshot>({ name: '' });
  const [editingShipTo, setEditingShipTo] = useState(false);
  const [editingBillTo, setEditingBillTo] = useState(false);
  const [partyPickerOpen, setPartyPickerOpen] = useState(true);
  const [partySearch, setPartySearch] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);

  // ---- Invoice details ----
  const [prefix, setPrefix] = useState((profile?.billPrefix || 'INV').toUpperCase());
  const [seq, setSeq] = useState<string>('');
  const [seqLoading, setSeqLoading] = useState(true);
  const [invoiceDate, setInvoiceDate] = useState(todayISO());
  const [paymentTerms, setPaymentTerms] = useState('0');
  const [dueDate, setDueDate] = useState(todayISO());
  const [vehicleNo, setVehicleNo] = useState('');
  const [placeOfSupply, setPlaceOfSupply] = useState(profile?.state || '');

  // ---- Items ----
  const [rows, setRows] = useState<Row[]>([newRow(defaultTax)]);

  // ---- Bill-level ----
  const [charges, setCharges] = useState<AdditionalCharge[]>([]);
  const [showCharges, setShowCharges] = useState(false);
  const [billDiscount, setBillDiscount] = useState('');
  const [showBillDiscount, setShowBillDiscount] = useState(false);
  const [autoRoundOff, setAutoRoundOff] = useState(false);
  const [manualRoundSign, setManualRoundSign] = useState<'+' | '-'>('+');
  const [manualRound, setManualRound] = useState('');

  // ---- Payment ----
  const [amountReceived, setAmountReceived] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [fullyPaid, setFullyPaid] = useState(false);

  // ---- Extras ----
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [showTerms, setShowTerms] = useState(!!profile?.invoiceNotes);
  const [terms, setTerms] = useState(profile?.invoiceNotes || '');
  const hasBank = !!(profile?.bankAccountNo || profile?.bankName);
  const [showBank, setShowBank] = useState(false);
  const [showQr, setShowQr] = useState(!!profile?.upiId);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  // Next sequence number
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = await getNextBillNumber(userId, prefix);
        if (!cancelled) setSeq(String(next.billSeqNum));
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setSeqLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Close the party picker on outside click
  useEffect(() => {
    if (!partyPickerOpen) return;
    const onDown = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPartyPickerOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [partyPickerOpen]);

  const billNo = `${(prefix || 'INV').trim().toUpperCase()}-${String(parseInt(seq) || 0).padStart(4, '0')}`;
  const isDuplicateNo = existingBillNos.includes(billNo);

  // ---- Derived line + bill totals ----
  const computedRows = useMemo(
    () =>
      rows.map((r) => {
        const qty = parseFloat(r.quantity) || 0;
        const price = parseFloat(r.price) || 0;
        const line = computeLine(
          {
            quantity: qty,
            price,
            discount: r.discountMode === 'amount' ? parseFloat(r.discountValue) || 0 : 0,
            discountPercent: r.discountMode === 'percent' ? parseFloat(r.discountValue) || 0 : 0,
            taxRate: parseFloat(r.taxRate) || 0,
          },
          r.discountMode
        );
        return { row: r, line };
      }),
    [rows]
  );

  const items: BillItem[] = useMemo(
    () =>
      computedRows
        .filter(({ row, line }) => row.productName.trim() && line.gross >= 0 && (parseFloat(row.quantity) || 0) > 0)
        .map(({ row, line }) => ({
          productId: row.productId,
          productName: row.productName.trim(),
          description: row.description.trim(),
          hsn: row.hsn.trim(),
          unit: row.unit,
          quantity: parseFloat(row.quantity) || 0,
          price: parseFloat(row.price) || 0,
          discount: line.discount,
          discountPercent: line.discountPercent,
          taxRate: line.taxRate,
          taxable: line.taxable,
          taxAmount: line.taxAmount,
          total: line.total,
        })),
    [computedRows]
  );

  const interState = !!profile?.state && !!placeOfSupply && profile.state !== placeOfSupply;
  const totals = useMemo(
    () =>
      computeBillTotals({
        items,
        additionalCharges: charges,
        billDiscount: parseFloat(billDiscount) || 0,
        autoRoundOff,
        manualRoundOff: autoRoundOff ? 0 : (manualRoundSign === '-' ? -1 : 1) * (parseFloat(manualRound) || 0),
        interState,
      }),
    [items, charges, billDiscount, autoRoundOff, manualRoundSign, manualRound, interState]
  );

  const received = fullyPaid ? totals.total : Math.min(totals.total, Math.max(0, parseFloat(amountReceived) || 0));
  const balance = round2(totals.total - received);
  const totalQty = computedRows.reduce((s, r) => s + (parseFloat(r.row.quantity) || 0), 0);

  // Preview QR
  useEffect(() => {
    if (mode !== 'preview' || !showQr || !profile?.upiId) {
      setQrUrl(null);
      return;
    }
    let cancelled = false;
    generateUpiQrDataUrl({ upiId: profile.upiId, payeeName: profile?.businessName?.trim() || BRAND_NAME, amount: totals.total, note: billNo }).then((url) => {
      if (!cancelled) setQrUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [mode, showQr, profile?.upiId, totals.total, billNo]);

  // ---- Handlers ----
  const selectCustomer = (c: Customer) => {
    setCustomerId(c.id);
    const snap = partyFromCustomer(c);
    setBillTo(snap);
    setShipTo({
      name: c.name,
      address: c.shippingSameAsBilling === false && c.shippingAddress ? c.shippingAddress : c.address || '',
      phone: c.phone || '',
    });
    const pos = stateFromGSTIN(c.gstin) || profile?.state || '';
    if (pos) setPlaceOfSupply(pos);
    const termsDays = c.creditPeriod || 0;
    setPaymentTerms(String(termsDays));
    setDueDate(addDaysISO(invoiceDate, termsDays));
    setPartyPickerOpen(false);
    setPartySearch('');
    setEditingBillTo(false);
  };

  const useWalkIn = (name: string) => {
    const n = name.trim();
    if (!n) return;
    setCustomerId(undefined);
    setBillTo({ name: n });
    setShipTo({ name: n });
    setPartyPickerOpen(false);
    setPartySearch('');
  };

  const filteredCustomers = useMemo(() => {
    const t = partySearch.trim().toLowerCase();
    const list = customers.filter((c) => c.partyType !== 'supplier');
    if (!t) return list.slice(0, 50);
    return list
      .filter(
        (c) =>
          c.name.toLowerCase().includes(t) ||
          (c.phone || '').toLowerCase().includes(t) ||
          (c.gstin || '').toLowerCase().includes(t)
      )
      .slice(0, 50);
  }, [customers, partySearch]);

  const onInvoiceDateChange = (d: string) => {
    setInvoiceDate(d);
    setDueDate(addDaysISO(d, parseInt(paymentTerms) || 0));
  };
  const onTermsChange = (v: string) => {
    setPaymentTerms(v);
    setDueDate(addDaysISO(invoiceDate, parseInt(v) || 0));
  };
  const onDueDateChange = (d: string) => {
    setDueDate(d);
    setPaymentTerms(String(Math.max(0, daysBetweenISO(invoiceDate, d))));
  };

  const updateRow = (key: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const productOptions = useMemo(
    () => products.map((p) => ({ value: p.name, label: p.name, hint: money(p.price) })),
    [products]
  );

  const onProductName = (key: number, value: string) => {
    const matched = products.find((p) => p.name.toLowerCase() === value.toLowerCase());
    updateRow(key, {
      productName: value,
      ...(matched
        ? {
            productId: matched.id,
            price: String(matched.price),
            hsn: matched.hsn || '',
            unit: matched.unit || 'PCS',
            taxRate: String(matched.taxRate ?? defaultTax),
          }
        : { productId: undefined }),
    });
  };

  const removeRow = (key: number) => {
    if (rows.length === 1) {
      toast.warning('A bill must have at least one item');
      return;
    }
    setRows((rs) => rs.filter((r) => r.key !== key));
  };

  const draft = (): BillDraft => {
    const status = received <= 0 ? 'unpaid' : received >= totals.total ? 'paid' : 'partial';
    return {
      billNo,
      billSeqNum: parseInt(seq) || 0,
      billPrefix: (prefix || 'INV').trim().toUpperCase(),
      customerName: billTo.name,
      customerId,
      customerPhone: billTo.phone || '',
      items,
      subtotal: totals.subtotal,
      discount: round2(totals.itemDiscount + totals.billDiscount),
      taxRate: totals.uniformTaxRate,
      tax: totals.tax,
      total: totals.total,
      paymentStatus: status,
      amountPaid: received,
      paymentMethod: received > 0 ? paymentMethod : undefined,
      paidAt: status === 'paid' ? new Date() : undefined,
      notes: notes.trim(),
      invoiceDate,
      dueDate,
      paymentTerms: parseInt(paymentTerms) || 0,
      vehicleNo: vehicleNo.trim().toUpperCase(),
      placeOfSupply,
      billTo,
      shipTo,
      taxableAmount: totals.taxableAmount,
      itemDiscount: totals.itemDiscount,
      billDiscount: totals.billDiscount,
      cgst: totals.cgst,
      sgst: totals.sgst,
      igst: totals.igst,
      additionalCharges: charges.filter((c) => c.amount > 0).map((c) => ({ label: c.label.trim() || 'Additional Charge', amount: round2(c.amount) })),
      roundOff: totals.roundOff,
      termsAndConditions: showTerms ? terms.trim() : '',
      showBankDetails: showBank && hasBank,
      showPaymentQr: showQr,
    };
  };

  const handleSave = async () => {
    if (!billTo.name.trim()) {
      toast.error('Please select or enter a party (Bill To)');
      setPartyPickerOpen(true);
      return;
    }
    if ((billTo.gstin && !validateGSTIN(billTo.gstin)) || (billTo.pan && !validatePAN(billTo.pan))) {
      toast.error('Bill To has an invalid GSTIN or PAN');
      setEditingBillTo(true);
      return;
    }
    if (items.length === 0) {
      toast.error('Please enter at least one valid item');
      return;
    }
    if (!(parseInt(seq) > 0)) {
      toast.error('Invoice number must be greater than 0');
      return;
    }
    if (isDuplicateNo) {
      toast.error(`Invoice number ${billNo} already exists`);
      return;
    }
    try {
      setIsSubmitting(true);
      await onSave(draft());
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewBill = { ...draft(), createdAt: new Date() };

  return (
    <div className="-m-4 sm:-m-5 bg-slate-100 min-h-[calc(100vh-6.5rem)] rounded-lg overflow-hidden">
      {/* ===== Top bar ===== */}
      <div className="sticky top-0 z-20 flex items-center justify-between gap-3 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            <FaIcon icon="fa-solid fa-arrow-left" size={14} />
            <span className="hidden sm:inline">Exit</span>
          </button>
          <h2 className="text-lg font-bold text-slate-800 truncate">Create Sales Invoice</h2>
        </div>

        <div className="hidden md:flex items-center bg-slate-100 rounded-lg p-1">
          {(['edit', 'preview'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                mode === m ? 'bg-white text-brand-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <FaIcon icon={m === 'edit' ? 'fa-solid fa-pen-to-square' : 'fa-solid fa-eye'} size={14} />
              {m === 'edit' ? 'Edit Mode' : 'Preview Mode'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')}
            className="md:hidden p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            title={mode === 'edit' ? 'Preview' : 'Edit'}
          >
            <FaIcon icon={mode === 'edit' ? 'fa-solid fa-eye' : 'fa-solid fa-pen-to-square'} size={14} />
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting || seqLoading}
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-lg bg-brand-800 hover:bg-brand-900 text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-60"
          >
            {isSubmitting ? (
              <FaIcon icon="fa-solid fa-spinner" size={14} className="animate-spin" />
            ) : (
              <FaIcon icon="fa-solid fa-floppy-disk" size={14} />
            )}
            <span className="hidden sm:inline">Save Sales Invoice</span>
            <span className="sm:hidden">Save</span>
          </button>
        </div>
      </div>

      {mode === 'preview' ? (
        <div className="p-4 sm:p-8 flex justify-center">
          <InvoicePaper
            bill={previewBill}
            profile={profile}
            qrUrl={qrUrl}
            qrCaption={profile?.upiId ? `Scan to pay ${money(totals.total)}` : undefined}
          />
        </div>
      ) : (
        <div className="p-3 sm:p-4 space-y-3">
          {/* ===== Header panels: Bill To | Ship To | Invoice Details ===== */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm grid grid-cols-1 lg:grid-cols-[1fr_1fr_1.3fr] divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            {/* Bill To */}
            <div className="p-4 relative" ref={pickerRef}>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-semibold text-slate-500">Bill To</span>
                <div className="flex items-center gap-1.5">
                  {billTo.name && (
                    <button
                      type="button"
                      onClick={() => setEditingBillTo((v) => !v)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      title="Edit the details printed on this invoice (does not change the saved party)"
                    >
                      <FaIcon icon={editingBillTo ? 'fa-solid fa-check' : 'fa-solid fa-pen'} size={12} />
                      {editingBillTo ? 'Done' : 'Edit Details'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPartyPickerOpen((o) => !o)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <FaIcon icon="fa-solid fa-rotate" size={12} />
                    {billTo.name ? 'Change Party' : 'Select Party'}
                  </button>
                </div>
              </div>

              {billTo.name && editingBillTo ? (
                <div className="space-y-2">
                  <input type="text" value={billTo.name} onChange={(e) => setBillTo({ ...billTo, name: e.target.value })} placeholder="Party name" className={cell} />
                  <textarea value={billTo.address || ''} onChange={(e) => setBillTo({ ...billTo, address: e.target.value })} placeholder="Billing address" rows={2} className={cell} />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="tel" value={billTo.phone || ''} onChange={(e) => setBillTo({ ...billTo, phone: e.target.value })} placeholder="Mobile" className={cell} />
                    <input type="email" value={billTo.email || ''} onChange={(e) => setBillTo({ ...billTo, email: e.target.value })} placeholder="Email" className={cell} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="text"
                        value={billTo.gstin || ''}
                        onChange={(e) => {
                          const g = e.target.value.toUpperCase();
                          const derived = panFromGSTIN(g);
                          setBillTo({ ...billTo, gstin: g, pan: billTo.pan || derived });
                          const st = stateFromGSTIN(g);
                          if (st) setPlaceOfSupply(st);
                        }}
                        placeholder="GSTIN"
                        maxLength={15}
                        className={`${cell} font-mono uppercase ${billTo.gstin && !validateGSTIN(billTo.gstin) ? 'border-rose-400' : ''}`}
                      />
                      {billTo.gstin && !validateGSTIN(billTo.gstin) && <p className="mt-0.5 text-[11px] text-rose-600">Invalid GSTIN</p>}
                    </div>
                    <div>
                      <input
                        type="text"
                        value={billTo.pan || ''}
                        onChange={(e) => setBillTo({ ...billTo, pan: e.target.value.toUpperCase() })}
                        placeholder="PAN Number"
                        maxLength={10}
                        className={`${cell} font-mono uppercase ${billTo.pan && !validatePAN(billTo.pan) ? 'border-rose-400' : ''}`}
                      />
                      {billTo.pan && !validatePAN(billTo.pan) && <p className="mt-0.5 text-[11px] text-rose-600">Invalid PAN</p>}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400">These details print on this invoice only. To update the saved party, edit it under Customers.</p>
                </div>
              ) : billTo.name ? (
                <div className="space-y-1 text-sm">
                  <p className="font-bold text-slate-800 text-base">{billTo.name}</p>
                  {billTo.address && (
                    <p className="text-slate-600 text-xs">
                      <span className="text-slate-400">Address: </span>
                      {billTo.address}
                    </p>
                  )}
                  {billTo.phone && (
                    <p className="text-xs text-slate-600">
                      <span className="text-slate-400">Phone: </span>
                      {billTo.phone}
                    </p>
                  )}
                  <p className="text-xs text-slate-600">
                    <span className="text-slate-400">GSTIN: </span>
                    {billTo.gstin ? (
                      <span className="font-mono">{billTo.gstin}</span>
                    ) : (
                      <button type="button" onClick={() => setEditingBillTo(true)} className="text-brand-700 hover:underline">
                        + Add GSTIN
                      </button>
                    )}
                  </p>
                  <p className="text-xs text-slate-600">
                    <span className="text-slate-400">PAN Number: </span>
                    {billTo.pan ? (
                      <span className="font-mono">{billTo.pan}</span>
                    ) : (
                      <button type="button" onClick={() => setEditingBillTo(true)} className="text-brand-700 hover:underline">
                        + Add PAN
                      </button>
                    )}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No party selected</p>
              )}

              <div className="mt-4">
                <span className="text-xs font-semibold text-slate-500 block mb-1.5">Place of Supply</span>
                <div className="max-w-xs">
                  <Select
                    aria-label="Place of supply"
                    searchable
                    clearable
                    placeholder="Select state"
                    options={INDIAN_STATES.map((s) => s.name)}
                    value={placeOfSupply}
                    onChange={setPlaceOfSupply}
                  />
                </div>
                {interState && <p className="mt-1 text-[11px] text-amber-600 font-medium">Inter-state supply: IGST will apply</p>}
              </div>

              {/* Party picker popover */}
              {partyPickerOpen && (
                <div className="absolute left-4 right-4 top-14 z-30 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-2 border-b border-slate-200">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <FaIcon icon="fa-solid fa-magnifying-glass" size={12} />
                      </span>
                      <input
                        autoFocus
                        type="text"
                        value={partySearch}
                        onChange={(e) => setPartySearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (filteredCustomers.length === 1) selectCustomer(filteredCustomers[0]);
                            else useWalkIn(partySearch);
                          }
                        }}
                        placeholder="Search party by name, phone or GSTIN…"
                        className={`${cell} pl-8`}
                      />
                    </div>
                  </div>
                  <ul className="max-h-60 overflow-y-auto divide-y divide-slate-50">
                    {filteredCustomers.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => selectCustomer(c)}
                          className="w-full text-left px-3 py-2 hover:bg-brand-50 transition-colors"
                        >
                          <span className="block text-sm font-semibold text-slate-800">{c.name}</span>
                          <span className="block text-[11px] text-slate-500">
                            {[c.phone, c.gstin].filter(Boolean).join(' · ') || 'No phone / GSTIN'}
                          </span>
                        </button>
                      </li>
                    ))}
                    {filteredCustomers.length === 0 && (
                      <li className="px-3 py-3 text-xs text-slate-400">No saved party matches.</li>
                    )}
                  </ul>
                  {partySearch.trim() && (
                    <button
                      type="button"
                      onClick={() => useWalkIn(partySearch)}
                      className="w-full text-left px-3 py-2.5 text-sm font-semibold text-brand-700 bg-brand-50/60 hover:bg-brand-50 border-t border-slate-200"
                    >
                      <FaIcon icon="fa-solid fa-user-plus" size={12} className="mr-2" />
                      Use “{partySearch.trim()}” as a one-time customer
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Ship To */}
            <div className="p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-semibold text-slate-500">Ship To</span>
                <button
                  type="button"
                  onClick={() => setEditingShipTo((v) => !v)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <FaIcon icon={editingShipTo ? 'fa-solid fa-check' : 'fa-solid fa-rotate'} size={12} />
                  {editingShipTo ? 'Done' : 'Change Shipping Address'}
                </button>
              </div>
              {editingShipTo ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={shipTo.name || ''}
                    onChange={(e) => setShipTo({ ...shipTo, name: e.target.value })}
                    placeholder="Consignee name"
                    className={cell}
                  />
                  <textarea
                    value={shipTo.address || ''}
                    onChange={(e) => setShipTo({ ...shipTo, address: e.target.value })}
                    placeholder="Shipping address"
                    rows={3}
                    className={cell}
                  />
                  <input
                    type="tel"
                    value={shipTo.phone || ''}
                    onChange={(e) => setShipTo({ ...shipTo, phone: e.target.value })}
                    placeholder="Phone"
                    className={cell}
                  />
                </div>
              ) : shipTo.name || shipTo.address ? (
                <div className="space-y-1 text-sm">
                  <p className="font-bold text-slate-800 text-base">{shipTo.name || billTo.name}</p>
                  {shipTo.address && (
                    <p className="text-slate-600 text-xs">
                      <span className="text-slate-400">Address: </span>
                      {shipTo.address}
                    </p>
                  )}
                  {shipTo.phone && (
                    <p className="text-xs text-slate-600">
                      <span className="text-slate-400">Phone: </span>
                      {shipTo.phone}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">Same as billing</p>
              )}
            </div>

            {/* Invoice details */}
            <div className="p-4 space-y-4">
              <span className="text-xs font-semibold text-slate-500 block">Invoice Details</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className={label}>Invoice Prefix</label>
                  <input
                    type="text"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                    maxLength={10}
                    className={`${field} uppercase`}
                  />
                </div>
                <div>
                  <label className={label}>Invoice Number</label>
                  <input
                    type="number"
                    min="1"
                    value={seq}
                    onChange={(e) => setSeq(e.target.value)}
                    placeholder={seqLoading ? '…' : '1'}
                    className={`${field} ${isDuplicateNo ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
                  />
                  {isDuplicateNo && <p className="mt-1 text-[11px] text-rose-600">{billNo} already exists</p>}
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className={label}>Sales Invoice Date</label>
                  <input type="date" value={invoiceDate} onChange={(e) => onInvoiceDateChange(e.target.value)} className={field} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                <div>
                  <label className={label}>Payment Terms</label>
                  <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-600">
                    <input
                      type="number"
                      min="0"
                      value={paymentTerms}
                      onChange={(e) => onTermsChange(e.target.value)}
                      className="flex-1 min-w-0 px-3 py-2.5 text-sm text-slate-800 focus:outline-none"
                    />
                    <span className="px-3 flex items-center text-sm text-slate-500 bg-slate-50 border-l border-slate-200">Days</span>
                  </div>
                </div>
                <div>
                  <label className={label}>Due Date</label>
                  <input type="date" value={dueDate} min={invoiceDate} onChange={(e) => onDueDateChange(e.target.value)} className={field} />
                </div>
              </div>

              <div>
                <label className={label}>Vehicle No.</label>
                <input
                  type="text"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                  placeholder="e.g. GJ03AB1234"
                  className={`${field} uppercase`}
                />
              </div>
            </div>
          </div>

          {/* ===== Items table ===== */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-3 py-3 w-10">No</th>
                    <th className="px-3 py-3 min-w-[260px]">Items</th>
                    <th className="px-3 py-3 w-28">HSN</th>
                    <th className="px-3 py-3 w-40">Qty</th>
                    <th className="px-3 py-3 w-36">Price/Item (₹)</th>
                    <th className="px-3 py-3 w-36">Discount</th>
                    <th className="px-3 py-3 w-36">Tax</th>
                    <th className="px-3 py-3 w-36 text-right">Amount (₹)</th>
                    <th className="px-3 py-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {computedRows.map(({ row, line }, index) => (
                    <tr key={row.key} className="align-top">
                      <td className="px-3 py-3 text-sm text-slate-500 pt-5">{index + 1}</td>
                      <td className="px-3 py-3 space-y-2">
                        <Combobox
                          aria-label={`Item ${index + 1} name`}
                          options={productOptions}
                          value={row.productName}
                          onChange={(v) => onProductName(row.key, v)}
                          placeholder="Enter item name or select item"
                          className={`${cell} font-medium`}
                        />
                        {row.showDescription ? (
                          <textarea
                            value={row.description}
                            onChange={(e) => updateRow(row.key, { description: e.target.value })}
                            placeholder="Enter Description (optional)"
                            rows={2}
                            className={`${cell} text-xs`}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => updateRow(row.key, { showDescription: true })}
                            className="text-xs text-slate-400 hover:text-brand-700"
                          >
                            + Enter Description (optional)
                          </button>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="text"
                          value={row.hsn}
                          onChange={(e) => updateRow(row.key, { hsn: e.target.value })}
                          placeholder="HSN"
                          className={`${cell} font-mono`}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-600">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={row.quantity}
                            onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                            className="flex-1 min-w-0 px-2.5 py-2 text-sm text-slate-800 focus:outline-none"
                          />
                          <span
                            className="px-2.5 flex items-center text-xs font-semibold text-slate-500 bg-slate-50 border-l border-slate-200 whitespace-nowrap"
                            title="Unit comes from the product (Products → edit)"
                          >
                            {row.unit || 'PCS'}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-600">
                          <span className="px-2.5 flex items-center text-sm text-slate-500 bg-slate-50 border-r border-slate-200">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={row.price}
                            onChange={(e) => updateRow(row.key, { price: e.target.value })}
                            placeholder="0"
                            className="flex-1 min-w-0 px-2.5 py-2 text-sm text-slate-800 focus:outline-none"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3 space-y-1.5">
                        <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-600">
                          <span className="px-2.5 flex items-center text-sm text-slate-500 bg-slate-50 border-r border-slate-200">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={row.discountMode === 'amount' ? row.discountValue : line.discount ? String(line.discount) : ''}
                            onChange={(e) => updateRow(row.key, { discountMode: 'amount', discountValue: e.target.value })}
                            placeholder="0"
                            className="flex-1 min-w-0 px-2.5 py-2 text-sm text-slate-800 focus:outline-none"
                          />
                        </div>
                        <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-600">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            value={row.discountMode === 'percent' ? row.discountValue : line.discountPercent ? String(line.discountPercent) : ''}
                            onChange={(e) => updateRow(row.key, { discountMode: 'percent', discountValue: e.target.value })}
                            placeholder="0"
                            className="flex-1 min-w-0 px-2.5 py-2 text-sm text-slate-800 focus:outline-none"
                          />
                          <span className="px-2.5 flex items-center text-sm text-slate-500 bg-slate-50 border-l border-slate-200">%</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <Select
                          aria-label="Tax rate"
                          align="end"
                          options={[
                            ...GST_RATES.map((r) => ({ value: String(r), label: `${r}%` })),
                            ...(!GST_RATES.includes(parseFloat(row.taxRate)) && parseFloat(row.taxRate) > 0
                              ? [{ value: row.taxRate, label: `${row.taxRate}%` }]
                              : []),
                          ]}
                          value={row.taxRate}
                          onChange={(v) => updateRow(row.key, { taxRate: v })}
                          className="py-2"
                        />
                        <p className="mt-1 text-[11px] text-slate-400 text-right">({money(line.taxAmount)})</p>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className={`${cell} text-right font-bold bg-slate-50`}>{money(line.total)}</div>
                      </td>
                      <td className="px-2 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeRow(row.key)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remove item"
                        >
                          <FaIcon icon="fa-solid fa-xmark" size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50/70 border-t border-slate-200 text-sm">
                    <td colSpan={3} className="px-3 py-3 text-right font-bold text-slate-700">
                      Subtotal
                    </td>
                    <td className="px-3 py-3 text-slate-700 font-semibold">{totalQty}</td>
                    <td />
                    <td className="px-3 py-3 text-slate-700 font-semibold">{money(totals.itemDiscount)}</td>
                    <td className="px-3 py-3 text-slate-700 font-semibold">{money(totals.tax)}</td>
                    <td className="px-3 py-3 text-right text-slate-800 font-bold">{money(totals.subtotal)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex items-stretch gap-3 p-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setRows((rs) => [...rs, newRow(defaultTax)])}
                className="flex-1 py-3 rounded-lg border-2 border-dashed border-brand-300 text-brand-700 text-sm font-semibold hover:bg-brand-50/60 transition-colors"
              >
                + Add Item
              </button>
              <button
                type="button"
                disabled
                title="Barcode scanning is coming soon"
                className="inline-flex items-center gap-2 px-4 rounded-lg border border-slate-200 text-slate-400 text-sm font-semibold cursor-not-allowed"
              >
                <FaIcon icon="fa-solid fa-barcode" size={14} />
                <span className="hidden sm:inline">Scan Barcode</span>
              </button>
            </div>
          </div>

          {/* ===== Bottom: extras (left) | totals (right) ===== */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm grid grid-cols-1 lg:grid-cols-[3fr_2fr] divide-y lg:divide-y-0 lg:divide-x divide-slate-200 overflow-hidden">
            {/* Left column */}
            <div>
              <button type="button" onClick={() => setShowNotes((v) => !v)} className={linkBtn}>
                <FaIcon icon="fa-regular fa-note-sticky" size={15} />
                {showNotes ? 'Notes' : 'Add Notes'}
                {showNotes && <FaIcon icon="fa-solid fa-chevron-up" size={11} className="ml-auto text-slate-400" />}
              </button>
              {showNotes && (
                <div className="px-5 pb-4 border-b border-slate-200">
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal or customer-facing notes for this invoice" rows={3} className={field} />
                </div>
              )}

              <button type="button" onClick={() => setShowTerms((v) => !v)} className={linkBtn}>
                <FaIcon icon="fa-regular fa-file-lines" size={15} />
                {showTerms ? 'Terms & Conditions' : 'Add Terms & Conditions'}
                {showTerms && <FaIcon icon="fa-solid fa-chevron-up" size={11} className="ml-auto text-slate-400" />}
              </button>
              {showTerms && (
                <div className="px-5 pb-4 border-b border-slate-200">
                  <textarea value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="e.g. Goods once sold cannot be returned." rows={3} className={field} />
                </div>
              )}

              <button type="button" onClick={() => setShowBank((v) => !v)} className={linkBtn}>
                <FaIcon icon="fa-solid fa-building-columns" size={15} />
                {showBank ? 'Bank Account' : 'Add Bank Account'}
                {showBank && (
                  <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-emerald-600">
                    <FaIcon icon="fa-solid fa-circle-check" size={11} /> On invoice
                  </span>
                )}
              </button>
              {showBank && (
                <div className="px-5 pb-4 border-b border-slate-200 text-xs text-slate-600">
                  {hasBank ? (
                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 grid grid-cols-2 gap-x-4 gap-y-1">
                      {profile?.bankAccountHolder && (
                        <span>
                          <span className="text-slate-400">Name: </span>
                          {profile.bankAccountHolder}
                        </span>
                      )}
                      {profile?.bankName && (
                        <span>
                          <span className="text-slate-400">Bank: </span>
                          {profile.bankName}
                        </span>
                      )}
                      {profile?.bankAccountNo && (
                        <span className="font-mono">
                          <span className="text-slate-400 font-sans">A/C: </span>
                          {profile.bankAccountNo}
                        </span>
                      )}
                      {profile?.bankIfsc && (
                        <span className="font-mono">
                          <span className="text-slate-400 font-sans">IFSC: </span>
                          {profile.bankIfsc}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-amber-600">No bank account saved. Add one under Settings → Bank Account.</p>
                  )}
                </div>
              )}

              <button type="button" onClick={() => setShowQr((v) => !v)} className={linkBtn}>
                <FaIcon icon="fa-solid fa-qrcode" size={15} />
                {showQr ? 'Payment QR' : 'Add Payment QR'}
                {showQr && (
                  <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-emerald-600">
                    <FaIcon icon="fa-solid fa-circle-check" size={11} /> On invoice
                  </span>
                )}
              </button>
              {showQr && !profile?.upiId && (
                <div className="px-5 pb-4 text-xs text-amber-600">No UPI ID saved. Add one under Settings to print a scan-to-pay QR.</div>
              )}
            </div>

            {/* Right column: totals */}
            <div className="p-4 space-y-3 text-sm">
              <button type="button" onClick={() => { setShowCharges(true); setCharges((c) => (c.length ? c : [{ label: '', amount: 0 }])); }} className="inline-flex items-center gap-2 text-brand-700 font-semibold hover:underline">
                <FaIcon icon="fa-solid fa-circle-plus" size={14} />
                Add Additional Charges
              </button>
              {showCharges && charges.length > 0 && (
                <div className="space-y-2">
                  {charges.map((c, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={c.label}
                        onChange={(e) => setCharges((cs) => cs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                        placeholder="e.g. Delivery, Packing"
                        className={`${cell} flex-1`}
                      />
                      <div className="flex w-32 rounded-lg border border-slate-200 overflow-hidden bg-white">
                        <span className="px-2 flex items-center text-sm text-slate-500 bg-slate-50 border-r border-slate-200">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={c.amount || ''}
                          onChange={(e) => setCharges((cs) => cs.map((x, j) => (j === i ? { ...x, amount: parseFloat(e.target.value) || 0 } : x)))}
                          placeholder="0"
                          className="flex-1 min-w-0 px-2 py-2 text-sm focus:outline-none"
                        />
                      </div>
                      <button type="button" onClick={() => setCharges((cs) => cs.filter((_, j) => j !== i))} className="p-2 text-slate-400 hover:text-rose-600" title="Remove">
                        <FaIcon icon="fa-solid fa-xmark" size={13} />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setCharges((cs) => [...cs, { label: '', amount: 0 }])} className="text-xs text-brand-700 font-semibold hover:underline">
                    + Another charge
                  </button>
                </div>
              )}

              <div className="flex justify-between font-semibold text-slate-700">
                <span>Taxable Amount</span>
                <span>{money(totals.taxableAmount)}</span>
              </div>
              {totals.tax > 0 &&
                (interState ? (
                  <div className="flex justify-between text-slate-600">
                    <span>IGST{totals.uniformTaxRate ? ` @${totals.uniformTaxRate}%` : ''}</span>
                    <span>{money(totals.igst)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>SGST{totals.uniformTaxRate ? ` @${totals.uniformTaxRate / 2}%` : ''}</span>
                      <span>{money(totals.sgst)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>CGST{totals.uniformTaxRate ? ` @${totals.uniformTaxRate / 2}%` : ''}</span>
                      <span>{money(totals.cgst)}</span>
                    </div>
                  </>
                ))}
              {totals.charges > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Additional Charges</span>
                  <span>{money(totals.charges)}</span>
                </div>
              )}

              {showBillDiscount ? (
                <div className="flex justify-between items-center gap-3 text-slate-600">
                  <span>Discount</span>
                  <div className="flex w-36 rounded-lg border border-slate-200 overflow-hidden bg-white">
                    <span className="px-2 flex items-center text-sm text-slate-500 bg-slate-50 border-r border-slate-200">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={billDiscount}
                      onChange={(e) => setBillDiscount(e.target.value)}
                      placeholder="0"
                      className="flex-1 min-w-0 px-2 py-1.5 text-sm text-right focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setShowBillDiscount(true)} className="inline-flex items-center gap-2 text-brand-700 font-semibold hover:underline">
                  <FaIcon icon="fa-solid fa-percent" size={13} />
                  Add Discount
                </button>
              )}

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <label className="inline-flex items-center gap-2 text-slate-700 cursor-pointer select-none">
                  <input type="checkbox" checked={autoRoundOff} onChange={(e) => setAutoRoundOff(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-brand-700" />
                  Auto Round Off
                </label>
                <div className={`flex rounded-lg border border-slate-200 overflow-hidden bg-white ${autoRoundOff ? 'opacity-50 pointer-events-none' : ''}`}>
                  <Select
                    variant="embedded"
                    aria-label="Round off direction"
                    options={[
                      { value: '+', label: '+ Add' },
                      { value: '-', label: '− Reduce' },
                    ]}
                    value={manualRoundSign}
                    onChange={(v) => setManualRoundSign(v as '+' | '-')}
                    className="border-r border-slate-200 font-normal"
                  />
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={autoRoundOff ? Math.abs(totals.roundOff) || '' : manualRound}
                    onChange={(e) => setManualRound(e.target.value)}
                    placeholder="0"
                    className="w-24 px-2 py-1.5 text-sm text-right focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-between items-baseline pt-3 border-t border-slate-200">
                <span className="text-lg font-bold text-slate-800">Total Amount:</span>
                <span className="text-2xl font-bold text-slate-900">{money(totals.total)}</span>
              </div>

              {/* Payment */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="flex justify-between text-slate-700 font-semibold">
                  <span>Total Amount Received</span>
                  <span>{money(received)}</span>
                </div>
                <div className={`flex rounded-lg border border-slate-200 overflow-hidden bg-white ${fullyPaid ? 'opacity-60' : ''}`}>
                  <span className="px-3 flex items-center text-sm text-slate-500 bg-slate-50 border-r border-slate-200">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    max={totals.total}
                    value={fullyPaid ? totals.total : amountReceived}
                    disabled={fullyPaid}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    placeholder="0"
                    className="flex-1 min-w-0 px-3 py-2.5 text-sm focus:outline-none disabled:bg-slate-50"
                  />
                  <Select
                    variant="embedded"
                    align="end"
                    aria-label="Payment method"
                    options={[
                      { value: 'cash', label: 'Cash' },
                      { value: 'upi', label: 'UPI' },
                      { value: 'card', label: 'Card' },
                      { value: 'bank', label: 'Bank' },
                      { value: 'other', label: 'Other' },
                    ]}
                    value={paymentMethod}
                    onChange={(v) => setPaymentMethod(v as PaymentMethod)}
                    className="border-l border-slate-200 bg-white"
                  />
                </div>
                <label className="inline-flex items-center gap-2 text-slate-700 cursor-pointer select-none">
                  <input type="checkbox" checked={fullyPaid} onChange={(e) => setFullyPaid(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-brand-700" />
                  Mark as fully paid
                </label>
                <div className="flex justify-between pt-3 border-t border-slate-200 font-bold">
                  <span className={balance > 0 ? 'text-emerald-700' : 'text-slate-500'}>Balance Amount</span>
                  <span className={balance > 0 ? 'text-emerald-700' : 'text-slate-500'}>{money(balance)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
