import React from 'react';
import { InvoiceTemplateId, UserProfile } from '../../types';
import { InvoiceViewData, ViewBill, invoiceView, num } from '../../utils/invoiceView';

// On-screen versions of the non-Classic invoice designs. Classic stays in InvoicePaper.tsx.
// Their PDFs are drawn in utils/pdfTemplates.ts from the same invoiceView() data.

interface Props {
  bill: ViewBill;
  profile: UserProfile | null;
  qrUrl?: string | null;
  qrCaption?: string;
  color: string;
  className?: string;
}

const rs = (n: number) => `₹${num(n)}`;
const signed = (l: InvoiceViewData['lines'][number]) => `${l.sign ? `${l.sign} ` : ''}${rs(l.value)}`;

const Totals: React.FC<{ v: InvoiceViewData; color: string; strong?: boolean }> = ({ v, color, strong }) => (
  <table className="w-full text-xs">
    <tbody>
      {v.lines.map((l, i) => (
        <tr key={i}>
          <td className="py-0.5 text-slate-600">{l.label}</td>
          <td className="py-0.5 text-right">{signed(l)}</td>
        </tr>
      ))}
      <tr>
        <td colSpan={2} className="pt-2">
          <div
            className={`flex justify-between items-center font-bold text-sm ${strong ? 'text-white rounded-md px-3 py-2' : 'border-t-2 pt-1.5'}`}
            style={strong ? { background: color } : { borderColor: color }}
          >
            <span>Total Amount</span>
            <span>{rs(v.total)}</span>
          </div>
        </td>
      </tr>
      {!v.quote && (
        <tr>
          <td className="pt-1.5 text-slate-600">Received Amount</td>
          <td className="pt-1.5 text-right">{rs(v.received)}</td>
        </tr>
      )}
      {!v.quote && v.received > 0 && v.balance > 0 && (
        <tr>
          <td className="py-0.5 font-bold text-slate-700">Balance</td>
          <td className="py-0.5 text-right font-bold">{rs(v.balance)}</td>
        </tr>
      )}
    </tbody>
  </table>
);

const ItemsTable: React.FC<{ v: InvoiceViewData; head: React.CSSProperties; headCls: string; zebra?: boolean }> = ({ v, head, headCls, zebra }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-xs border-collapse">
      <thead>
        <tr className={headCls} style={head}>
          <th className="py-2 px-2 text-left w-10">#</th>
          <th className="py-2 px-2 text-left">Item</th>
          {v.hasHsn && <th className="py-2 px-2 text-left w-16">HSN</th>}
          <th className="py-2 px-2 text-right w-20">Qty</th>
          <th className="py-2 px-2 text-right w-24">Rate</th>
          {v.hasLineDiscount && <th className="py-2 px-2 text-right w-20">Disc.</th>}
          {v.hasLineTax && <th className="py-2 px-2 text-right w-24">Tax</th>}
          <th className="py-2 px-2 text-right w-28">Amount</th>
        </tr>
      </thead>
      <tbody>
        {v.items.map((it, i) => (
          <tr key={i} className={`align-top border-b border-slate-100 ${zebra && i % 2 ? 'bg-slate-50' : ''}`}>
            <td className="py-2 px-2 text-slate-500">{i + 1}</td>
            <td className="py-2 px-2">
              <div className="font-semibold">{it.productName}</div>
              {it.description && <div className="text-[11px] text-slate-500 whitespace-pre-wrap">{it.description}</div>}
            </td>
            {v.hasHsn && <td className="py-2 px-2 text-slate-600">{it.hsn || '-'}</td>}
            <td className="py-2 px-2 text-right whitespace-nowrap">
              {it.quantity} {it.unit || ''}
            </td>
            <td className="py-2 px-2 text-right">{num(it.price)}</td>
            {v.hasLineDiscount && <td className="py-2 px-2 text-right">{(it.discount || 0) > 0 ? num(it.discount) : '-'}</td>}
            {v.hasLineTax && (
              <td className="py-2 px-2 text-right">
                {(it.taxRate || 0) > 0 ? (
                  <>
                    {num(it.taxAmount)}
                    <span className="block text-[10px] text-slate-400">({it.taxRate}%)</span>
                  </>
                ) : (
                  '-'
                )}
              </td>
            )}
            <td className="py-2 px-2 text-right font-semibold">{num(it.total)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const PartyBlock: React.FC<{ title: string; p: { name?: string; address?: string; phone?: string; gstin?: string; pan?: string }; extra?: string; color: string }> = ({ title, p, extra, color }) => (
  <div className="text-xs">
    <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color }}>
      {title}
    </p>
    <p className="font-bold text-sm">{p.name || '-'}</p>
    {p.address && <p className="mt-0.5 whitespace-pre-wrap text-slate-600">{p.address}</p>}
    {p.phone && <p className="text-slate-600">Mobile: {p.phone}</p>}
    {p.gstin && <p className="text-slate-600">GSTIN: {p.gstin}</p>}
    {p.pan && <p className="text-slate-600">PAN: {p.pan}</p>}
    {extra && <p className="text-slate-600">{extra}</p>}
  </div>
);

const Footer: React.FC<{ v: InvoiceViewData; qrUrl?: string | null; qrCaption?: string }> = ({ v, qrUrl, qrCaption }) => (
  <div className="text-xs space-y-3">
    {v.notes && (
      <div>
        <p className="font-bold text-slate-700 mb-0.5">Notes</p>
        <p className="text-slate-600 whitespace-pre-wrap">{v.notes}</p>
      </div>
    )}
    {v.terms && (
      <div>
        <p className="font-bold text-slate-700 mb-0.5">Terms &amp; Conditions</p>
        <p className="text-slate-600 whitespace-pre-wrap">{v.terms}</p>
      </div>
    )}
    {v.bank.length > 0 && (
      <div>
        <p className="font-bold text-slate-700 mb-0.5">Bank Details</p>
        {v.bank.map(([k, val]) => (
          <p key={k} className="text-slate-600">
            <span className="text-slate-500">{k}: </span>
            <span className="font-semibold">{val}</span>
          </p>
        ))}
      </div>
    )}
    {v.showQr && qrUrl && v.seller.upiId && (
      <div className="flex items-center gap-3">
        <img src={qrUrl} alt="Payment QR code" className="w-20 h-20 border border-slate-200 bg-white p-1" />
        <div>
          <p className="font-bold text-slate-700">Pay using UPI</p>
          {qrCaption && <p className="text-slate-500">{qrCaption}</p>}
          {v.seller.upiId && <p className="text-[10px] text-slate-400 font-mono">{v.seller.upiId}</p>}
        </div>
      </div>
    )}
  </div>
);

const Signature: React.FC<{ v: InvoiceViewData }> = ({ v }) => (
  <div className="mt-6 flex flex-col items-end text-xs">
    {v.seller.signatureUrl ? <img src={v.seller.signatureUrl} alt="Authorised signature" className="h-14 max-w-[170px] object-contain" /> : <div className="h-14" />}
    <p className="mt-1 font-bold text-slate-800 text-right">
      Authorised Signature
      <br />
      {v.seller.name}
    </p>
  </div>
);

const CancelledStamp: React.FC<{ v: InvoiceViewData }> = ({ v }) =>
  v.cancelled ? <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-rose-600 border border-rose-400 px-2 py-0.5">Cancelled</span> : null;

// ---------------------------------------------------------------------------
// Modern: colour header band, cards, highlighted total
// ---------------------------------------------------------------------------
export const ModernPaper: React.FC<Props> = ({ bill, profile, qrUrl, qrCaption, color, className }) => {
  const v = invoiceView(bill, profile);
  return (
    <div id="invoice-pdf-content" data-template="modern" className={`w-full max-w-[800px] bg-white shadow-sm text-slate-800 text-[13px] leading-snug overflow-hidden ${className || ''}`}>
      <div className="px-6 sm:px-8 py-6 text-white flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4" style={{ background: color }}>
        <div className="flex items-start gap-4 min-w-0">
          {v.seller.logoUrl ? (
            <img src={v.seller.logoUrl} alt="Logo" className="w-16 h-16 object-contain rounded-lg bg-white p-1 shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-white/20 grid place-items-center font-bold text-lg shrink-0">{v.seller.name.slice(0, 2).toUpperCase()}</div>
          )}
          <div className="min-w-0 text-xs text-white/90 space-y-0.5">
            <p className="text-lg font-bold text-white">{v.seller.name}</p>
            {v.seller.address && <p className="whitespace-pre-wrap">{v.seller.address}</p>}
            {v.seller.gstin && <p>GSTIN: {v.seller.gstin}</p>}
            {v.seller.pan && !v.seller.gstin && <p>PAN: {v.seller.pan}</p>}
            {[v.seller.phone, v.seller.email].filter(Boolean).length > 0 && <p>{[v.seller.phone, v.seller.email].filter(Boolean).join(' · ')}</p>}
            {v.seller.details.map((d, i) => (
              <p key={i}>
                {d.label}: {d.value}
              </p>
            ))}
          </div>
        </div>
        <div className="sm:text-right shrink-0">
          <p className="text-2xl font-extrabold uppercase tracking-wide">{v.labels.title}</p>
          <p className="mt-1 text-sm font-semibold text-white/90">{v.no}</p>
          {v.cancelled && <span className="mt-2 inline-block text-[10px] font-bold uppercase tracking-wider bg-white text-rose-600 px-2 py-0.5 rounded">Cancelled</span>}
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {[
            [v.labels.date, v.date],
            [v.labels.due, v.due],
            ['Place of Supply', v.placeOfSupply],
            ['Vehicle No.', v.vehicleNo],
          ]
            .filter(([, val]) => val)
            .map(([k, val]) => (
              <div key={k} className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{k}</p>
                <p className="font-bold text-slate-800">{val}</p>
              </div>
            ))}
        </div>

        <div className={`grid gap-4 ${v.shipTo ? 'sm:grid-cols-2' : ''}`}>
          <div className="rounded-xl border border-slate-200 p-4">
            <PartyBlock title="Bill To" p={v.billTo} color={color} />
          </div>
          {v.shipTo && (
            <div className="rounded-xl border border-slate-200 p-4">
              <PartyBlock title="Ship To" p={{ ...v.shipTo, name: v.shipTo.name || v.billTo.name }} color={color} />
            </div>
          )}
        </div>

        <ItemsTable v={v} head={{ background: color }} headCls="text-white text-[11px] font-semibold uppercase tracking-wide" zebra />

        <div className="grid grid-cols-1 sm:grid-cols-[1.1fr_1fr] gap-6">
          <Footer v={v} qrUrl={qrUrl} qrCaption={qrCaption} />
          <div>
            <Totals v={v} color={color} strong />
            <p className="mt-3 text-right text-xs text-slate-600">
              <span className="font-bold text-slate-700">In words: </span>
              {v.words}
            </p>
            <Signature v={v} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Minimal: black-and-white, thin rules, one accent line
// ---------------------------------------------------------------------------
export const MinimalPaper: React.FC<Props> = ({ bill, profile, qrUrl, qrCaption, color, className }) => {
  const v = invoiceView(bill, profile);
  return (
    <div id="invoice-pdf-content" data-template="minimal" className={`w-full max-w-[800px] bg-white shadow-sm text-slate-900 text-[13px] leading-snug ${className || ''}`}>
      <div className="p-6 sm:p-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-4 pb-5 border-b-2" style={{ borderColor: color }}>
          <div>
            <p className="text-3xl font-light uppercase tracking-[0.2em]">{v.labels.title}</p>
            <p className="mt-2 text-xs text-slate-500">
              {v.labels.no} <span className="font-semibold text-slate-900">{v.no}</span>
            </p>
            <p className="text-xs text-slate-500">
              {v.labels.date} <span className="font-semibold text-slate-900">{v.date}</span>
              {v.due && (
                <>
                  {' '}
                  · {v.labels.due} <span className="font-semibold text-slate-900">{v.due}</span>
                </>
              )}
            </p>
            <div className="mt-2">
              <CancelledStamp v={v} />
            </div>
          </div>
          <div className="sm:text-right text-xs text-slate-600 space-y-0.5">
            {v.seller.logoUrl && <img src={v.seller.logoUrl} alt="Logo" className="h-12 object-contain sm:ml-auto mb-2" />}
            <p className="text-base font-bold text-slate-900">{v.seller.name}</p>
            {v.seller.address && <p className="whitespace-pre-wrap">{v.seller.address}</p>}
            {v.seller.gstin && <p>GSTIN {v.seller.gstin}</p>}
            {[v.seller.phone, v.seller.email].filter(Boolean).length > 0 && <p>{[v.seller.phone, v.seller.email].filter(Boolean).join(' · ')}</p>}
          </div>
        </div>

        <div className={`grid gap-6 ${v.shipTo ? 'sm:grid-cols-2' : ''}`}>
          <PartyBlock title="Billed To" p={v.billTo} extra={v.placeOfSupply ? `Place of Supply: ${v.placeOfSupply}` : ''} color="#64748b" />
          {v.shipTo && <PartyBlock title="Shipped To" p={{ ...v.shipTo, name: v.shipTo.name || v.billTo.name }} color="#64748b" />}
        </div>

        <ItemsTable v={v} head={{ borderColor: '#0f172a' }} headCls="border-y border-slate-900 text-[11px] font-semibold uppercase tracking-wider text-slate-900" />

        <div className="grid grid-cols-1 sm:grid-cols-[1.1fr_1fr] gap-6">
          <Footer v={v} qrUrl={qrUrl} qrCaption={qrCaption} />
          <div>
            <Totals v={v} color="#0f172a" />
            <p className="mt-3 text-right text-xs text-slate-500 italic">{v.words}</p>
            <Signature v={v} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Thermal receipt (80 mm / 58 mm)
// ---------------------------------------------------------------------------
export const ThermalPaper: React.FC<Props & { width: 80 | 58 }> = ({ bill, profile, qrUrl, width, className }) => {
  const v = invoiceView(bill, profile);
  const narrow = width === 58;
  const Row: React.FC<{ l: React.ReactNode; r: React.ReactNode; b?: boolean }> = ({ l, r, b }) => (
    <div className={`flex justify-between gap-2 ${b ? 'font-bold' : ''}`}>
      <span>{l}</span>
      <span className="text-right">{r}</span>
    </div>
  );
  const Rule = () => <div className="my-1.5 border-t border-dashed border-slate-400" />;
  return (
    <div
      id="invoice-pdf-content"
      data-template={`thermal${width}`}
      className={`bg-white shadow-sm text-slate-900 font-mono ${narrow ? 'text-[10px]' : 'text-[11px]'} leading-snug px-3 py-4 ${className || ''}`}
      style={{ width: narrow ? 230 : 310 }}
    >
      <div className="text-center">
        <p className={`font-bold ${narrow ? 'text-xs' : 'text-sm'}`}>{v.seller.name}</p>
        {v.seller.address && <p>{v.seller.address}</p>}
        {v.seller.phone && <p>Ph: {v.seller.phone}</p>}
        {v.seller.gstin && <p>GSTIN: {v.seller.gstin}</p>}
        <p className="mt-1.5 font-bold uppercase">{v.labels.title}</p>
        {v.cancelled && <p className="font-bold">*** CANCELLED ***</p>}
      </div>
      <Rule />
      <Row l={v.labels.no.replace('.', '')} r={v.no} />
      <Row l="Date" r={v.date} />
      {v.billTo.name && <Row l="To" r={v.billTo.name} />}
      {v.billTo.gstin && <Row l="GSTIN" r={v.billTo.gstin} />}
      <Rule />
      {v.items.map((it, i) => (
        <div key={i} className="mb-1">
          <p className="font-semibold">{it.productName}</p>
          <Row l={`${it.quantity} ${it.unit || ''} x ${num(it.price)}${(it.taxRate || 0) > 0 ? ` +${it.taxRate}%` : ''}`} r={num(it.total)} />
        </div>
      ))}
      <Rule />
      {v.lines.map((l, i) => (
        <Row key={i} l={l.label} r={`${l.sign === '-' ? '-' : ''}${num(l.value)}`} />
      ))}
      <Rule />
      <Row l="TOTAL" r={`Rs. ${num(v.total)}`} b />
      {!v.quote && v.received > 0 && <Row l="Received" r={num(v.received)} />}
      {!v.quote && v.received > 0 && v.balance > 0 && <Row l="Balance" r={num(v.balance)} b />}
      {v.showQr && qrUrl && v.seller.upiId && (
        <div className="mt-2 flex flex-col items-center">
          <img src={qrUrl} alt="Payment QR code" className={narrow ? 'w-24 h-24' : 'w-28 h-28'} />
          <p>Scan to pay by UPI</p>
        </div>
      )}
      <Rule />
      <p className="text-center">Thank you! Visit again.</p>
    </div>
  );
};

export const TemplatePaper: React.FC<Props & { id: Exclude<InvoiceTemplateId, 'classic'> }> = ({ id, ...p }) =>
  id === 'modern' ? <ModernPaper {...p} /> : id === 'minimal' ? <MinimalPaper {...p} /> : <ThermalPaper {...p} width={id === 'thermal58' ? 58 : 80} />;
