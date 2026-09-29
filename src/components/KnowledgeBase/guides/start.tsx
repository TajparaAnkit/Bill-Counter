import React from 'react';
import { FaIcon } from '../../shared/FaIcon';
import { Callout, Legend, Mark, MockBtn, MockField, Path, Screen, Step } from '../kit';
import { BRAND_NAME } from '../../../config/brand';

export const AccountGuide: React.FC = () => (
  <>
    <p>You sign up with your email address and a password. Each account is one business workspace with its own invoices, customers and products.</p>

    <Step n={1} title="Create your account">
      <ol>
        <li>Open the app and click <strong>Create an account</strong> under the login form.</li>
        <li>
          Fill in <strong>Business / Brand name</strong>, <strong>Email address</strong>, <strong>Password</strong> and <strong>Confirm password</strong>.
        </li>
        <li>
          Click <strong>Create account</strong>. You go straight to the Dashboard.
        </li>
      </ol>
      <Screen title="Create your account">
        <div className="mx-auto max-w-xs bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-2.5">
          <div className="text-sm font-bold text-slate-800">Create your account</div>
          <div className="text-[10px] text-slate-500 -mt-2">Set up your business workspace in a minute.</div>
          <MockField label="Business / Brand name" value="Dwarkadhish Marketing" mark={1} />
          <MockField label="Email address" value="owner@business.com" />
          <MockField label="Password" placeholder="Min 6 chars, 1 uppercase, 1 number" mark={2} suffix="👁" />
          <MockField label="Confirm password" placeholder="Re-enter password" />
          <div className="flex justify-center">
            <MockBtn>Create account</MockBtn>
          </div>
        </div>
      </Screen>
      <Legend
        items={[
          [1, <>Your business name is printed on invoices. You can change it later in Settings.</>],
          [2, <>The password needs at least <strong>6 characters</strong>, one <strong>capital letter</strong> and one <strong>number</strong>, e.g. <code>Shop2026</code>. Click 👁 to see what you typed.</>],
        ]}
      />
    </Step>

    <Step n={2} title="Log in next time">
      <Screen title="Welcome back">
        <div className="mx-auto max-w-xs bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-2.5">
          <div className="text-sm font-bold text-slate-800">Welcome back</div>
          <MockField label="Email address" value="owner@business.com" />
          <div>
            <div className="flex items-center justify-between mb-1 text-[11px] font-semibold text-slate-600">
              Password
              <span className="flex items-center gap-1 text-brand-700">
                Forgot password? <Mark n={1} />
              </span>
            </div>
            <MockField value="••••••••" suffix="👁" />
          </div>
          <div className="flex justify-center">
            <MockBtn>Log in</MockBtn>
          </div>
          <div className="text-center text-[10px] text-slate-500">
            Not registered? <span className="text-brand-700 font-semibold">Create an account</span>
          </div>
        </div>
      </Screen>
      <Legend
        items={[
          [
            1,
            <>
              <strong>Forgot password?</strong> Type your email in the box first, then click this link. You&apos;ll get an email with a link to set a new password. Check your spam folder if it doesn&apos;t arrive.
            </>,
          ],
        ]}
      />
      <Callout type="note">Log in with the <strong>email and password</strong> you signed up with.</Callout>
    </Step>

    <Step n={3} title="Add your business details">
      <p>
        Before your first invoice, open <Path items={['Sidebar', 'Settings']} /> and add your address, phone, GSTIN, logo and signature. They appear on every invoice.
        See <em>Business details, logo &amp; signature</em>.
      </p>
    </Step>

    <Step n={4} title="Log out">
      <p>
        Click the ⇥ <strong>logout</strong> icon next to your business name at the bottom of the sidebar. On a phone, open the menu (☰) first. Always log out on a shared computer.
      </p>
    </Step>
  </>
);

export const AppTourGuide: React.FC = () => (
  <>
    <p>
      The <strong>sidebar</strong> on the left takes you to each page, and the <strong>top bar</strong> has search and the <strong>New Invoice</strong> button. On a phone, tap ☰ at the
      top-left to open the sidebar.
    </p>

    <Step n={1} title="The top bar">
      <Screen title="Top bar">
        <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-3 py-2 min-w-[560px]">
          <div className="flex-1 flex items-center gap-2">
            <span className="flex-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-400">
              <FaIcon icon="fa-solid fa-magnifying-glass" size={10} /> Search invoices, customers, pages…
              <span className="ml-auto rounded border border-slate-200 bg-white px-1 text-[9px] font-semibold">Ctrl K</span>
            </span>
            <Mark n={1} />
          </div>
          <span className="flex items-center gap-1.5">
            <span className="flex rounded-xl overflow-hidden bg-brand-600 text-white font-semibold">
              <span className="px-2.5 py-1.5">+ New Invoice</span>
              <span className="px-2 py-1.5 border-l border-white/20">
                <FaIcon icon="fa-solid fa-chevron-down" size={9} />
              </span>
            </span>
            <Mark n={2} />
          </span>
          <span className="flex items-center gap-1.5">
            <FaIcon icon="fa-regular fa-circle-question" size={14} className="text-slate-500" />
            <Mark n={3} />
          </span>
          <span className="grid h-7 w-7 place-items-center rounded-full bg-linear-to-br from-brand-500 to-blue-600 text-[10px] font-bold text-white">DO</span>
        </div>
      </Screen>
      <Legend
        items={[
          [1, <><strong>Search</strong>: type a name, invoice number or GSTIN, then pick <em>Invoices / Customers / Products matching…</em>, or jump to any page. Press <strong>Ctrl + K</strong> (⌘K on Mac) from anywhere to start typing.</>],
          [2, <><strong>New Invoice</strong> starts a sales invoice from any page. The small arrow opens <em>Add Customer</em> and <em>Add Product</em>.</>],
          [3, <>Opens this Help Center.</>],
        ]}
      />
    </Step>

    <Step n={2} title="The sidebar">
      <Screen title="Sidebar">
        <div className="flex gap-3 min-w-[460px]">
          <div className="w-52 shrink-0 bg-[#fbfbff] border border-slate-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-200">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-linear-to-br from-brand-500 to-blue-600 text-white">
                <FaIcon icon="fa-solid fa-receipt" size={11} />
              </span>
              <span className="font-bold text-brand-700">{BRAND_NAME}</span>
            </div>
            <div className="p-2 space-y-2">
              {[
                ['Overview', [['fa-solid fa-table-cells-large', 'Dashboard', true]]],
                ['Sales', [['fa-regular fa-file-lines', 'Sales Invoices', false], ['fa-solid fa-user-group', 'Customers', false], ['fa-solid fa-cube', 'Products', false]]],
                ['Business', [['fa-solid fa-gear', 'Settings', false], ['fa-regular fa-circle-question', 'Help Center', false]]],
              ].map(([g, items], gi) => (
                <div key={g as string}>
                  <div className="flex items-center gap-1 px-2 pb-1 text-[9px] font-semibold uppercase tracking-widest text-slate-400">
                    {g as string} {gi === 1 && <Mark n={1} />}
                  </div>
                  {(items as [string, string, boolean][]).map(([i, l, on]) => (
                    <div key={l} className={`relative flex items-center gap-2 px-2 py-1.5 rounded-lg ${on ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-slate-600'}`}>
                      {on && <span className="absolute -left-2 top-1 bottom-1 w-[3px] rounded-full bg-brand-600" />}
                      <FaIcon icon={i} size={11} className={on ? 'text-brand-600' : 'text-slate-400'} /> {l}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 border-t border-slate-200 px-3 py-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-linear-to-br from-brand-500 to-blue-600 text-[10px] font-bold text-white">D</span>
              <span className="flex-1 min-w-0 truncate font-semibold text-slate-800">Dwarkadhish…</span>
              <FaIcon icon="fa-solid fa-arrow-right-from-bracket" size={11} className="text-slate-400" />
              <Mark n={2} />
            </div>
          </div>
          <div className="flex-1 relative bg-white rounded-xl border border-dashed border-slate-300 grid place-items-center text-slate-400">
            <span className="absolute -left-2.5 top-8 flex items-center gap-1">
              <span className="grid h-5 w-5 place-items-center rounded-full border border-slate-200 bg-white text-slate-500">
                <FaIcon icon="fa-solid fa-chevron-left" size={7} />
              </span>
              <Mark n={3} />
            </span>
            Page content
          </div>
        </div>
      </Screen>
      <Legend
        items={[
          [1, <>Pages are grouped under <strong>Overview</strong>, <strong>Sales</strong> and <strong>Business</strong>. The page you&apos;re on is highlighted in violet. Click a group title to fold it away.</>],
          [2, <>Your business name and logo (from Settings). The ⇥ icon next to it <strong>logs you out</strong>.</>],
          [3, <>The small arrow <strong>shrinks the sidebar to icons</strong> for more room; click it again to expand. The app remembers your choice.</>],
        ]}
      />
    </Step>

    <Step n={3} title="Where each thing lives">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-3">
        {[
          ['fa-solid fa-table-cells-large', 'Dashboard', 'Sales, payments, dues and top sellers'],
          ['fa-regular fa-file-lines', 'Sales Invoices', 'Invoices list, filters and payments'],
          ['fa-solid fa-user-group', 'Customers', 'Customers & suppliers, balances, statements'],
          ['fa-solid fa-cube', 'Products', 'Products, import, catalog, promote'],
          ['fa-solid fa-gear', 'Settings', 'Business details, GST, bank, features'],
          ['fa-regular fa-circle-question', 'Help Center', 'These help guides'],
        ].map(([i, t, d]) => (
          <div key={t} className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2">
            <FaIcon icon={i} size={13} className="text-brand-600 mt-0.5" />
            <div>
              <div className="font-semibold text-slate-800 text-[13px]">{t}</div>
              <div className="text-xs text-slate-500">{d}</div>
            </div>
          </div>
        ))}
      </div>
    </Step>

    <Step n={4} title="Messages and confirmations">
      <ul>
        <li>Small messages at the <strong>top-right</strong> confirm actions (green), or explain a problem (red). They close by themselves after a few seconds.</li>
        <li>Anything that deletes data asks first in a <strong>confirmation box</strong>. Click <em>Cancel</em> or press <kbd>Esc</kbd> to back out.</li>
      </ul>
      <Callout type="note">If a page ever shows <strong>“Oops! Something went wrong”</strong>, click <strong>Reload Page</strong>. Your saved data is safe.</Callout>
    </Step>
  </>
);
