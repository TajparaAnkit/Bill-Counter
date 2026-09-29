import React from 'react';
import { FaIcon } from '../../shared/FaIcon';
import { Callout, Legend, Mark, MockBadge, MockBtn, MockField, MockTable, Screen, Step } from '../kit';

export const PaymentsGuide: React.FC = () => (
  <>
    <p>
      A customer can pay an invoice at once or in parts. Record each payment when the money arrives. The invoice then works out <strong>Received</strong>, <strong>Balance Due</strong> and
      its status (<MockBadge status="unpaid" /> → <MockBadge status="partial" /> → <MockBadge status="paid" />) for you.
    </p>
    <div className="my-4 rounded-lg border border-slate-200 bg-white p-4">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Example used in this guide</div>
      <div className="flex flex-wrap items-center gap-2 text-[13px]">
        <span className="rounded-md bg-slate-100 px-2 py-1">1 Sep · INV-0001 · ₹100</span>
        <FaIcon icon="fa-solid fa-arrow-right" size={10} className="text-slate-400" />
        <span className="rounded-md bg-amber-50 text-amber-800 px-2 py-1">5 Sep · paid ₹50</span>
        <FaIcon icon="fa-solid fa-arrow-right" size={10} className="text-slate-400" />
        <span className="rounded-md bg-emerald-50 text-emerald-800 px-2 py-1">15 Sep · paid ₹50</span>
      </div>
    </div>

    <Step n={1} title="Open the invoice and click Record Payment">
      <p>
        Go to <strong>Sales Invoices</strong> and click the invoice number. In the bar under the title, click <strong>+ Record Payment</strong>.
      </p>
      <Screen title="Invoice → payment bar">
        <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 shadow-xs px-3 py-2 min-w-[440px]">
          <span className="flex items-center gap-2">
            <MockBadge status="unpaid" /> Due: <strong className="text-rose-600">₹100.00</strong>
          </span>
          <span className="flex items-center gap-2">
            <MockBtn variant="soft" mark={2}>
              Mark Fully Paid
            </MockBtn>
            <MockBtn icon="fa-solid fa-plus" mark={1}>
              Record Payment
            </MockBtn>
          </span>
        </div>
      </Screen>
      <Legend
        items={[
          [1, <><strong>Record Payment</strong> for any amount: part or full.</>],
          [2, <><strong>Mark Fully Paid</strong> is a shortcut: it records the whole balance as received <em>today</em>.</>],
        ]}
      />
    </Step>

    <Step n={2} title="Enter the payment">
      <Screen title="Record Payment In">
        <div className="mx-auto max-w-sm bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200">
            <span className="grid place-items-center w-8 h-8 rounded-full bg-emerald-50 text-emerald-600">
              <FaIcon icon="fa-solid fa-indian-rupee-sign" size={12} />
            </span>
            <div>
              <div className="font-bold text-slate-800">Record Payment In</div>
              <div className="text-[10px] text-slate-500">INV-0001 · Customer A</div>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                ['Invoice Total', '₹100.00', 'text-slate-800'],
                ['Received', '₹0.00', 'text-emerald-600'],
                ['Balance Due', '₹100.00', 'text-rose-600'],
              ].map(([k, v, c]) => (
                <div key={k} className="rounded-md bg-slate-50 border border-slate-200 py-1.5">
                  <div className="text-[10px] text-slate-500">{k}</div>
                  <div className={`font-bold ${c}`}>{v}</div>
                </div>
              ))}
            </div>
            <MockField label="Amount Received" required value="50" prefix="₹" mark={1} />
            <div className="text-[10px] text-slate-400 -mt-2">Enter only the money received now. Balance after this payment: ₹50.00</div>
            <div className="grid grid-cols-2 gap-2">
              <MockField label="Payment Date" value="05/09/2026" mark={2} />
              <MockField label="Payment Mode" value="Cash" select mark={3} />
            </div>
            <MockField label="Notes (optional)" placeholder="e.g. UPI ref 4123…, cheque no." />
            <div className="flex justify-end gap-2">
              <MockBtn variant="secondary">Cancel</MockBtn>
              <MockBtn>Save Payment</MockBtn>
            </div>
          </div>
        </div>
      </Screen>
      <Legend
        items={[
          [1, <>Type only the money received <strong>now</strong> (₹50), not the running total. It can&apos;t be more than the balance due.</>],
          [2, <>The day you actually received it. It can be an earlier date, but not a future one.</>],
          [3, <>Cash, UPI, Card, Bank or Other. Add a UPI reference or cheque number in <strong>Notes</strong> if you like.</>],
        ]}
      />
      <p>
        After <strong>Save Payment</strong> the invoice shows <MockBadge status="partial" /> with ₹50 due. On 15 Sep repeat the same steps with ₹50 (or click <strong>Mark Fully Paid</strong>) and it becomes{' '}
        <MockBadge status="paid" />.
      </p>
    </Step>

    <Step n={3} title="See and correct payment history">
      <Screen title="Invoice → Payment History">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs px-3 py-2 min-w-[440px]">
          <div className="flex justify-between font-bold text-slate-600 mb-2">
            <span>
              Payment History (2) · Received <span className="text-emerald-600">₹100.00</span>
            </span>
            <FaIcon icon="fa-solid fa-chevron-up" size={10} />
          </div>
          {[
            ['05 Sept 2026', 'Cash', 'First instalment', '₹50.00'],
            ['15 Sept 2026', 'UPI', 'UPI ref 4123', '₹50.00'],
          ].map(([d, m, n, a], i) => (
            <div key={d} className="flex items-center gap-3 py-1.5 border-t border-slate-100">
              <span className="w-24 text-slate-600">{d}</span>
              <span className="w-10 font-semibold text-slate-500">{m}</span>
              <span className="flex-1 text-slate-400">{n}</span>
              <span className="font-bold text-emerald-600">{a}</span>
              <span className="flex items-center gap-1 text-slate-400">
                <FaIcon icon="fa-solid fa-trash" size={10} />
                {i === 1 && <Mark n={1} />}
              </span>
            </div>
          ))}
        </div>
      </Screen>
      <Legend items={[[1, <>Entered a wrong amount or date? Click 🗑 to delete that payment (you&apos;ll be asked to confirm), then record it again.</>]]} />
    </Step>

    <Step n={4} title="Where payments show up">
      <ul>
        <li>
          <strong>Sales Invoices</strong>: status badge, <em>(₹x unpaid)</em> and <em>Due In</em>.
        </li>
        <li>
          <strong>Dashboard</strong>: <em>Payments received</em>, <em>To collect</em>, <em>How customers pay</em> and <em>Recent activity</em>.
        </li>
        <li>
          <strong>Party Statement</strong>: each payment is its own <em>Payment In</em> row on the date received.
        </li>
        <li>The printed invoice shows <strong>Received Amount</strong> and <strong>Balance</strong>.</li>
      </ul>
      <Callout type="note">Money entered in <em>Total Amount Received</em> while creating an invoice is saved as its first payment. Invoices paid before payment history existed show one combined payment.</Callout>
    </Step>
  </>
);

// ---------------------------------------------------------------------------
// Payment reminders on WhatsApp
// ---------------------------------------------------------------------------
export const RemindersGuide: React.FC = () => (
  <>
    <p>
      Send a polite “payment pending” message on WhatsApp in one click. The message is written for you and includes the amount, the invoice number and your UPI ID.
    </p>

    <Step n={1} title="Where to find the reminder button">
      <MockTable
        minW={460}
        cols={['Screen', 'Button', 'Reminds about']}
        rows={[
          ['Sales Invoices → row', <FaIcon icon="fa-regular fa-bell" size={12} />, 'That invoice’s balance'],
          ['Invoice view', <MockBtn variant="soft" icon="fa-brands fa-whatsapp">Remind</MockBtn>, 'That invoice’s balance'],
          ['Dashboard → Overdue', <MockBtn variant="soft" icon="fa-brands fa-whatsapp">Remind</MockBtn>, 'That overdue invoice'],
          ['Customers → row', <FaIcon icon="fa-regular fa-bell" size={12} />, 'Everything the customer owes'],
        ]}
      />
      <p className="mt-3">The button only appears when money is due. It isn&apos;t shown on paid or cancelled invoices.</p>
    </Step>

    <Step n={2} title="What the customer receives">
      <Screen title="WhatsApp message">
        <div className="max-w-[360px] rounded-lg bg-[#dcf8c6] p-3 text-slate-800 whitespace-pre-line text-[12px] leading-relaxed">
          {'Dear Ramesh Traders,\nThis is a friendly reminder that ₹3,422.00 is pending on invoice INV-0049 dated 29 Sep 2026 (due 14 Oct 2026).\nYou can pay via UPI: yourshop@okhdfcbank\nThank you,\nDwarkadhish Marketing'}
        </div>
      </Screen>
      <p>WhatsApp opens with this message ready. Read it, change anything you like, and press send.</p>
      <Callout type="tip">
        Add your <strong>UPI ID</strong> in Settings so the reminder tells the customer how to pay. The customer&apos;s phone number comes from the invoice (or the customer&apos;s
        saved details); without one, WhatsApp asks you to pick the chat.
      </Callout>
    </Step>
  </>
);
