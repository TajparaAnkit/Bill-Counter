import React from 'react';
import { FaIcon } from '../../shared/FaIcon';
import { AgingBar, RankBars, SalesChart, Sparkline } from '../../Dashboard/Charts';
import { AgingBucket, SeriesBucket } from '../../../utils/dashboard';
import { Callout, Legend, Mark, MockBtn, Screen, Step } from '../kit';

// The screen examples below use the dashboard's real chart components with
// sample data, so they look exactly like the live page.
const SAMPLE_SERIES: SeriesBucket[] = [
  [2200, 1500],
  [0, 0],
  [6100, 0],
  [8200, 8200],
  [0, 400],
  [0, 2500],
  [2500, 0],
  [10400, 1200],
  [1700, 1700],
  [0, 0],
  [10000, 2500],
  [0, 600],
  [700, 700],
  [2100, 1400],
].map(([s, r], i) => ({ key: String(i), label: String(i * 2 + 1), fullLabel: `${i * 2 + 1} Sept 2026`, sales: s, received: r }));

const SAMPLE_AGING: AgingBucket[] = [
  { key: 'not_due', label: 'Not yet due', amount: 31891, count: 8 },
  { key: 'd30', label: '1–30 days overdue', amount: 8553, count: 10 },
  { key: 'd60', label: '31–60 days overdue', amount: 14504, count: 14 },
  { key: 'd60p', label: '60+ days overdue', amount: 14580, count: 8 },
];

const Tile: React.FC<{ label: string; value: string; foot: React.ReactNode; mark: number; children?: React.ReactNode }> = ({ label, value, foot, mark, children }) => (
  <div className="relative rounded-xl bg-white/10 ring-1 ring-inset ring-white/15 p-3 flex flex-col text-white">
    <Mark n={mark} className="absolute -top-2 -right-2" />
    <div className="text-[11px] font-medium text-white/80">{label}</div>
    <div className="text-lg font-bold">{value}</div>
    <div className="text-[10px] mt-0.5">{foot}</div>
    {children}
  </div>
);

const Hero: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`rounded-2xl bg-linear-to-br from-brand-600 via-brand-500 to-blue-600 p-4 text-white ${className}`}>{children}</div>
);

export const DashboardGuide: React.FC = () => (
  <>
    <p>
      The Dashboard is the first page after you log in. It answers three questions: <em>How much did I sell?</em> <em>How much money came in?</em> <em>Who still owes me?</em>
    </p>

    <Step n={1} title="Choose the period">
      <Screen title="Dashboard → header">
        <Hero className="min-w-[560px]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-base font-bold">Good afternoon, Dwarkadhish Marketing</div>
              <div className="text-[10px] text-white/80">Here&apos;s how your business is doing · Showing 01 Sept 2026 – 28 Sept 2026</div>
            </div>
            <span className="flex items-center gap-1.5">
              {['Sales Invoice', 'Customer', 'Product'].map((l, i) => (
                <span key={l} className="inline-flex items-center gap-1">
                  <span className="rounded-lg bg-white/15 ring-1 ring-inset ring-white/20 px-2 py-1 text-[10px] font-semibold">+ {l}</span>
                  {i === 2 && <Mark n={1} />}
                </span>
              ))}
              <span className="rounded-lg bg-white px-2 py-1 text-[10px] text-slate-700">This Month ▾</span>
              <Mark n={2} />
            </span>
          </div>
        </Hero>
      </Screen>
      <Legend
        items={[
          [1, <>Quick buttons to create an invoice, customer or product.</>],
          [2, <>The period for every tile and chart: <em>Today</em>, <em>This Week</em>, <em>This Month</em>, <em>Previous Month</em>, <em>Current Fiscal Year</em> (from 1 April) or <em>Custom Date Range</em>.</>],
        ]}
      />
    </Step>

    <Step n={2} title="Read the four key numbers">
      <Screen title="Dashboard → banner tiles">
        <Hero className="min-w-[620px]">
        <div className="grid grid-cols-4 gap-3 pt-2">
          <Tile label="Sales" value="₹55,916" mark={1} foot={<span><span className="text-emerald-200 font-semibold">+20%</span> <span className="text-white/60">vs previous 28 days</span></span>}>
            <div className="mt-1">
              <Sparkline values={[2, 0, 6, 8, 0, 0, 2.5, 10, 1.7, 0, 10, 0, 0.7, 12]} color="#ffffff" />
            </div>
          </Tile>
          <Tile label="Payments received" value="₹20,063" mark={2} foot={<span><span className="text-rose-200 font-semibold">−39%</span> <span className="text-white/60">vs previous 28 days</span></span>}>
            <div className="mt-1">
              <Sparkline values={[1.5, 0, 0, 8, 0.4, 2.5, 0, 1.2, 1.7, 0, 2.5, 0.6, 0.7, 1.4]} color="#ffffff" />
            </div>
          </Tile>
          <Tile label="To collect" value="₹69,528" mark={3} foot={<span className="text-rose-100 font-semibold">● 32 overdue · ₹37,637</span>}>
            <div className="mt-auto pt-2">
              <div className="h-1.5 rounded-full bg-white/20">
                <div className="h-1.5 rounded-full bg-white" style={{ width: '54%' }} />
              </div>
              <div className="text-[9px] text-white/65 mt-0.5">54% of dues are past their due date</div>
            </div>
          </Tile>
          <Tile label="Invoices" value="19" mark={4} foot={<span className="text-white/70">11 not fully paid</span>}>
            <div className="mt-auto pt-2">
              <div className="h-1.5 rounded-full bg-white/20">
                <div className="h-1.5 rounded-full bg-white" style={{ width: '42%' }} />
              </div>
              <div className="text-[9px] text-white/65 mt-0.5">8 of 19 fully paid</div>
            </div>
          </Tile>
        </div>
        </Hero>
      </Screen>
      <Legend
        items={[
          [1, <><strong>Sales</strong>: total of invoices dated in the period. The arrow compares it with the same number of days just before.</>],
          [2, <><strong>Payments received</strong>: money received in the period, on the date each payment was recorded.</>],
          [3, <><strong>To collect</strong>: everything customers owe you <em>right now</em> (all dates), and how much of it is overdue. Click it to see the unpaid invoices.</>],
          [4, <><strong>Invoices</strong>: how many you made in the period and how many are fully paid.</>],
        ]}
      />
    </Step>

    <Step n={3} title="Sales vs payments received">
      <Screen title="Dashboard → main chart">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3 min-w-[520px]">
          <SalesChart data={SAMPLE_SERIES} />
        </div>
      </Screen>
      <p>
        Purple columns are <strong>sales</strong>, green columns are <strong>money received</strong>. A tall purple column next to a short green one means that day&apos;s sales haven&apos;t been paid yet.{' '}
        <strong>Hover</strong> (or tap) a column for exact amounts, or click <strong>View as table</strong>. Longer periods show one pair of columns per month. <em>Try hovering the chart above.</em>
      </p>
    </Step>

    <Step n={4} title="Dues, payment modes and GST">
      <Screen title="Dashboard → Outstanding by age">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3 min-w-[420px]">
          <div className="font-bold text-slate-800 mb-3">Outstanding by age</div>
          <AgingBar data={SAMPLE_AGING} />
        </div>
      </Screen>
      <ul>
        <li>
          <strong>Outstanding by age</strong> splits what you&apos;re owed by how late it is. Grey is not due yet; yellow, orange and red are more and more overdue. The red part is the hardest to
          collect, so follow it up first.
        </li>
        <li>
          <strong>How customers pay</strong> shows the split between Cash, UPI, Card, Bank and Other.
        </li>
        <li>
          <strong>GST summary</strong> (when GST is on) shows taxable amount, CGST, SGST and IGST for the period, which is handy at return-filing time.
        </li>
      </ul>
    </Step>

    <Step n={5} title="Top customers and products">
      <Screen title="Dashboard → Top customers">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3 min-w-[380px]">
          <RankBars
            avatar
            rows={[
              { key: 'a', label: 'Patel Hardware', value: 21057, sub: '₹24,271 outstanding' },
              { key: 'b', label: 'Shree Krishna Mart', value: 18888, sub: '₹13,889 outstanding' },
              { key: 'c', label: 'Ramesh Traders', value: 6768, sub: 'No dues' },
            ]}
          />
        </div>
      </Screen>
      <p>
        Your best customers and best-selling products for the period. Switch <strong>Top products</strong> between <em>Amount</em> and <em>Quantity</em>. With Party Statement turned on, click a
        customer to open their statement.
      </p>
    </Step>

    <Step n={6} title="Chase overdue invoices">
      <Screen title="Dashboard → Overdue invoices">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3 min-w-[420px] space-y-2">
          {[
            ['Shree Krishna Mart', 'INV-0042', 77, '₹130'],
            ['Om Electricals', 'INV-0048', 45, '₹956'],
          ].map(([n, b, d, a], i) => (
            <div key={b as string} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="font-semibold text-slate-800">{n}</div>
                <div className="text-[10px] text-slate-400">
                  {b} · <span className="text-rose-600 font-semibold">{d} days overdue</span>
                </div>
              </div>
              <span className="font-bold">{a}</span>
              <MockBtn variant="whatsapp" icon="fa-brands fa-whatsapp" mark={i === 0 ? 1 : undefined}>
                Remind
              </MockBtn>
            </div>
          ))}
        </div>
      </Screen>
      <Legend
        items={[
          [
            1,
            <>
              <strong>Remind</strong> opens WhatsApp with a polite message already typed: amount pending, invoice number, invoice and due dates, and your UPI ID. Just press send.
            </>,
          ],
        ]}
      />
      <p>
        <strong>Recent activity</strong> lists the latest invoices and payments. Click any row to open the invoice (for example to record a payment).
      </p>
      <Callout type="tip">
        <FaIcon icon="fa-solid fa-calendar-day" size={11} /> Dates follow the <strong>invoice date</strong> you chose, not the day you typed the invoice in. Backdated invoices show on the right day.
      </Callout>
    </Step>
  </>
);
