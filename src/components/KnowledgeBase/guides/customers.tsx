import React from 'react';
import { FaIcon } from '../../shared/FaIcon';
import { Callout, Legend, Mark, MockBtn, MockCheck, MockField, MockTable, Panel, Path, Screen, Step } from '../kit';

export const CustomersGuide: React.FC = () => (
  <>
    <p>
      Save the people you sell to (and buy from) once, and pick them on invoices in one click. Go to <Path items={['Sidebar', 'Customers']} />.
    </p>

    <Step n={1} title="Add a customer">
      <p>
        Click <strong>Add Customer</strong>. A full-page form opens with two sections.
      </p>
      <Screen title="Create Customer">
        <div className="space-y-3 min-w-[540px]">
          <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 shadow-xs px-3 py-2">
            <span className="flex items-center gap-2 font-bold text-slate-800">
              <FaIcon icon="fa-solid fa-arrow-left" size={11} /> Create Customer
            </span>
            <span className="flex items-center gap-2">
              <MockBtn variant="secondary" mark={6}>
                Save &amp; New
              </MockBtn>
              <MockBtn>Save</MockBtn>
            </span>
          </div>
          <Panel title="General Details">
            <div className="grid grid-cols-3 gap-2">
              <MockField label="Customer Name" required value="Ramesh Traders" />
              <MockField label="Mobile Number" value="98250 12345" mark={1} />
              <MockField label="Email" placeholder="Enter email" />
              <div>
                <div className="flex items-center gap-1.5 mb-1 text-[11px] font-semibold text-slate-600">
                  Opening Balance <Mark n={2} />
                </div>
                <div className="flex">
                  <MockField value="5,000" prefix="₹" className="flex-1" />
                  <MockField value="To Collect" select className="w-28" />
                </div>
              </div>
              <MockField label="GSTIN" value="24AAYFG2879D1ZZ" mark={3} />
              <MockField label="PAN Number" value="AAYFG2879D" />
              <MockField label="Customer Type" required value="Customer" select mark={4} />
              <MockField label="Category" value="Wholesale" select />
            </div>
          </Panel>
          <Panel title="Address">
            <div className="grid grid-cols-2 gap-2">
              <MockField label="Billing Address" value="12, Station Road, Rajkot" tall />
              <div>
                <div className="flex items-center justify-between mb-1 text-[11px] font-semibold text-slate-600">
                  Shipping Address <MockCheck on label={<span className="font-normal">Same as Billing address</span>} />
                </div>
                <MockField value="12, Station Road, Rajkot" tall />
              </div>
              <MockField label="Credit Period" value="30" suffix="Days" mark={5} />
              <MockField label="Credit Limit" value="50,000" prefix="₹" />
            </div>
          </Panel>
        </div>
      </Screen>
      <Legend
        items={[
          [1, <>Save the <strong>mobile number</strong> so invoices, statements and reminders open the right WhatsApp chat.</>],
          [2, <><strong>Opening Balance</strong>: money already owed before you started using the app. <em>To Collect</em> = the customer owes you; <em>To Pay</em> = you owe them.</>],
          [3, <>Type a valid <strong>GSTIN</strong> and the PAN fills itself in. The GSTIN also sets the right Place of Supply on invoices.</>],
          [4, <><strong>Customer</strong> or <strong>Supplier</strong>. Only customers are offered when you create a sales invoice. <strong>Category</strong> (Retail, Wholesale, Dealer…) is for your own grouping.</>],
          [5, <><strong>Credit Period</strong> becomes the default payment terms (and due date) on this customer&apos;s invoices. <strong>Credit Limit</strong> is shown on their statement page.</>],
          [6, <><strong>Save &amp; New</strong> saves and clears the form for the next customer. <strong>Save</strong> saves and goes back to the list.</>],
        ]}
      />
    </Step>

    <Step n={2} title="Find, edit or delete a customer">
      <Screen title="Customers">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden min-w-[600px]">
          <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
            <span className="flex items-center gap-2 font-bold text-slate-900">
              All parties <span className="bg-slate-100 text-slate-500 px-1.5 rounded-full text-[10px]">24</span>
            </span>
            <span className="flex items-center gap-2">
              <MockField placeholder="Search customers…" className="w-40" mark={1} />
              <span className="inline-flex rounded-lg bg-slate-100 p-0.5 text-[10px] font-semibold">
                <span className="rounded-md bg-white px-2 py-0.5 shadow-xs">All 24</span>
                <span className="px-2 py-0.5 text-slate-500">Customers 20</span>
                <span className="px-2 py-0.5 text-slate-500">Suppliers 4</span>
              </span>
              <Mark n={2} />
            </span>
          </div>
          <MockTable
            minW={600}
            cols={['Name', 'Type', 'Phone', 'GSTIN', <span className="inline-flex items-center gap-1">Balance <Mark n={3} /></span>, '']}
            align={['l', 'l', 'l', 'l', 'r', 'r']}
            rows={[
              [
                <span className="flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-50 text-brand-700 text-[9px] font-semibold">RT</span>
                  <span className="font-semibold text-slate-900">Ramesh Traders</span>
                </span>,
                <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700 ring-1 ring-inset ring-brand-100">Customer</span>,
                '98250 12345',
                <span className="font-mono text-[10px]">24AAYFG2879D1ZZ</span>,
                <span>
                  <span className="block font-semibold text-slate-900">₹22,823.00</span>
                  <span className="block text-[10px] text-slate-400">To collect</span>
                </span>,
                <span className="flex justify-end items-center gap-2 text-slate-400">
                  <FaIcon icon="fa-regular fa-file-lines" size={11} />
                  <FaIcon icon="fa-regular fa-pen-to-square" size={11} />
                  <FaIcon icon="fa-regular fa-trash-can" size={11} />
                  <Mark n={4} />
                </span>,
              ],
              [
                <span className="flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-amber-50 text-amber-700 text-[9px] font-semibold">OT</span>
                  <span className="font-semibold text-slate-900">Om Traders</span>
                </span>,
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">Supplier</span>,
                '97270 00111',
                '—',
                <span>
                  <span className="block font-semibold text-rose-600">₹4,000.00</span>
                  <span className="block text-[10px] text-slate-400">To pay</span>
                </span>,
                <span className="flex justify-end gap-2 text-slate-400">
                  <FaIcon icon="fa-regular fa-file-lines" size={11} />
                  <FaIcon icon="fa-regular fa-pen-to-square" size={11} />
                  <FaIcon icon="fa-regular fa-trash-can" size={11} />
                </span>,
              ],
            ]}
          />
        </div>
      </Screen>
      <Legend
        items={[
          [1, <>Search by name, phone, email or GSTIN.</>],
          [2, <>Show <strong>All</strong>, only <strong>Customers</strong> or only <strong>Suppliers</strong>.</>],
          [3, <><strong>Balance</strong>: opening balance + invoices − payments. <em>To collect</em> means they owe you; red <em>To pay</em> means you owe them. Click the heading to sort by it.</>],
          [4, <>Icons: <strong>statement</strong> (only when Party Statement is on), <strong>edit</strong> and <strong>delete</strong> (asks to confirm).</>],
        ]}
      />
      <Callout type="note">
        Invoices keep a copy of the customer&apos;s details from the day they were made. Editing or deleting a customer later doesn&apos;t change old invoices.
      </Callout>
    </Step>

    <Step n={3} title="Use the customer on an invoice">
      <p>
        In the invoice editor click <strong>Select Party</strong> and search. Everything saved here fills in automatically. Want a customer-wise statement? Turn on{' '}
        <Path items={['Settings', 'Features', 'Party Statement (Ledger)']} /> and see <em>Party statement (ledger)</em>.
      </p>
    </Step>
  </>
);
