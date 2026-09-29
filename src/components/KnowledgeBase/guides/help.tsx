import React, { useState } from 'react';
import { FaIcon } from '../../shared/FaIcon';
import { Callout, Path, Step } from '../kit';

export const GstBasicsGuide: React.FC = () => (
  <>
    <p>The app works out GST for you. This page explains what it does, so you can check an invoice with confidence.</p>

    <Step n={1} title="CGST + SGST, or IGST?">
      <p>
        It depends on where you are and where the goods or service go (the <strong>Place of Supply</strong>):
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <div className="font-bold text-emerald-900 text-[13px]">Same state → CGST + SGST</div>
          <div className="text-xs text-emerald-900/80 mt-1">You are in Gujarat, the customer is in Gujarat. 18% GST becomes 9% CGST + 9% SGST.</div>
          <div className="mt-2 font-mono text-[11px] bg-white/70 rounded p-2">
            Taxable ₹1,000
            <br />+ CGST 9% ₹90
            <br />+ SGST 9% ₹90
            <br />= Total ₹1,180
          </div>
        </div>
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-3">
          <div className="font-bold text-sky-900 text-[13px]">Different state → IGST</div>
          <div className="text-xs text-sky-900/80 mt-1">You are in Gujarat, the customer is in Maharashtra. The full 18% is IGST.</div>
          <div className="mt-2 font-mono text-[11px] bg-white/70 rounded p-2">
            Taxable ₹1,000
            <br />+ IGST 18% ₹180
            <br />
            <br />= Total ₹1,180
          </div>
        </div>
      </div>
      <p>
        The app compares your <strong>State</strong> (Settings) with the invoice&apos;s <strong>Place of Supply</strong>. Choosing a customer with a GSTIN sets Place of Supply automatically from the first
        two digits of their GSTIN (24 = Gujarat, 27 = Maharashtra…).
      </p>
    </Step>

    <Step n={2} title="Words you'll see on an invoice">
      <div className="my-3 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
        {[
          ['GSTIN', '15-character GST number of a registered business. Yours prints on every invoice; the customer’s prints under Bill To.'],
          ['HSN / SAC', 'Code for the type of goods (HSN) or service (SAC). Save it on the product and it fills in on invoices.'],
          ['Taxable Amount', 'Price × quantity minus discount, before GST.'],
          ['Tax rate', 'GST % for the line: 0, 0.1, 0.25, 1.5, 3, 5, 12, 18 or 28.'],
          ['Tax Invoice', 'The title when any line has GST. Invoices with no GST are titled “Invoice”.'],
          ['Round Off', 'A few paise added or removed so the total is a whole rupee.'],
        ].map(([k, v]) => (
          <div key={k} className="flex gap-3 px-3 py-2">
            <span className="w-32 shrink-0 font-semibold text-slate-800 text-[13px]">{k}</span>
            <span className="text-[13px] text-slate-600">{v}</span>
          </div>
        ))}
      </div>
    </Step>

    <Step n={3} title="Set it up once">
      <ol>
        <li>
          <Path items={['Settings', 'Manage Business']} />: choose <strong>Are you GST Registered? Yes</strong>, enter your GSTIN and check the <strong>State</strong>.
        </li>
        <li>
          <Path items={['Settings', 'Invoice Defaults']} />: turn on <strong>Apply GST on new invoices by default</strong> and enter your usual <strong>Default Tax Rate</strong> (e.g. 18).
        </li>
        <li>Add HSN codes to your products.</li>
      </ol>
      <Callout type="note">This guide explains how the app calculates GST. For which rate applies to your products, or how to file returns, check with your accountant or the GST portal.</Callout>
    </Step>
  </>
);

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: 'Can I edit an invoice after saving it?',
    a: (
      <>
        Yes. Open the invoice and click <strong>Edit</strong> (or <strong>⋯ → Edit</strong> in <strong>Sales Invoices</strong>). The invoice keeps its number and the payments already
        recorded. To void an invoice, use <strong>⋯ → Cancel invoice</strong> instead of deleting it, so your invoice numbers have no gaps.
      </>
    ),
  },
  {
    q: 'How do I give my CA a list of my invoices?',
    a: (
      <>
        Go to <strong>Sales Invoices</strong>, choose the period (<em>Last 30 / 90 / 365 Days</em> or <em>All Time</em>) and click <strong>Export</strong>. You get an Excel file with
        every invoice (GSTIN, taxable amount, CGST / SGST / IGST, totals) and a second sheet with every item line (HSN, qty, GST %).
      </>
    ),
  },
  {
    q: 'Why can’t I create or edit anything? There is a red banner at the top.',
    a: (
      <>
        Your trial or plan has expired. You can still view, download and share everything, but new invoices, products and customers are blocked until the plan is renewed.
        Nothing is deleted. See <em>Your plan, trial &amp; renewal</em>.
      </>
    ),
  },
  {
    q: 'I can’t find Quotations (or Stock, Party Statement, Catalog…).',
    a: <>That feature is not included in your plan, so it&apos;s hidden. Contact us to upgrade.</>,
  },
  {
    q: 'My stock count is wrong.',
    a: (
      <>
        Edit the product and type the correct number in <strong>Current Stock</strong>. From then on invoices keep it up to date. Only invoices saved after stock tracking was turned on
        change the count.
      </>
    ),
  },
  {
    q: 'The QR code on my invoice says “Scan to pay / verify” and doesn’t work.',
    a: (
      <>
        That&apos;s a sample QR. Add your <strong>UPI ID</strong> in <Path items={['Settings', 'Invoice Defaults']} /> and save. New and existing invoices then show a real scan-to-pay QR for the exact amount.
      </>
    ),
  },
  {
    q: 'WhatsApp opened, but the PDF wasn’t attached.',
    a: (
      <>
        Computer browsers can&apos;t attach files to WhatsApp for you. The app downloads the PDF and opens the chat: click 📎 in WhatsApp and choose the downloaded file (usually in your{' '}
        <em>Downloads</em> folder). On a phone, <strong>Share</strong> attaches it automatically.
      </>
    ),
  },
  {
    q: 'WhatsApp opens the wrong chat, or no chat.',
    a: <>The customer&apos;s mobile number is missing or wrong. Add a 10-digit number to the customer (or on the invoice). The app adds India&apos;s +91 for you.</>,
  },
  {
    q: 'Print (on the party statement) does nothing.',
    a: <>Your browser blocked the pop-up. Allow pop-ups for this site (icon at the right of the address bar), then click Print again. Or use Download PDF and print the file.</>,
  },
  {
    q: 'My logo or business details are not on the invoice.',
    a: (
      <>
        Click <strong>Save Changes</strong> after editing Settings: uploads are only kept when you save. Also check <em>Are you GST Registered?</em>: with <em>No</em>, the GSTIN is hidden.
      </>
    ),
  },
  {
    q: 'Why doesn’t an invoice appear on the dashboard or statement?',
    a: (
      <>
        Both use the <strong>invoice date</strong>. Check the period you selected includes that date. For statements, the invoice must be for that saved customer (picked with Select Party).
      </>
    ),
  },
  {
    q: 'I forgot my password.',
    a: (
      <>
        On the login page, type your email, then click <strong>Forgot password?</strong> and follow the email. Check your spam folder if it doesn&apos;t arrive.
      </>
    ),
  },
  {
    q: 'Something went wrong / the page shows an error.',
    a: (
      <>
        Click <strong>Reload Page</strong>. Your saved data is safe. If it keeps happening, check your internet connection: the app needs to be online to save and load data.
      </>
    ),
  },
  {
    q: 'Can I change the colour or tagline of my online catalog?',
    a: <>Not yet: every catalog uses the violet theme and the tagline “Handmade with love”. Your logo, business name and phone come from Settings.</>,
  },
];

export const FaqGuide: React.FC = () => {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <>
      <p>Click a question to see the answer.</p>
      <div className="my-4 space-y-2">
        {FAQS.map((f, i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
              className="w-full flex items-center gap-3 px-4 py-3 text-left font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer"
            >
              <FaIcon icon="fa-solid fa-circle-question" size={13} className="text-brand-500 shrink-0" />
              <span className="flex-1 text-[13px]">{f.q}</span>
              <FaIcon icon="fa-solid fa-chevron-down" size={11} className={`text-slate-400 transition-transform ${open === i ? 'rotate-180' : ''}`} />
            </button>
            {open === i && <div className="px-4 pb-3 pl-11 text-[13px] text-slate-600 leading-relaxed">{f.a}</div>}
          </div>
        ))}
      </div>
    </>
  );
};
