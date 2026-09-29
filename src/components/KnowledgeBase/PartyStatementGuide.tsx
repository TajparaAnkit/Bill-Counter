import React from 'react';
import { FaIcon } from '../shared/FaIcon';
import { Callout, Legend, Mark, MockToggle as Toggle, Screen, Step } from './kit';

// Step-by-step help for the Party Statement (Ledger) feature. Shared article
// building blocks (Screen, Step, Mark…) live in ./kit.

// Sample party used across every example so the numbers add up:
// opening ₹500 + INV-0012 ₹2,000 − payment ₹500 + INV-0015 ₹300 = ₹2,300 Dr
const ROWS = [
  { date: '01 Apr 2026', voucher: 'Opening Balance', sr: '—', credit: '—', debit: '₹500.00', balance: '₹500.00 Dr', mark: 3 },
  { date: '05 May 2026', voucher: 'Sales Invoice', sr: 'INV-0012', credit: '—', debit: '₹2,000.00', balance: '₹2,500.00 Dr', mark: 4 },
  { date: '05 May 2026', voucher: 'Payment In', sr: 'INV-0012', credit: '₹500.00', debit: '—', balance: '₹2,000.00 Dr', mark: 5 },
  { date: '01 Jun 2026', voucher: 'Sales Invoice', sr: 'INV-0015', credit: '—', debit: '₹300.00', balance: '₹2,300.00 Dr', mark: 0 },
];

const ToolBtn: React.FC<{ icon: string; label: string }> = ({ icon, label }) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-300 bg-white font-semibold">
    <FaIcon icon={icon} size={11} />
    {label}
  </span>
);

export const PartyStatementGuide: React.FC = () => (
  <>
    <p>
      A <strong>Party Statement</strong> (also called a <em>ledger</em> or <em>account statement</em>) lists every sales invoice and payment for one
      customer, with a running balance. Share it with a customer when you ask for payment, or when you and the customer compare accounts.
    </p>
    <Callout type="tip">
      This feature is <strong>off by default</strong> so small shops keep a simple screen. Turn it on only if you give credit to customers.
    </Callout>

    {/* ---------- Step 1 ---------- */}
    <Step n={1} title="Turn on the feature in Settings">
      <ol>
        <li>Open <strong>Settings</strong> from the sidebar.</li>
        <li>Scroll to the <strong>Features</strong> section.</li>
        <li>Switch on <strong>Party Statement (Ledger)</strong>.</li>
        <li>Click <strong>Save Changes</strong> (top-right or bottom of the page). The feature is not enabled until you save.</li>
      </ol>
      <Screen title="Business Settings → Features">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden min-w-[420px]">
          <div className="px-4 pt-3 pb-2 border-b border-slate-100">
            <div className="text-[13px] font-bold text-slate-900">Features</div>
            <div className="text-[11px] text-slate-500">Turn on extra tools only if your business needs them</div>
          </div>
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <div>
              <div className="font-bold text-slate-700">Party Statement (Ledger)</div>
              <div className="text-[11px] text-slate-400">Adds a customer-wise statement with opening balance, invoices, payments and running balance.</div>
            </div>
            <span className="flex items-center gap-2">
              <Mark n={1} />
              <Toggle on />
            </span>
          </div>
        </div>
        <div className="flex justify-end mt-2 items-center gap-2">
          <Mark n={2} />
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 text-white font-semibold shadow-sm shadow-brand-600/25">
            <FaIcon icon="fa-solid fa-floppy-disk" size={11} />
            Save Changes
          </span>
        </div>
      </Screen>
      <Legend
        items={[
          [1, <>The switch turns violet when it is on.</>],
          [2, <>Save, then open the Customers page again.</>],
        ]}
      />
    </Step>

    {/* ---------- Step 2 ---------- */}
    <Step n={2} title="Open a customer's statement from the Customers page">
      <p>
        Go to <strong>Customers</strong> in the sidebar. Each row now has a statement icon next to Edit and Delete, and the customer
        name is a link. Either one opens the customer&apos;s page.
      </p>
      <Screen title="Customers">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden min-w-[560px]">
          <div className="flex items-center justify-between px-3 pt-3 pb-2">
            <span className="font-bold text-slate-900">
              All parties <span className="ml-1 rounded-full bg-slate-100 px-1.5 text-[10px] text-slate-500">24</span>
            </span>
            <span className="inline-flex rounded-lg bg-slate-100 p-0.5 text-[10px] font-semibold">
              <span className="rounded-md bg-white px-2 py-0.5 shadow-xs">All</span>
              <span className="px-2 py-0.5 text-slate-500">Customers</span>
              <span className="px-2 py-0.5 text-slate-500">Suppliers</span>
            </span>
          </div>
          <div className="grid grid-cols-[1.7fr_0.8fr_1fr_1fr_0.9fr] gap-2 px-3 py-2 border-y border-slate-200 text-[10px] font-medium text-slate-500">
            <span>Name</span>
            <span>Type</span>
            <span>Phone</span>
            <span className="text-right">Balance</span>
            <span />
          </div>
          {[
            { n: 'Ramesh Traders', e: 'ramesh@traders.in', i: 'RT', p: '98250 12345', b: '₹2,300.00', hi: true },
            { n: 'Sita Stores', e: 'sita@stores.in', i: 'SS', p: '99099 54321', b: '₹960.00', hi: false },
          ].map((r) => (
            <div key={r.n} className={`grid grid-cols-[1.7fr_0.8fr_1fr_1fr_0.9fr] gap-2 items-center px-3 py-2.5 border-b border-slate-100 last:border-0 ${r.hi ? 'bg-brand-50/40' : ''}`}>
              <span className="flex items-center gap-2 min-w-0">
                <span className="w-7 h-7 shrink-0 rounded-full bg-brand-50 text-brand-700 text-[10px] font-semibold grid place-items-center">{r.i}</span>
                <span className="min-w-0">
                  <span className={`block font-semibold truncate ${r.hi ? 'text-brand-700 underline' : 'text-slate-900'}`}>{r.n}</span>
                  <span className="block text-[10px] text-slate-400 truncate">{r.e}</span>
                </span>
                {r.hi && <Mark n={1} />}
              </span>
              <span>
                <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700 ring-1 ring-inset ring-brand-100">Customer</span>
              </span>
              <span className="text-slate-600">{r.p}</span>
              <span className="text-right">
                <span className="block font-semibold text-slate-900">{r.b}</span>
                <span className="block text-[10px] text-slate-400">To collect</span>
              </span>
              <span className="flex justify-end items-center gap-2 text-slate-400">
                <span className={r.hi ? 'text-brand-600 bg-brand-50 rounded-md p-1' : 'p-1'}>
                  <FaIcon icon="fa-regular fa-file-lines" size={12} />
                </span>
                {r.hi && <Mark n={2} />}
                <FaIcon icon="fa-regular fa-pen-to-square" size={11} />
                <FaIcon icon="fa-regular fa-trash-can" size={11} />
              </span>
            </div>
          ))}
        </div>
      </Screen>
      <Legend
        items={[
          [1, <>Click the customer&apos;s <strong>name</strong>…</>],
          [2, <>…or the <strong>statement icon</strong> (<FaIcon icon="fa-solid fa-file-lines" size={11} />) next to Edit and Delete.</>],
        ]}
      />
    </Step>

    {/* ---------- Step 3 ---------- */}
    <Step n={3} title="Understand the customer page">
      <p>The customer page opens on the <strong>Ledger (Statement)</strong> tab. The top of the page shows a summary:</p>
      <Screen title="Customer page">
        <div className="min-w-[560px] space-y-2.5">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[10px] text-slate-500">Dashboard › Customers › Ramesh Traders</div>
              <div className="text-base font-bold text-slate-900">Ramesh Traders</div>
              <div className="text-[10px] text-slate-500">Customer · statement, transactions and profile</div>
            </div>
            <span className="flex items-center gap-2">
              <Mark n={1} />
              <span className="px-2.5 py-1 rounded-lg bg-brand-600 text-white font-semibold shadow-sm shadow-brand-600/25">+ Create Sales Invoice</span>
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              ['Mobile Number', '98250 12345', ''],
              ['Credit Period', '30 Days', ''],
              ['Credit Limit', '₹50,000.00', ''],
              ['Closing Balance (To Collect)', '₹2,300.00', 'text-emerald-600'],
            ].map(([k, v, c], i) => (
              <div key={k} className="relative bg-white rounded-xl border border-slate-200 shadow-xs px-3 py-2">
                {i === 3 && <Mark n={2} className="absolute -top-2 -right-2" />}
                <div className="text-[10px] font-semibold text-slate-500">{k}</div>
                <div className={`mt-0.5 text-sm font-bold ${c || 'text-slate-800'}`}>{v}</div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs px-3 py-2.5 flex items-center gap-2">
            <span className="inline-flex rounded-lg bg-slate-100 p-0.5 font-semibold">
              <span className="px-2.5 py-1 text-slate-500">Transactions</span>
              <span className="px-2.5 py-1 text-slate-500">Profile</span>
              <span className="rounded-md bg-white px-2.5 py-1 text-slate-900 shadow-xs">Ledger (Statement)</span>
            </span>
            <Mark n={3} />
          </div>
        </div>
      </Screen>
      <Legend
        items={[
          [1, <><strong>Create Sales Invoice</strong> starts a new bill.</>],
          [2, <><strong>Closing Balance</strong> is the customer&apos;s balance across all dates. Green means <em>To Collect</em> (the customer owes you). Red means <em>To Pay</em> (you owe the customer).</>],
          [3, <>Three tabs: <strong>Transactions</strong> lists every invoice with its payment status, <strong>Profile</strong> shows the customer&apos;s saved details, and <strong>Ledger (Statement)</strong> is the statement itself.</>],
        ]}
      />
    </Step>

    {/* ---------- Step 4 ---------- */}
    <Step n={4} title="Choose the statement period">
      <p>
        Use the dropdown at the top-left of the Ledger tab. The default is <strong>Current Fiscal Year</strong>, which runs from 1 April to today.
      </p>
      <Screen title="Ledger (Statement) → period dropdown">
        <div className="flex items-start gap-4 min-w-[460px]">
          <div className="w-48 bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden">
            <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-brand-600 ring-2 ring-brand-500/20">
              <span>Current Fiscal Year</span>
              <FaIcon icon="fa-solid fa-chevron-up" size={9} />
            </div>
            {['This Month', 'Previous Month', 'Last 30 Days', 'This Quarter', 'Current Fiscal Year', 'Previous Fiscal Year', 'Last 365 Days', 'All Time', 'Custom Date Range'].map((o) => (
              <div
                key={o}
                className={`flex items-center justify-between px-2.5 py-1 border-b border-slate-100 last:border-0 ${o === 'Current Fiscal Year' ? 'bg-brand-50 text-brand-700 font-semibold' : ''}`}
              >
                {o}
                {o === 'Custom Date Range' && <Mark n={1} />}
              </div>
            ))}
          </div>
          <div className="space-y-2 pt-1">
            <div className="text-[11px] text-slate-500">When you choose Custom Date Range:</div>
            <span className="flex items-center gap-2">
              <span className="px-2 py-1 bg-white border border-slate-300 rounded-md">01/04/2026</span>
              <span className="text-slate-400">to</span>
              <span className="px-2 py-1 bg-white border border-slate-300 rounded-md">28/09/2026</span>
              <Mark n={2} />
            </span>
          </div>
        </div>
      </Screen>
      <Legend
        items={[
          [1, <><strong>Custom Date Range</strong> lets you pick any start and end date.</>],
          [2, <>Two date boxes appear. The statement updates as soon as you change a date.</>],
        ]}
      />
      <Callout type="tip">
        Anything dated <em>before</em> the start date is added up and shown as the <strong>Opening Balance</strong> on the first row, so the
        closing balance is correct whatever period you choose.
      </Callout>
    </Step>

    {/* ---------- Step 5 ---------- */}
    <Step n={5} title="Read the statement">
      <p>Below the toolbar is a preview of the statement, laid out the same way as the PDF:</p>
      <Screen title="Ledger (Statement) → statement preview">
        <div className="bg-white rounded-md border border-slate-200 p-4 space-y-3 min-w-[560px]">
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <div>
              <div className="text-sm font-bold text-brand-700">Your Business Name</div>
              <div className="text-[10px] text-slate-500">Mobile: 97127 17273 | GSTIN: 24AORPT2645F1ZN</div>
            </div>
            <div className="text-right">
              <div className="font-bold tracking-wide">PARTY LEDGER</div>
              <div className="text-[10px] text-slate-500">01 Apr 2026 - 28 Sep 2026</div>
            </div>
          </div>
          <div className="flex justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-400">To,</div>
              <div className="font-bold uppercase">Ramesh Traders</div>
              <div className="text-slate-600">Mobile: 98250 12345</div>
            </div>
            <div className="relative rounded-lg bg-brand-100 px-4 py-2 self-start">
              <Mark n={1} className="absolute -top-2 -left-2" />
              <div className="text-[10px] font-bold text-slate-500">Total Receivable</div>
              <div className="text-base font-bold">₹2,300.00</div>
            </div>
          </div>
          <div>
            <div className="grid grid-cols-[1fr_1.1fr_0.9fr_0.9fr_0.9fr_1.1fr] gap-2 bg-brand-100 px-2 py-1.5 text-[10px] font-bold uppercase">
              <span>Date</span>
              <span>Voucher</span>
              <span>Sr No</span>
              <span className="text-right">Credit</span>
              <span className="text-right">Debit</span>
              <span className="text-right">Balance</span>
            </div>
            {ROWS.map((r, i) => (
              <div key={i} className={`grid grid-cols-[1fr_1.1fr_0.9fr_0.9fr_0.9fr_1.1fr] gap-2 px-2 py-1.5 border-b border-slate-100 ${i === 0 ? 'bg-slate-50' : ''}`}>
                <span className="text-slate-600">{r.date}</span>
                <span className="font-semibold flex items-center gap-1">
                  {r.voucher}
                  {r.mark > 0 && <Mark n={r.mark} />}
                </span>
                <span className="font-mono text-[10px] text-slate-500">{r.sr}</span>
                <span className="text-right text-emerald-600">{r.credit}</span>
                <span className="text-right text-rose-600">{r.debit}</span>
                <span className="text-right font-bold">{r.balance}</span>
              </div>
            ))}
            <div className="grid grid-cols-[1fr_1.1fr_0.9fr_0.9fr_0.9fr_1.1fr] gap-2 px-2 py-1.5 bg-slate-100 font-bold">
              <span className="col-span-3 flex items-center gap-1">
                Total <Mark n={6} />
              </span>
              <span className="text-right">₹500.00</span>
              <span className="text-right">₹2,300.00</span>
              <span className="text-right">₹2,300.00 Dr</span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold inline-flex items-center gap-1">
              <Mark n={7} /> Closing Balance: ₹2,300.00 Dr
            </div>
            <div className="text-[10px] text-slate-500">Amount to be collected from the party</div>
          </div>
        </div>
      </Screen>
      <Legend
        items={[
          [1, <><strong>Total Receivable</strong> is the amount the customer owes at the end of the period. It reads <strong>Total Payable</strong> when you owe the customer.</>],
          [3, <><strong>Opening Balance</strong> is the customer&apos;s opening balance plus everything before the start date.</>],
          [4, <><strong>Sales Invoice</strong> is shown as a <strong>Debit</strong> and increases what the customer owes you.</>],
          [5, <><strong>Payment In</strong> is money you received, shown as a <strong>Credit</strong>. It reduces the balance. The Sr No shows which invoice it was paid against.</>],
          [6, <><strong>Total</strong> adds up the credits and debits for the period.</>],
          [7, <><strong>Closing Balance</strong>: <em>Dr</em> means the customer owes you, and <em>Cr</em> means you owe the customer.</>],
        ]}
      />
      <p><strong>Worked example:</strong> for Ramesh Traders the balance builds up like this:</p>
      <pre>
        <code>{`Opening balance (to collect)   ₹  500.00   → 500.00 Dr
+ INV-0012 sales invoice        ₹2,000.00   → 2,500.00 Dr
− Payment received on INV-0012  ₹  500.00   → 2,000.00 Dr
+ INV-0015 sales invoice        ₹  300.00   → 2,300.00 Dr
Closing balance = ₹2,300.00 to collect from Ramesh Traders`}</code>
      </pre>
    </Step>

    {/* ---------- Step 6 ---------- */}
    <Step n={6} title="Download, print or share on WhatsApp">
      <p>The buttons at the top-right of the Ledger tab always use the period you have selected:</p>
      <Screen title="Ledger (Statement) → toolbar">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 shadow-xs px-3 py-2 min-w-[480px]">
          <span className="w-40 flex items-center justify-between px-2.5 py-1 bg-white border border-slate-300 rounded-md">
            Current Fiscal Year <FaIcon icon="fa-solid fa-chevron-down" size={9} />
          </span>
          <span className="flex items-center gap-2">
            <ToolBtn icon="fa-solid fa-download" label="Download PDF" />
            <Mark n={1} />
            <ToolBtn icon="fa-solid fa-print" label="Print" />
            <Mark n={2} />
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#25D366] text-white font-semibold">
              <FaIcon icon="fa-brands fa-whatsapp" size={12} />
              Share
            </span>
            <Mark n={3} />
          </span>
        </div>
      </Screen>
      <Legend
        items={[
          [1, <><strong>Download PDF</strong> saves an A4 file named like <code>Statement_Ramesh_Traders.pdf</code>.</>],
          [2, <><strong>Print</strong> opens the PDF in a new tab with the print dialog. If nothing opens, allow pop-ups for this site in your browser.</>],
          [3, <><strong>Share</strong> on a phone opens the share sheet. Pick WhatsApp and the PDF is attached. On a computer, the PDF is downloaded and a WhatsApp chat with the customer&apos;s mobile number opens, so you can attach the file there.</>],
        ]}
      />
    </Step>

    {/* ---------- Tips ---------- */}
    <Step n={7} title="Tips & troubleshooting">
      <ul>
        <li>
          <strong>I don&apos;t see the statement icon.</strong> Check that the switch in Settings → Features is on and that you clicked <em>Save Changes</em>. Then
          reload the Customers page.
        </li>
        <li>
          <strong>An invoice is missing from the statement.</strong> Choose the customer from your saved list (<em>Select Party</em>) when you create the
          invoice. Older invoices without a saved customer are matched by name, so the name on the invoice must exactly match the customer name.
          Also check the invoice date is inside the period you chose.
        </li>
        <li>
          <strong>Each payment is its own row.</strong> Every payment you save with <em>Record Payment</em> on an invoice appears as a separate{' '}
          <em>Payment In</em> row on the date you entered. See &ldquo;Recording full &amp; partial payments&rdquo;. Payments saved before this feature
          are shown as one row.
        </li>
        <li>
          <strong>Opening balance.</strong> Set it when you add or edit a customer (<em>To Collect</em> or <em>To Pay</em>). It appears as the first row
          of an <em>All Time</em> statement.
        </li>
        <li>
          <strong>Turning the feature off</strong> only hides the statement screens. No invoices, payments or customer data are deleted.
        </li>
      </ul>
    </Step>
  </>
);
