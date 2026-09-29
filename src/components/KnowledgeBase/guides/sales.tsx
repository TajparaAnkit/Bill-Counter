import React from 'react';
import { FaIcon } from '../../shared/FaIcon';
import { Callout, Legend, Mark, MockBadge, MockBtn, MockCheck, MockField, MockTable, Panel, Path, Screen, Step } from '../kit';

// ---------------------------------------------------------------------------
// Create a sales invoice
// ---------------------------------------------------------------------------
export const CreateInvoiceGuide: React.FC = () => (
  <>
    <p>
      Open the invoice editor with <Path items={['Top bar', 'New Invoice']} /> (or <strong>+ Sales Invoice</strong> on the Dashboard). The editor is one page:
      party on the left, invoice details on the right, items in the middle and totals at the bottom.
    </p>

    <Step n={1} title="Choose the party (Bill To)">
      <p>
        The party list opens by itself. Search by name, phone or GSTIN and click a saved customer. Their address, GSTIN, PAN, shipping address, credit period and the
        correct <strong>Place of Supply</strong> are filled in for you.
      </p>
      <Screen title="Create Sales Invoice → Bill To">
        <div className="grid grid-cols-2 gap-3 min-w-[520px]">
          <Panel title="Bill To" right={<MockBtn variant="secondary" mark={1}>Change Party</MockBtn>}>
            <div className="space-y-1">
              <div className="font-bold text-slate-800">RAMESH TRADERS</div>
              <div className="text-slate-500">Address: 12, Station Road, Rajkot</div>
              <div className="text-slate-500">Phone: 98250 12345</div>
              <div className="text-slate-500">GSTIN: 24AAYFG2879D1ZZ</div>
              <div className="text-brand-700 font-semibold flex items-center gap-1">
                + Add PAN <Mark n={2} />
              </div>
            </div>
          </Panel>
          <Panel title="Invoice Details">
            <div className="grid grid-cols-2 gap-2">
              <MockField label="Invoice Prefix" value="INV" />
              <MockField label="Invoice Number" value="15" mark={3} />
              <MockField label="Sales Invoice Date" value="28/09/2026" />
              <MockField label="Payment Terms" value="30" suffix="Days" mark={4} />
              <MockField label="Due Date" value="28/10/2026" />
              <MockField label="Vehicle No." placeholder="e.g. GJ03AB1234" />
            </div>
          </Panel>
          <div className="col-span-2">
            <MockField label="Place of Supply" value="Gujarat" select mark={5} />
          </div>
        </div>
      </Screen>
      <Legend
        items={[
          [1, <><strong>Change Party</strong> picks someone else. Not a saved customer? Type the name and choose <em>Use “name” as a one-time customer</em>.</>],
          [2, <><strong>Edit Details</strong>, <em>+ Add GSTIN</em> and <em>+ Add PAN</em> change the details <em>on this invoice only</em>. To change the saved customer, edit them under Customers.</>],
          [3, <>The next number is filled in (<code>INV-0015</code>). You can change it, but two invoices can&apos;t have the same number.</>],
          [4, <>Payment terms come from the customer&apos;s credit period; the <strong>Due Date</strong> updates automatically.</>],
          [5, <>Same state as your business → <strong>CGST + SGST</strong>. Different state → <strong>IGST</strong> (you&apos;ll see “Inter-state supply: IGST will apply”).</>],
        ]}
      />
    </Step>

    <Step n={2} title="Add items">
      <p>
        Start typing in <strong>Items</strong> and pick a product. Price, HSN, unit and the default GST rate fill in. You can also type any item that isn&apos;t in your product list.
      </p>
      <Screen title="Create Sales Invoice → Items">
        <MockTable
          minW={600}
          cols={['No', 'Items', 'HSN', 'Qty', 'Price/Item (₹)', 'Discount', 'Tax', 'Amount (₹)']}
          align={['l', 'l', 'l', 'r', 'r', 'r', 'r', 'r']}
          rows={[
            [
              '1',
              <span className="font-semibold">EPOXY NORMAL 5 KG</span>,
              '3814',
              '2 PCS',
              '1,059.00',
              <span className="inline-flex items-center gap-1">
                5% <Mark n={1} />
              </span>,
              <span className="inline-flex items-center gap-1">
                18% <Mark n={2} />
              </span>,
              <span className="font-bold">2,374.28</span>,
            ],
            ['2', <span className="font-semibold">Swastik border</span>, '—', '10 PCS', '70.00', '—', '5%', <span className="font-bold">735.00</span>],
          ]}
        />
        <div className="flex items-center gap-2 mt-2">
          <MockBtn variant="secondary" icon="fa-solid fa-plus" mark={3}>
            Add Item
          </MockBtn>
          <span className="text-slate-400">+ Enter Description (optional)</span>
        </div>
      </Screen>
      <Legend
        items={[
          [1, <><strong>Discount</strong>: type it in ₹ <em>or</em> % — the other box updates.</>],
          [2, <><strong>Tax</strong>: choose the GST rate for this line (0% to 28%). The <strong>Amount</strong> includes tax.</>],
          [3, <><strong>+ Add Item</strong> adds another line. The ✕ at the end of a row removes it (an invoice needs at least one item).</>],
        ]}
      />
    </Step>

    <Step n={3} title="Check totals, charges and payment">
      <Screen title="Create Sales Invoice → Totals">
        <div className="grid grid-cols-2 gap-3 min-w-[520px]">
          <div className="space-y-2">
            {[
              ['Add Notes', false],
              ['Add Terms & Conditions', true],
              ['Add Bank Account', true],
              ['Add Payment QR', true],
            ].map(([l, on]) => (
              <div key={l as string} className="flex items-center justify-between bg-white rounded-md border border-slate-200 px-3 py-2">
                <span className="font-semibold text-slate-700">{l}</span>
                <MockCheck on={on as boolean} />
              </div>
            ))}
            <Mark n={1} />
          </div>
          <div className="bg-white rounded-md border border-slate-200 p-3 space-y-1.5">
            <div className="flex justify-between text-brand-700 font-semibold">
              + Add Additional Charges <Mark n={2} />
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Taxable Amount</span>2,712.10
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">SGST @9%</span>198.59
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">CGST @9%</span>198.59
            </div>
            <div className="flex justify-between items-center">
              <MockCheck on label="Auto Round Off" />
              <span className="flex items-center gap-1">
                − 0.28 <Mark n={3} />
              </span>
            </div>
            <div className="flex justify-between font-bold text-sm border-t border-slate-200 pt-1.5">
              <span>Total Amount:</span>₹3,109.00
            </div>
            <div className="text-[11px] font-semibold text-slate-600 pt-1">Total Amount Received</div>
            <div className="flex items-center gap-2">
              <MockField value="1,000" prefix="₹" suffix="UPI" className="flex-1" />
              <Mark n={4} />
            </div>
            <MockCheck label="Mark as fully paid" />
            <div className="flex justify-between font-bold text-emerald-700">
              <span>Balance Amount</span>₹2,109.00
            </div>
          </div>
        </div>
      </Screen>
      <Legend
        items={[
          [1, <>Tick what to print: <strong>Notes</strong>, <strong>Terms &amp; Conditions</strong> (pre-filled from Settings), your <strong>Bank Account</strong> and a <strong>Payment QR</strong> (needs a UPI ID in Settings).</>],
          [2, <><strong>Additional Charges</strong> (delivery, packing…) and <strong>Add Discount</strong> (a discount on the whole bill, after tax).</>],
          [3, <><strong>Auto Round Off</strong> rounds to the nearest rupee. Untick it to add or reduce an amount yourself.</>],
          [4, <>Money received right now, and how (Cash, UPI, Card, Bank, Other). It is saved as the first payment. Leave it at 0 if nothing is paid yet.</>],
        ]}
      />
    </Step>

    <Step n={4} title="Preview and save">
      <div className="flex flex-wrap items-center gap-2 my-3">
        <MockBtn variant="ghost" icon="fa-solid fa-arrow-left">
          Exit
        </MockBtn>
        <span className="inline-flex rounded-md border border-slate-300 overflow-hidden font-semibold">
          <span className="px-2.5 py-1 bg-brand-600 text-white">Edit Mode</span>
          <span className="px-2.5 py-1 bg-white text-slate-600">Preview Mode</span>
        </span>
        <Mark n={1} />
        <MockBtn mark={2}>Save Sales Invoice</MockBtn>
      </div>
      <Legend
        items={[
          [1, <><strong>Preview Mode</strong> shows the invoice exactly as it will print. Switch back to <strong>Edit Mode</strong> to change anything.</>],
          [2, <><strong>Save Sales Invoice</strong> saves it and opens the finished invoice, ready to download or share.</>],
        ]}
      />
      <Callout type="warning">
        <strong>Check before saving.</strong> A saved invoice can&apos;t be edited. To fix a mistake, delete it from the invoice list and create it again. <strong>Exit</strong> leaves without saving and doesn&apos;t ask first.
      </Callout>
      <Callout type="note">
        The app stops you from saving if there&apos;s no party, no item, the invoice number already exists, or the GSTIN/PAN format is wrong. The message at the top-right says what to fix.
      </Callout>
    </Step>
  </>
);

// ---------------------------------------------------------------------------
// View, download & share
// ---------------------------------------------------------------------------
export const InvoiceShareGuide: React.FC = () => (
  <>
    <p>
      Click an invoice number in <Path items={['Sidebar', 'Sales Invoices']} /> (or an item under Recent activity on the Dashboard). The invoice opens with actions at the top.
    </p>

    <Step n={1} title="The invoice window">
      <Screen title="Invoice: INV-0015">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden min-w-[520px]">
          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
            <span className="font-bold text-slate-800">Invoice: INV-0015</span>
            <span className="flex items-center gap-2">
              <MockBtn variant="whatsapp" icon="fa-brands fa-whatsapp" mark={1}>
                Share
              </MockBtn>
              <MockBtn icon="fa-solid fa-file-arrow-down" mark={2}>
                Download PDF
              </MockBtn>
              <FaIcon icon="fa-solid fa-xmark" size={14} className="text-slate-400" />
            </span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
            <span className="flex items-center gap-2">
              <MockBadge status="partial" /> Due: <strong className="text-rose-600">₹2,109.00</strong>
              <Mark n={3} />
            </span>
            <span className="flex items-center gap-2">
              <MockBtn variant="soft">Mark Fully Paid</MockBtn>
              <MockBtn icon="fa-solid fa-plus">Record Payment</MockBtn>
            </span>
          </div>
          <div className="bg-slate-100 p-3">
            <div className="bg-white border border-slate-200 p-3 space-y-2">
              <div className="flex justify-between">
                <span className="font-bold text-brand-700">Dwarkadhish Marketing</span>
                <span className="font-bold">
                  TAX INVOICE <span className="ml-1 border border-slate-300 px-1 text-[9px] text-slate-500">ORIGINAL FOR RECIPIENT</span>
                </span>
              </div>
              <div className="h-8 rounded bg-slate-50 border border-dashed border-slate-200 grid place-items-center text-slate-400">items…</div>
              <div className="flex justify-between items-end">
                <span className="flex items-center gap-2">
                  <span className="w-9 h-9 grid place-items-center border border-slate-300 rounded">
                    <FaIcon icon="fa-solid fa-qrcode" size={20} />
                  </span>
                  <span>
                    <span className="block font-bold">Pay using UPI</span>
                    <span className="text-slate-400">Scan to pay ₹3,109.00</span>
                  </span>
                  <Mark n={4} />
                </span>
                <span className="text-right">
                  <span className="block font-bold">Total Amount ₹3,109.00</span>
                  <span className="text-slate-400">Received ₹1,000.00 · Balance ₹2,109.00</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </Screen>
      <Legend
        items={[
          [1, <><strong>Share</strong> sends the invoice PDF on WhatsApp (see step 2).</>],
          [2, <><strong>Download PDF</strong> saves a print-ready A4 file named like <code>Invoice_INV-0015.pdf</code>.</>],
          [3, <>Payment status and what&apos;s still due. Record payments here. See <em>Record full &amp; partial payments</em>.</>],
          [4, <>With a UPI ID in Settings, this is a real <strong>scan-to-pay QR</strong> for the exact invoice amount. Without one, a sample QR is shown.</>],
        ]}
      />
    </Step>

    <Step n={2} title="Send it on WhatsApp">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3">
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <FaIcon icon="fa-solid fa-mobile-screen" size={13} className="text-brand-600" /> On a phone
          </div>
          <div className="mt-1 text-xs text-slate-600">Tap <strong>Share</strong>, then choose <strong>WhatsApp</strong> and the customer. The PDF is attached automatically.</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <FaIcon icon="fa-solid fa-desktop" size={13} className="text-brand-600" /> On a computer
          </div>
          <div className="mt-1 text-xs text-slate-600">
            Click <strong>Share</strong>. The PDF downloads and a WhatsApp chat with the customer&apos;s number opens. Click 📎 in WhatsApp and attach the downloaded file.
          </div>
        </div>
      </div>
      <Callout type="tip">Save the customer&apos;s <strong>mobile number</strong> on the invoice (or in Customers) so WhatsApp opens the right chat straight away.</Callout>
    </Step>

    <Step n={3} title="What the printed invoice shows">
      <ul>
        <li>Your business block: logo, name, address, GSTIN (or PAN), mobile, email and extra details such as MSME number.</li>
        <li>
          Title <strong>TAX INVOICE</strong> when the bill has GST, otherwise <strong>INVOICE</strong>, marked <em>Original for Recipient</em>.
        </li>
        <li>Bill To / Ship To, Place of Supply, items with HSN, discount and tax, then CGST/SGST or IGST, charges, round off and <strong>Total Amount (in words)</strong>.</li>
        <li>Notes, Terms &amp; Conditions, bank details and the UPI QR if you ticked them, plus your signature.</li>
      </ul>
    </Step>
  </>
);

// ---------------------------------------------------------------------------
// Invoice list
// ---------------------------------------------------------------------------
export const SalesListGuide: React.FC = () => (
  <>
    <p>
      <Path items={['Sidebar', 'Sales Invoices']} /> lists all your invoices, newest first, with totals at the top.
    </p>

    <Step n={1} title="Filter, search and read the list">
      <Screen title="Sales Invoices">
        <div className="space-y-3 min-w-[600px]">
          <div className="grid grid-cols-4 gap-2">
            {[
              ['Total sales', '₹1,99,918', 'bg-brand-50 text-brand-600', 'fa-solid fa-chart-simple'],
              ['Received', '₹1,20,656', 'bg-emerald-50 text-emerald-600', 'fa-solid fa-circle-check'],
              ['Outstanding', '₹79,262', 'bg-amber-50 text-amber-600', 'fa-solid fa-hourglass-half'],
              ['Overdue', '₹72,095', 'bg-rose-50 text-rose-600', 'fa-solid fa-triangle-exclamation'],
            ].map(([k, v, c, i], idx) => (
              <div key={k} className="relative flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-3 py-2">
                {idx === 0 && <Mark n={1} className="absolute -top-2 -right-2" />}
                <span className={`grid h-7 w-7 place-items-center rounded-lg ${c}`}>
                  <FaIcon icon={i} size={11} />
                </span>
                <span>
                  <span className="block text-[10px] text-slate-500">{k}</span>
                  <span className="block font-bold text-slate-900">{v}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-3 py-2.5">
              <span className="font-bold text-slate-900">All invoices</span>
              <span className="flex items-center gap-2">
                <MockField placeholder="Search party, invoice no., GSTIN…" className="w-48" mark={2} />
                <span className="inline-flex rounded-lg bg-slate-100 p-0.5 font-semibold">
                  <span className="rounded-md bg-white px-2 py-0.5 shadow-xs">All</span>
                  <span className="px-2 py-0.5 text-slate-500">Paid</span>
                  <span className="px-2 py-0.5 text-slate-500">Unpaid</span>
                  <span className="px-2 py-0.5 text-slate-500">Overdue</span>
                </span>
                <Mark n={3} />
              </span>
            </div>
            <MockTable
              minW={580}
              cols={['Invoice', 'Customer', 'Due', 'Status', 'Amount', '']}
              align={['l', 'l', 'l', 'l', 'r', 'r']}
              rows={[
                [
                  <span className="font-mono font-semibold">INV-0015</span>,
                  'Ramesh Traders',
                  <span>
                    10 Oct 2026 <span className="block text-[10px] text-slate-500">Due in 12 days</span>
                  </span>,
                  <span className="rounded-md bg-amber-400 px-1.5 py-0.5 text-[10px] font-semibold text-amber-950">Partial</span>,
                  <span>
                    ₹9,727 <span className="block text-[10px] text-slate-400">₹4,863 due</span>
                  </span>,
                  <span className="flex items-center justify-end gap-2 text-slate-400">
                    <FaIcon icon="fa-solid fa-download" size={11} />
                    <FaIcon icon="fa-brands fa-whatsapp" size={12} />
                    <FaIcon icon="fa-solid fa-ellipsis" size={12} />
                    <Mark n={4} />
                  </span>,
                ],
                [
                  <span className="font-mono font-semibold">INV-0024</span>,
                  'Ramesh Traders',
                  <span>
                    27 Sep 2026 <span className="block text-[10px] text-rose-600 font-semibold">Overdue by 1 day</span>
                  </span>,
                  <span className="rounded-md bg-rose-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">Overdue</span>,
                  '₹9,997',
                  <span className="flex items-center justify-end gap-2 text-slate-400">
                    <FaIcon icon="fa-solid fa-download" size={11} />
                    <FaIcon icon="fa-brands fa-whatsapp" size={12} />
                    <FaIcon icon="fa-solid fa-ellipsis" size={12} />
                  </span>,
                ],
                [
                  <span className="font-mono font-semibold">INV-0014</span>,
                  'Sita Stores',
                  '06 Oct 2026',
                  <span className="rounded-md bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">Paid</span>,
                  '₹696',
                  <span className="flex items-center justify-end gap-2 text-slate-400">
                    <FaIcon icon="fa-solid fa-download" size={11} />
                    <FaIcon icon="fa-brands fa-whatsapp" size={12} />
                    <FaIcon icon="fa-solid fa-ellipsis" size={12} />
                  </span>,
                ],
              ]}
            />
          </div>
        </div>
      </Screen>
      <Legend
        items={[
          [1, <>Totals for the chosen date range: <strong>Total sales</strong>, <strong>Received</strong>, <strong>Outstanding</strong> and <strong>Overdue</strong> (past the due date). Change the range with the dropdown at the top-right (<em>Last 30 / 90 / 365 Days</em> or <em>All Time</em>).</>],
          [2, <>Search by party name, invoice number, GSTIN or phone.</>],
          [3, <>Tabs show <strong>All</strong>, <strong>Paid</strong>, <strong>Unpaid</strong> (includes Partial) or <strong>Overdue</strong> invoices, with a count on each. A <strong>Cancelled</strong> tab appears once you cancel an invoice.</>],
          [4, <>Row buttons: <strong>download PDF</strong>, <strong>share on WhatsApp</strong>, the <strong>bell</strong> to send a payment reminder (unpaid invoices), and <strong>⋯</strong> for <em>View</em>, <em>Edit</em>, <em>Record payment</em>, <em>Cancel invoice</em> and <em>Delete</em>. Click the invoice number to open it.</>],
        ]}
      />
      <Callout type="tip">Click a column heading (Invoice, Customer, Issued, Due, Amount) to sort by it; click again to reverse the order.</Callout>
    </Step>

    <Step n={2} title="Export invoices to Excel">
      <p>
        Pick a period in the date range dropdown (<em>Last 30 / 90 / 365 Days</em> or <em>All Time</em>), optionally a tab (Paid, Unpaid…) or a search, then click{' '}
        <MockBtn variant="secondary" icon="fa-solid fa-file-excel">Export</MockBtn>. You get an Excel file of exactly the invoices in the list (all pages), with two sheets:
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong>Invoices</strong>: one row per invoice with date, party, GSTIN, taxable amount, CGST / SGST / IGST, total, received, balance and status, plus a{' '}
          <strong>TOTAL</strong> row at the bottom.
        </li>
        <li>
          <strong>Items</strong>: one row per item line with HSN, quantity, rate, GST % and amount.
        </li>
      </ul>
      <Callout type="tip">Send this file to your CA every month. Cancelled invoices are listed with the status “Cancelled” but are not counted in the totals or the Items sheet.</Callout>
    </Step>

    <Step n={3} title="Fix, cancel or delete an invoice">
      <p>
        Click <strong>⋯</strong> on the row → <strong>Edit</strong> to correct a saved invoice, or <strong>Cancel invoice</strong> to void it while keeping its number. See{' '}
        <em>Edit or cancel an invoice</em> for details.
      </p>
      <p>
        <strong>Delete</strong> removes the invoice and its payments permanently, and leaves a gap in your invoice numbers.
      </p>
      <Callout type="warning">Deleting can&apos;t be undone. For invoices already sent to a customer, cancel instead.</Callout>
      <Callout type="tip">To record money received later, you don&apos;t need to edit the invoice. Open it and use <strong>Record Payment</strong>.</Callout>
    </Step>
  </>
);

// ---------------------------------------------------------------------------
// Edit or cancel an invoice
// ---------------------------------------------------------------------------
export const EditCancelGuide: React.FC = () => (
  <>
    <p>
      Made a mistake on a saved invoice? <strong>Edit</strong> it. The customer backed out? <strong>Cancel</strong> it. Both keep the invoice number, so your invoice series has
      no gaps (important for GST).
    </p>

    <Step n={1} title="Edit a saved invoice">
      <p>
        Open the invoice and click <strong>Edit</strong>, or click <strong>⋯</strong> on its row in <Path items={['Sales Invoices']} /> → <strong>Edit</strong>. The same editor opens with
        everything filled in.
      </p>
      <Screen title="Edit Sales Invoice">
        <div className="flex items-center justify-between gap-3 min-w-[480px]">
          <span className="font-bold text-slate-800">
            Edit Sales Invoice <span className="font-mono text-slate-400">INV-0049</span> <Mark n={1} />
          </span>
          <MockBtn icon="fa-solid fa-floppy-disk" mark={2}>
            Update Sales Invoice
          </MockBtn>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 min-w-[480px]">
          <MockField label="Invoice Number" value="49" mark={3} />
          <Panel title="Payment">
            <div className="flex justify-between font-semibold">
              <span>Total Amount Received</span>
              <span>₹100.00</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Payments are added or removed from the invoice view. <Mark n={4} />
            </div>
          </Panel>
        </div>
      </Screen>
      <Legend
        items={[
          [1, <>The invoice keeps its number and date unless you change the date.</>],
          [2, <>Change the party, items, prices, GST, charges or terms, then click <strong>Update Sales Invoice</strong>.</>],
          [3, <>The number of a saved invoice can&apos;t change.</>],
          [4, <>Payments you already recorded stay on the invoice. The balance is worked out again from the new total.</>],
        ]}
      />
      <Callout type="note">If you track stock, editing moves only the difference: changing 4 bottles to 10 takes 6 more out of stock.</Callout>
    </Step>

    <Step n={2} title="Cancel an invoice">
      <p>
        Click <strong>⋯</strong> on the row → <strong>Cancel invoice</strong> and confirm. The invoice stays in your list, marked <strong>Cancelled</strong>, and its PDF shows a red
        CANCELLED stamp.
      </p>
      <Screen title="Sales Invoices">
        <MockTable
          minW={480}
          cols={['Invoice', 'Customer', 'Status', 'Amount']}
          align={['l', 'l', 'l', 'r']}
          rows={[
            [
              'INV-0049',
              'Ramesh Traders',
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                <FaIcon icon="fa-solid fa-ban" size={8} /> Cancelled
              </span>,
              <span className="line-through text-slate-400">₹3,422.00</span>,
            ],
          ]}
        />
      </Screen>
      <p>A cancelled invoice:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>no longer counts in sales totals, the dashboard, customer balances or the party statement;</li>
        <li>puts its items back into stock (if you track stock);</li>
        <li>can&apos;t be edited or paid. Use <strong>⋯ → Restore invoice</strong> to bring it back.</li>
      </ul>
      <Callout type="tip">
        Use the <strong>Cancelled</strong> tab above the list to see only cancelled invoices.
      </Callout>
    </Step>

    <Step n={3} title="Cancel or delete?">
      <p>
        <strong>Cancel</strong> keeps a record and the number. <strong>Delete</strong> (<strong>⋯ → Delete</strong>) removes the invoice for good and leaves a gap in your numbers. Prefer
        cancelling for invoices you already sent to a customer.
      </p>
      <Callout type="warning">Deleting can&apos;t be undone.</Callout>
    </Step>
  </>
);

// ---------------------------------------------------------------------------
// Quotations
// ---------------------------------------------------------------------------
export const QuotationsGuide: React.FC = () => (
  <>
    <p>
      A <strong>quotation</strong> (estimate) tells a customer the price before they buy. When they agree, turn it into an invoice with one click, with no retyping.
    </p>

    <Step n={1} title="Create a quotation">
      <p>
        Go to <Path items={['Sidebar', 'Quotations', 'Create Quotation']} /> (or <Path items={['Top bar', 'New Invoice ▾', 'New Quotation']} />). It&apos;s the same editor as an
        invoice, with a few differences:
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          Numbers have their own series: <code>QT-0001</code>, <code>QT-0002</code>…
        </li>
        <li>
          <strong>Valid Till</strong> replaces the due date.
        </li>
        <li>There is no payment section and no payment QR.</li>
        <li>Quotations never change your stock.</li>
      </ul>
    </Step>

    <Step n={2} title="Share it">
      <p>
        After saving, the quotation opens. Download the <strong>PDF</strong> (titled QUOTATION) or use the WhatsApp button on its row to send it.
      </p>
    </Step>

    <Step n={3} title="Convert to an invoice">
      <Screen title="Quotations">
        <MockTable
          minW={520}
          cols={['Quotation', 'Customer', 'Valid Till', 'Status', 'Amount', '']}
          align={['l', 'l', 'l', 'l', 'r', 'r']}
          rows={[
            [
              'QT-0002',
              'Ramesh Traders',
              '06 Oct 2026',
              <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700">Open</span>,
              '₹823.64',
              <span className="inline-flex items-center gap-1 text-slate-500">
                <FaIcon icon="fa-solid fa-file-invoice" size={11} /> <Mark n={1} />
              </span>,
            ],
            [
              'QT-0001',
              'Sita Stores',
              '01 Oct 2026',
              <span className="inline-flex items-center gap-1">
                <span className="rounded-md bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">Converted · INV-0048</span> <Mark n={2} />
              </span>,
              '₹708.00',
              '',
            ],
          ]}
        />
      </Screen>
      <Legend
        items={[
          [1, <><strong>Convert to Invoice</strong> opens a new invoice with the party and items filled in, today&apos;s date and your next invoice number. Check it and save.</>],
          [2, <>The quotation is then marked <strong>Converted</strong> with the invoice number, and can&apos;t be converted again.</>],
        ]}
      />
      <Callout type="note">
        Quotations past their <em>Valid Till</em> date show <strong>Expired</strong>, but you can still edit or convert them.
      </Callout>
    </Step>
  </>
);
