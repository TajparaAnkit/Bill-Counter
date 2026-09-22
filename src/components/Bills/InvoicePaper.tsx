import React from 'react';
import { Bill, UserProfile } from '../../types';
import { BRAND_NAME } from '../../config/brand';
import { amountInWords, formatISODate } from '../../utils/tax';

// Renders the A4-style invoice "paper" in a myBillBook-like layout. Shared by
// the invoice detail modal and the invoice editor's Preview mode. Works for
// legacy bills (no GST fields) and new GST-style bills alike.

export type InvoicePaperBill = Omit<Bill, 'id' | 'userId'> & { id?: string; userId?: string };

interface InvoicePaperProps {
  bill: InvoicePaperBill;
  profile: UserProfile | null;
  qrUrl?: string | null;
  qrCaption?: string;
  className?: string;
}

const money = (n: number | undefined) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const num = (n: number | undefined) =>
  Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtTimestamp = (t: any) => {
  if (!t) return '';
  const d = t.toDate ? t.toDate() : t.seconds ? new Date(t.seconds * 1000) : new Date(t);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};
const fmtISO = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return formatISODate(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Seller header block values with sensible fallbacks
export const sellerFromProfile = (profile: UserProfile | null) => ({
  name: profile?.businessName?.trim() || BRAND_NAME,
  address: [profile?.address, [profile?.city, profile?.state].filter(Boolean).join(', '), profile?.pincode].filter(Boolean).join(', '),
  phone: profile?.phone || '',
  email: profile?.companyEmail || profile?.email || '',
  gstin: profile?.gstRegistered === false ? '' : profile?.gstin || '',
  pan: profile?.pan || '',
  logoUrl: profile?.logoUrl || '',
  signatureUrl: profile?.signatureUrl || '',
  details: profile?.businessDetails || [],
});

const Chip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-block bg-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm">{children}</span>
);

export const InvoicePaper: React.FC<InvoicePaperProps> = ({ bill, profile, qrUrl, qrCaption, className }) => {
  const seller = sellerFromProfile(profile);
  const items = bill.items || [];
  const hasHsn = items.some((i) => i.hsn);
  const hasLineDiscount = items.some((i) => (i.discount || 0) > 0);
  const hasLineTax = items.some((i) => (i.taxRate || 0) > 0);

  const isGstStyle = bill.taxableAmount !== undefined || bill.cgst !== undefined || bill.igst !== undefined;
  const taxTotal = bill.tax || 0;
  const taxable = bill.taxableAmount ?? (bill.subtotal || 0) - (bill.discount || 0);
  const charges = (bill.additionalCharges || []).filter((c) => c.amount > 0);
  const billDiscount = isGstStyle ? bill.billDiscount || 0 : bill.discount || 0;
  const received = bill.amountPaid || 0;
  const balance = Math.max(0, (bill.total || 0) - received);
  const totalQty = items.reduce((s, i) => s + (i.quantity || 0), 0);

  const billTo = bill.billTo || { name: bill.customerName, phone: bill.customerPhone };
  const shipTo = bill.shipTo && (bill.shipTo.address || bill.shipTo.name) ? bill.shipTo : null;

  const invoiceDate = bill.invoiceDate ? fmtISO(bill.invoiceDate) : fmtTimestamp(bill.createdAt);
  const terms = bill.termsAndConditions ?? (bill.notes ? undefined : profile?.invoiceNotes);
  const showBank = !!bill.showBankDetails && !!(profile?.bankAccountNo || profile?.bankName);
  const showQr = bill.showPaymentQr !== false && !!qrUrl;
  const rateLabel = bill.taxRate ? ` @${bill.taxRate / 2}%` : '';

  return (
    <div
      id="invoice-pdf-content"
      className={`w-full max-w-[800px] bg-white shadow-sm text-slate-800 text-[13px] leading-snug ${className || ''}`}
      style={{ boxSizing: 'border-box' }}
    >
      <div className="p-6 sm:p-8">
        {/* ===== Header ===== */}
        <div className="flex flex-col sm:flex-row sm:justify-between gap-5 pb-4">
          <div className="flex items-start gap-4 min-w-0">
            {seller.logoUrl ? (
              <img src={seller.logoUrl} alt="Logo" className="w-20 h-20 object-contain shrink-0" />
            ) : (
              <div className="w-16 h-16 shrink-0 rounded-lg bg-brand-600 text-white grid place-items-center font-bold text-xl shadow">
                BC
              </div>
            )}
            <div className="min-w-0 text-xs text-slate-700 space-y-0.5">
              <p className="text-base font-bold text-brand-800 truncate">{seller.name}</p>
              {seller.address && <p className="whitespace-pre-wrap">{seller.address}</p>}
              {seller.gstin && (
                <p>
                  <span className="font-bold">GSTIN : </span>
                  {seller.gstin}
                </p>
              )}
              {seller.pan && !seller.gstin && (
                <p>
                  <span className="font-bold">PAN : </span>
                  {seller.pan}
                </p>
              )}
              {seller.phone && (
                <p>
                  <span className="font-bold">Mobile : </span>
                  {seller.phone}
                </p>
              )}
              {seller.email && (
                <p>
                  <span className="font-bold">Email : </span>
                  {seller.email}
                </p>
              )}
              {seller.details.map((d, i) => (
                <p key={i}>
                  <span className="font-bold">{d.label} : </span>
                  {d.value}
                </p>
              ))}
            </div>
          </div>

          <div className="shrink-0 sm:w-72">
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-base font-bold text-slate-800 uppercase">{taxTotal > 0 ? 'Tax Invoice' : 'Invoice'}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border border-slate-300 px-2 py-1">Original for Recipient</span>
            </div>
            <table className="w-full text-xs">
              <tbody>
                <tr>
                  <td className="py-0.5 text-slate-600">Invoice No.</td>
                  <td className="py-0.5 text-slate-400 px-2">:</td>
                  <td className="py-0.5 text-right font-bold">{bill.billNo}</td>
                </tr>
                <tr>
                  <td className="py-0.5 text-slate-600">Invoice Date</td>
                  <td className="py-0.5 text-slate-400 px-2">:</td>
                  <td className="py-0.5 text-right font-bold">{invoiceDate}</td>
                </tr>
                {bill.dueDate && (
                  <tr>
                    <td className="py-0.5 text-slate-600">Due Date</td>
                    <td className="py-0.5 text-slate-400 px-2">:</td>
                    <td className="py-0.5 text-right font-bold">{fmtISO(bill.dueDate)}</td>
                  </tr>
                )}
                {bill.vehicleNo && (
                  <tr>
                    <td className="py-0.5 text-slate-600">Vehicle No.</td>
                    <td className="py-0.5 text-slate-400 px-2">:</td>
                    <td className="py-0.5 text-right font-bold uppercase">{bill.vehicleNo}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ===== Parties ===== */}
        <div className={`grid gap-6 pt-3 pb-4 ${shipTo ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
          <div className="text-xs">
            <Chip>Bill To</Chip>
            <p className="font-bold text-sm mt-2 uppercase">{billTo.name || '-'}</p>
            {billTo.address && <p className="mt-0.5 whitespace-pre-wrap font-medium text-slate-700">{billTo.address}</p>}
            {billTo.phone && (
              <p className="mt-0.5">
                <span className="font-bold">Mobile : </span>
                {billTo.phone}
              </p>
            )}
            {billTo.gstin && (
              <p>
                <span className="font-bold">GSTIN : </span>
                {billTo.gstin}
              </p>
            )}
            {billTo.pan && (
              <p>
                <span className="font-bold">PAN Number : </span>
                {billTo.pan}
              </p>
            )}
            {bill.placeOfSupply && (
              <p>
                <span className="font-bold">Place of Supply : </span>
                {bill.placeOfSupply}
              </p>
            )}
          </div>
          {shipTo && (
            <div className="text-xs">
              <Chip>Ship To</Chip>
              <p className="font-bold text-sm mt-2 uppercase">{shipTo.name || billTo.name}</p>
              {shipTo.address && <p className="mt-0.5 whitespace-pre-wrap font-medium text-slate-700">{shipTo.address}</p>}
              {shipTo.phone && (
                <p className="mt-0.5">
                  <span className="font-bold">Mobile : </span>
                  {shipTo.phone}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ===== Items ===== */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-brand-50 text-slate-700 text-[11px] font-bold uppercase">
                <th className="py-2 px-2 text-left w-12">S.No.</th>
                <th className="py-2 px-2 text-left">Items</th>
                {hasHsn && <th className="py-2 px-2 text-left w-16">HSN</th>}
                <th className="py-2 px-2 text-right w-20">Qty.</th>
                <th className="py-2 px-2 text-right w-24">Rate</th>
                {hasLineDiscount && <th className="py-2 px-2 text-right w-20">Disc.</th>}
                {hasLineTax && <th className="py-2 px-2 text-right w-24">Tax</th>}
                <th className="py-2 px-2 text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="align-top">
                  <td className="py-2 px-2 text-slate-500">{index + 1}</td>
                  <td className="py-2 px-2">
                    <div className="font-semibold uppercase">{item.productName}</div>
                    {item.description && <div className="text-[11px] text-slate-500 whitespace-pre-wrap normal-case">{item.description}</div>}
                  </td>
                  {hasHsn && <td className="py-2 px-2 text-slate-600">{item.hsn || '-'}</td>}
                  <td className="py-2 px-2 text-right whitespace-nowrap">
                    {item.quantity} {item.unit || ''}
                  </td>
                  <td className="py-2 px-2 text-right">{num(item.price)}</td>
                  {hasLineDiscount && <td className="py-2 px-2 text-right">{(item.discount || 0) > 0 ? num(item.discount) : '-'}</td>}
                  {hasLineTax && (
                    <td className="py-2 px-2 text-right">
                      {(item.taxRate || 0) > 0 ? (
                        <>
                          {num(item.taxAmount)}
                          <span className="block text-[10px] text-slate-400">({item.taxRate}%)</span>
                        </>
                      ) : (
                        '-'
                      )}
                    </td>
                  )}
                  <td className="py-2 px-2 text-right font-semibold">{num(item.total)}</td>
                </tr>
              ))}
              {/* spacer so short invoices keep the familiar shape */}
              {items.length < 4 && (
                <tr>
                  <td colSpan={8} style={{ height: `${(4 - items.length) * 28}px` }} />
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold">
                <td className="py-2 px-2" />
                <td className="py-2 px-2 uppercase">Subtotal</td>
                {hasHsn && <td />}
                <td className="py-2 px-2 text-right">{totalQty}</td>
                <td />
                {hasLineDiscount && <td className="py-2 px-2 text-right">{money(bill.itemDiscount)}</td>}
                {hasLineTax && <td className="py-2 px-2 text-right">{money(taxTotal)}</td>}
                <td className="py-2 px-2 text-right">{money(bill.subtotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ===== Totals + footer ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-[1.1fr_1fr] gap-6 pt-3">
          {/* Left: notes, terms, bank, QR */}
          <div className="text-xs space-y-3">
            {bill.notes && (
              <div>
                <p className="font-bold text-slate-700 mb-0.5">Notes</p>
                <p className="text-slate-600 whitespace-pre-wrap">{bill.notes}</p>
              </div>
            )}
            {terms && (
              <div>
                <p className="font-bold text-slate-700 mb-0.5">Terms &amp; Conditions</p>
                <p className="text-slate-600 whitespace-pre-wrap">{terms}</p>
              </div>
            )}
            {showBank && (
              <div>
                <p className="font-bold text-slate-700 mb-0.5">Bank Details</p>
                <table className="text-slate-600">
                  <tbody>
                    {profile?.bankAccountHolder && (
                      <tr>
                        <td className="pr-3 text-slate-500">Name</td>
                        <td className="font-semibold">{profile.bankAccountHolder}</td>
                      </tr>
                    )}
                    {profile?.bankName && (
                      <tr>
                        <td className="pr-3 text-slate-500">Bank</td>
                        <td className="font-semibold">{profile.bankName}</td>
                      </tr>
                    )}
                    {profile?.bankAccountNo && (
                      <tr>
                        <td className="pr-3 text-slate-500">Account No.</td>
                        <td className="font-semibold">{profile.bankAccountNo}</td>
                      </tr>
                    )}
                    {profile?.bankIfsc && (
                      <tr>
                        <td className="pr-3 text-slate-500">IFSC</td>
                        <td className="font-semibold">{profile.bankIfsc}</td>
                      </tr>
                    )}
                    {profile?.bankBranch && (
                      <tr>
                        <td className="pr-3 text-slate-500">Branch</td>
                        <td className="font-semibold">{profile.bankBranch}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {showQr && (
              <div className="flex items-center gap-3">
                <img src={qrUrl!} alt="Payment QR code" className="w-20 h-20 border border-slate-200 bg-white p-1" />
                <div>
                  <p className="font-bold text-slate-700">Pay using UPI</p>
                  {qrCaption && <p className="text-slate-500">{qrCaption}</p>}
                  {profile?.upiId && <p className="text-[10px] text-slate-400 font-mono">{profile.upiId}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Right: totals, words, signature */}
          <div className="text-xs">
            <table className="w-full">
              <tbody>
                {isGstStyle ? (
                  <>
                    {(bill.itemDiscount || 0) > 0 && (
                      <tr>
                        <td className="py-0.5 text-slate-600">Item Discount</td>
                        <td className="py-0.5 text-right">- {money(bill.itemDiscount)}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="py-0.5 text-slate-600">Taxable Amount</td>
                      <td className="py-0.5 text-right">{money(taxable)}</td>
                    </tr>
                    {(bill.cgst || 0) > 0 && (
                      <tr>
                        <td className="py-0.5 text-slate-600">CGST{rateLabel}</td>
                        <td className="py-0.5 text-right">{money(bill.cgst)}</td>
                      </tr>
                    )}
                    {(bill.sgst || 0) > 0 && (
                      <tr>
                        <td className="py-0.5 text-slate-600">SGST{rateLabel}</td>
                        <td className="py-0.5 text-right">{money(bill.sgst)}</td>
                      </tr>
                    )}
                    {(bill.igst || 0) > 0 && (
                      <tr>
                        <td className="py-0.5 text-slate-600">IGST{bill.taxRate ? ` @${bill.taxRate}%` : ''}</td>
                        <td className="py-0.5 text-right">{money(bill.igst)}</td>
                      </tr>
                    )}
                    {charges.map((c, i) => (
                      <tr key={i}>
                        <td className="py-0.5 text-slate-600">{c.label || 'Additional Charge'}</td>
                        <td className="py-0.5 text-right">{money(c.amount)}</td>
                      </tr>
                    ))}
                    {billDiscount > 0 && (
                      <tr>
                        <td className="py-0.5 text-slate-600">Discount</td>
                        <td className="py-0.5 text-right">- {money(billDiscount)}</td>
                      </tr>
                    )}
                    {!!bill.roundOff && (
                      <tr>
                        <td className="py-0.5 text-slate-600">Round Off</td>
                        <td className="py-0.5 text-right">
                          {bill.roundOff > 0 ? '+ ' : '- '}
                          {money(Math.abs(bill.roundOff))}
                        </td>
                      </tr>
                    )}
                  </>
                ) : (
                  <>
                    <tr>
                      <td className="py-0.5 text-slate-600">Subtotal</td>
                      <td className="py-0.5 text-right">{money(bill.subtotal)}</td>
                    </tr>
                    {billDiscount > 0 && (
                      <tr>
                        <td className="py-0.5 text-slate-600">Discount</td>
                        <td className="py-0.5 text-right">- {money(billDiscount)}</td>
                      </tr>
                    )}
                    {(bill.taxRate || 0) > 0 && (
                      <tr>
                        <td className="py-0.5 text-slate-600">Tax ({bill.taxRate}%)</td>
                        <td className="py-0.5 text-right">{money(taxTotal)}</td>
                      </tr>
                    )}
                  </>
                )}
                <tr className="border-t-2 border-slate-800">
                  <td className="pt-1.5 pb-1 font-bold text-sm">Total Amount</td>
                  <td className="pt-1.5 pb-1 text-right font-bold text-sm">{money(bill.total)}</td>
                </tr>
                <tr className="border-t border-slate-200">
                  <td className="py-1 text-slate-600">Received Amount</td>
                  <td className="py-1 text-right">{money(received)}</td>
                </tr>
                {received > 0 && balance > 0 && (
                  <tr>
                    <td className="py-0.5 font-bold text-slate-700">Balance</td>
                    <td className="py-0.5 text-right font-bold">{money(balance)}</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="mt-4 text-right">
              <p className="font-bold text-slate-700">Total Amount (in words)</p>
              <p className="text-slate-700">{amountInWords(bill.total || 0)}</p>
            </div>

            <div className="mt-6 flex flex-col items-end">
              {seller.signatureUrl ? (
                <img src={seller.signatureUrl} alt="Authorised signature" className="h-16 max-w-[180px] object-contain" />
              ) : (
                <div className="h-16" />
              )}
              <p className="mt-2 font-bold text-slate-800 text-right">
                Authorised Signature for
                <br />
                {seller.name}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
