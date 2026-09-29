import React from 'react';
import { FaIcon } from '../../shared/FaIcon';
import { Callout, Legend, Mark, MockBtn, MockField, MockToggle, Panel, Path, MockTable, Screen, Step } from '../kit';

const YesNo: React.FC<{ yes: boolean }> = ({ yes }) => (
  <div className="grid grid-cols-2 gap-2">
    {[
      ['Yes', yes],
      ['No', !yes],
    ].map(([t, on]) => (
      <span key={t as string} className={`flex items-center justify-between px-2.5 py-1.5 rounded-md border font-semibold ${on ? 'border-brand-600 bg-brand-50/40' : 'border-slate-200 text-slate-500'}`}>
        {t}
        <span className={`w-3 h-3 rounded-full border-2 ${on ? 'border-brand-700 bg-brand-700' : 'border-slate-300'}`} />
      </span>
    ))}
  </div>
);

export const BusinessProfileGuide: React.FC = () => (
  <>
    <p>
      Open <Path items={['Sidebar', 'Settings']} />. The <strong>Manage Business</strong> section is what your customers see at the top of every invoice (and on your catalog).
    </p>

    <Step n={1} title="Logo, name and contact details">
      <Screen title="Business Settings → Manage Business">
        <Panel title="Manage Business" subtitle="Details below are shown on your invoices and public catalog" className="min-w-[540px]">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex gap-3">
                <div>
                  <div className="flex items-center gap-1 mb-1 text-[11px] font-semibold text-slate-600">
                    Logo <Mark n={1} />
                  </div>
                  <span className="grid place-items-center w-16 h-16 rounded-md border-2 border-dashed border-brand-300 text-brand-600">
                    <FaIcon icon="fa-solid fa-cloud-arrow-up" size={14} />
                  </span>
                </div>
                <MockField label="Business Name" required value="Dwarkadhish Marketing" className="flex-1" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <MockField label="Company Phone Number" value="9712717273" mark={2} />
                <MockField label="Company E-Mail" placeholder="owner@business.com" />
              </div>
              <MockField label="Billing Address" value="Street, area, landmark" tall />
              <div className="grid grid-cols-3 gap-2">
                <MockField label="State" value="Gujarat" select mark={3} />
                <MockField label="Pincode" value="360001" />
                <MockField label="City" value="Rajkot" />
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex items-center gap-1 mb-1 text-[11px] font-semibold text-slate-600">
                  Are you GST Registered? <Mark n={4} />
                </div>
                <YesNo yes />
              </div>
              <MockField label="GSTIN" required value="24AORPT2645F1ZN" />
              <MockField label="PAN Number" value="AORPT2645F" />
              <div>
                <div className="flex items-center gap-1 mb-1 text-[11px] font-semibold text-slate-600">
                  Signature <Mark n={5} />
                </div>
                <span className="grid place-items-center w-32 h-10 rounded-md border-2 border-dashed border-brand-300 text-slate-400 italic">sign here</span>
              </div>
            </div>
          </div>
        </Panel>
      </Screen>
      <Legend
        items={[
          [1, <><strong>Logo</strong>: a square PNG works best. Without a logo, the invoice shows the “BC” mark.</>],
          [2, <><strong>Company Phone Number</strong> is printed on invoices and is the WhatsApp number on your catalog.</>],
          [3, <><strong>State</strong> decides CGST + SGST (same state as the customer) or IGST (different state).</>],
          [4, <><strong>Yes</strong> shows your GSTIN on invoices. Typing a valid GSTIN fills in State and PAN for you. <strong>No</strong> hides it.</>],
          [5, <><strong>Signature</strong>: a photo of your signature, printed above “Authorised Signature”.</>],
        ]}
      />
    </Step>

    <Step n={2} title="Extra business details">
      <p>
        Business Type, Industry Type and Business Registration Type are for your profile. Use <strong>Add Business Details</strong> to print extra lines under your address, such as{' '}
        <em>Website</em>, <em>MSME Number</em>, <em>FSSAI</em>, <em>Udyam Number</em>, <em>CIN</em>, <em>Drug License</em> or <em>Import Export Code</em>.
      </p>
      <Screen title="Business Settings → Add Business Details">
        <div className="flex items-center gap-2 min-w-[420px]">
          <MockField value="MSME Number" select className="flex-1" />
          <span className="text-slate-400">=</span>
          <MockField value="UDYAM-GJ-20-0012345" className="flex-[1.4]" />
          <MockBtn variant="primary" mark={1}>
            Add
          </MockBtn>
        </div>
      </Screen>
      <Legend items={[[1, <>Enter both a label and a value, then <strong>Add</strong>. Remove a line with its ✕.</>]]} />
    </Step>

    <Step n={3} title="Save">
      <p>
        Click <strong>Save Changes</strong> (top-right or bottom of the page). Nothing, not even a new logo or signature, is kept until you save.
      </p>
      <Callout type="warning">If a field turns red (for example “Invalid GSTIN format” or “Pincode must be 6 digits”), fix it and save again. Nothing is saved while there is an error.</Callout>
    </Step>
  </>
);

export const InvoiceDefaultsGuide: React.FC = () => (
  <>
    <p>
      <Path items={['Settings', 'Invoice Defaults']} /> controls how new invoices start. You can still change these on each invoice.
    </p>
    <Step n={1} title="Numbering, UPI QR and GST">
      <Screen title="Business Settings → Invoice Defaults">
        <Panel title="Invoice Defaults" subtitle="Numbering, tax and payment defaults for new invoices" className="min-w-[520px]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <MockField label="Invoice Number Prefix" value="INV" mark={1} />
              <div className="text-[10px] text-slate-400 mt-1">
                Invoices are numbered like <span className="font-mono">INV-0001</span>. Editable per invoice.
              </div>
            </div>
            <div>
              <MockField label="UPI ID (for Payment QR)" value="yourname@okhdfcbank" mark={2} />
              <div className="text-[10px] text-slate-400 mt-1">Generates a scan-to-pay QR on invoices.</div>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 mt-3 pt-3">
            <span>
              <span className="block font-bold text-slate-700">Apply GST on new invoices by default</span>
              <span className="text-[10px] text-slate-400">Sets the default tax rate on each new line item.</span>
            </span>
            <span className="flex items-center gap-2">
              <Mark n={3} />
              <MockToggle on />
            </span>
          </div>
          <MockField label="Default Tax Rate (%)" value="18" className="w-1/2 mt-2" />
          <MockField label="Default Terms & Conditions" value="Goods once sold cannot be returned. Payment due within 7 days." tall className="mt-3" mark={4} />
        </Panel>
      </Screen>
      <Legend
        items={[
          [1, <>The letters before the invoice number. Use a new prefix each financial year if you like, e.g. <code>FY27</code> → <code>FY27-0001</code>.</>],
          [2, <>Your UPI ID (from GPay, PhonePe, Paytm or your bank app). Invoices then carry a QR the customer can scan to pay the exact amount.</>],
          [3, <>Turn on to put the <strong>Default Tax Rate</strong> on every new invoice line. Leave off if you are not GST registered.</>],
          [4, <>Printed at the bottom of new invoices. Change it on any single invoice.</>],
        ]}
      />
      <Callout type="tip">Don&apos;t forget <strong>Save Changes</strong>. New settings apply to invoices you create after saving; old invoices stay as they were.</Callout>
    </Step>
  </>
);

export const BankGuide: React.FC = () => (
  <>
    <Step n={1} title="Save your bank details">
      <p>
        In <Path items={['Settings', 'Bank Account']} /> fill in <strong>Account Holder</strong>, <strong>Bank Name</strong>, <strong>Account Number</strong>, <strong>IFSC</strong> and{' '}
        <strong>Branch</strong>, then <strong>Save Changes</strong>.
      </p>
      <Screen title="Business Settings → Bank Account">
        <Panel title="Bank Account" subtitle="Optional. Toggle “Add Bank Account” on an invoice to print these details." className="min-w-[460px]">
          <div className="grid grid-cols-2 gap-2">
            <MockField label="Account Holder" value="Dwarkadhish Marketing" />
            <MockField label="Bank Name" value="HDFC Bank" />
            <MockField label="Account Number" value="50100123456789" />
            <div className="grid grid-cols-2 gap-2">
              <MockField label="IFSC" value="HDFC0001234" />
              <MockField label="Branch" value="Rajkot" />
            </div>
          </div>
        </Panel>
      </Screen>
    </Step>
    <Step n={2} title="Print them on an invoice">
      <p>
        When creating an invoice, tick <strong>Add Bank Account</strong> in the left column. The details print under <em>Bank Details</em>. Leave it unticked for customers who pay in cash.
      </p>
    </Step>
  </>
);

export const FeaturesGuide: React.FC = () => (
  <>
    <p>Some tools are only useful for certain businesses, so they are <strong>off</strong> until you switch them on. This keeps the app simple for small shops.</p>
    <Step n={1} title="Switch a feature on or off">
      <Screen title="Business Settings → Features">
        <Panel title="Features" subtitle="Turn on extra tools only if your business needs them" className="min-w-[440px]">
          <div className="flex items-center justify-between gap-4">
            <span>
              <span className="block font-bold text-slate-700">Party Statement (Ledger)</span>
              <span className="text-[10px] text-slate-400">Adds a customer-wise statement with opening balance, invoices, payments and running balance.</span>
            </span>
            <span className="flex items-center gap-2">
              <Mark n={1} />
              <MockToggle on />
            </span>
          </div>
        </Panel>
      </Screen>
      <Legend items={[[1, <>Click the switch (purple = on), then <strong>Save Changes</strong>.</>]]} />
    </Step>
    <Step n={2} title="Available features">
      <div className="my-3 rounded-lg border border-slate-200 bg-white p-3 flex items-start gap-3">
        <span className="grid place-items-center w-9 h-9 rounded-lg bg-sky-50 text-sky-600">
          <FaIcon icon="fa-solid fa-file-lines" size={14} />
        </span>
        <div>
          <div className="font-bold text-slate-800">Party Statement (Ledger)</div>
          <div className="text-xs text-slate-500">
            Customer-wise statement with Dr/Cr balance, PDF, print and WhatsApp sharing. Useful if you give credit. See <em>Party statement (ledger)</em>.
          </div>
        </div>
      </div>
      <Callout type="note">Turning a feature off only hides its screens. No invoices, payments or customers are deleted, and everything is back when you switch it on again.</Callout>
      <Callout type="tip">This switch only shows when your plan includes Party Statement. See <em>Your plan, trial &amp; renewal</em>.</Callout>
    </Step>
  </>
);

// ---------------------------------------------------------------------------
// Your plan, trial & renewal
// ---------------------------------------------------------------------------
export const PlanGuide: React.FC = () => (
  <>
    <p>
      Every account starts with a <strong>14-day free trial</strong> with all features. After that, a paid plan keeps your account active.
    </p>

    <Step n={1} title="The banner at the top">
      <MockTable
        minW={460}
        cols={['You see', 'What it means']}
        rows={[
          [
            <span className="inline-block rounded bg-amber-50 border border-amber-200 px-2 py-1 text-amber-800">Free trial ends in 5 days</span>,
            'Your trial or plan ends soon. Renew before the date shown.',
          ],
          [
            <span className="inline-block rounded bg-rose-50 border border-rose-200 px-2 py-1 text-rose-800">Your plan expired on …</span>,
            'You can still view and download everything, but you can’t create or edit invoices, products or customers until you renew.',
          ],
          [<span className="text-slate-400">No banner</span>, 'Your plan is active.'],
        ]}
      />
      <Callout type="note">Your data is never deleted when a plan expires. Everything is back to normal as soon as it&apos;s renewed.</Callout>
    </Step>

    <Step n={2} title="Features in your plan">
      <p>
        Some tools, like <strong>Quotations</strong>, <strong>Stock Tracking</strong>, <strong>Party Statement</strong>, <strong>Online Catalog</strong>, <strong>Bulk Import</strong>{' '}
        and <strong>Promote Product</strong>, depend on your plan. Anything not included is hidden from the menus and from this Help Center.
      </p>
      <Callout type="tip">Need a feature you don&apos;t see? Contact us using the details in the banner to upgrade.</Callout>
    </Step>
  </>
);

// ---------------------------------------------------------------------------
// Invoice design (template)
// ---------------------------------------------------------------------------
export const TemplatesGuide: React.FC = () => (
  <>
    <p>
      Your invoices and quotations can use one of these designs. <strong>Classic</strong> is the standard layout everyone starts with. Other designs are switched on for your
      account by us. Ask us if you want one.
    </p>
    <Step n={1} title="Available designs">
      <MockTable
        minW={460}
        cols={['Design', 'Paper', 'Best for']}
        rows={[
          ['Classic', 'A4', 'The standard GST tax invoice'],
          ['Modern', 'A4', 'A bold colour header in your brand colour'],
          ['Minimal', 'A4', 'Clean black-and-white, saves printer ink'],
          ['Thermal 3"', '80 mm roll', 'Shops with a 3-inch thermal receipt printer'],
          ['Thermal 2"', '58 mm roll', 'Small 2-inch thermal / Bluetooth printers'],
        ]}
      />
    </Step>
    <Step n={2} title="Choose your design">
      <p>
        If your account allows it, go to <Path items={['Settings', 'Invoice Template']} />, click a design (and a colour for Modern or Minimal), then <strong>Save Changes</strong>.
        Every invoice and quotation, on screen, in the PDF and on WhatsApp, uses it from then on, including old invoices.
      </p>
      <Callout type="note">Don&apos;t see the Invoice Template section? Your design is set for you. Contact us to change it.</Callout>
    </Step>
    <Step n={3} title="Printing on a thermal printer">
      <p>
        With a thermal design, open the invoice, click <strong>Download PDF</strong> and print it. In the print dialog choose your thermal printer, set the paper to 80 mm (or
        58 mm), scale <strong>100%</strong> / <em>Actual size</em>, and margins <strong>None</strong>. The receipt is exactly as long as the bill, so nothing is wasted.
      </p>
    </Step>
  </>
);
