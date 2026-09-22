import React, { useState } from 'react';
import { Select, MultiSelect, Combobox } from '../components/ui/Select';
import { INDIAN_STATES, UNITS, GST_RATES } from '../utils/tax';
import { BUSINESS_TYPES, INDUSTRY_TYPES } from '../config/business';

// Dev-only harness for the shared dropdown components. Mounted at /#/__ui-test
// in `vite dev` only (see App.tsx). No Firebase calls — safe for Playwright.

const PRODUCTS = [
  { name: 'Kitty rakhi', price: 80 },
  { name: 'Swastik border', price: 70 },
  { name: 'Rudraksha Rakhi', price: 60 },
  { name: 'Morpankh rakhi', price: 90 },
  { name: 'Flower hairclip', price: 60 },
  { name: 'EPOXY NORMAL 5 KG', price: 1059.32 },
];

export const UiTestPage: React.FC = () => {
  const [state, setState] = useState('');
  const [unit, setUnit] = useState('PCS');
  const [tax, setTax] = useState('18');
  const [types, setTypes] = useState<string[]>([]);
  const [industry, setIndustry] = useState('');
  const [item, setItem] = useState('');
  const [picked, setPicked] = useState('');
  const [bottom, setBottom] = useState('');

  return (
    <div className="min-h-screen bg-[#f5f6fa] p-6 space-y-8 text-sm" data-testid="ui-test">
      <h1 className="text-xl font-bold">UI harness</h1>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        <div>
          <label className="block mb-1 font-semibold">State (searchable, clearable)</label>
          <Select aria-label="State" searchable clearable placeholder="Select state" options={INDIAN_STATES.map((s) => s.name)} value={state} onChange={setState} />
          <p data-testid="state-value">{state}</p>
        </div>

        <div>
          <label className="block mb-1 font-semibold">Tax rate (field, few options)</label>
          <Select aria-label="Tax rate" options={GST_RATES.map((r) => ({ value: String(r), label: `${r}%` }))} value={tax} onChange={setTax} />
          <p data-testid="tax-value">{tax}</p>
        </div>

        <div>
          <label className="block mb-1 font-semibold">Business type (multi)</label>
          <MultiSelect aria-label="Business type" options={BUSINESS_TYPES} value={types} onChange={setTypes} placeholder="Select business type" />
          <p data-testid="types-value">{types.join('|')}</p>
        </div>

        <div>
          <label className="block mb-1 font-semibold">Industry (searchable)</label>
          <Select aria-label="Industry type" searchable clearable options={INDUSTRY_TYPES} value={industry} onChange={setIndustry} placeholder="Search industry" />
          <p data-testid="industry-value">{industry}</p>
        </div>

        <div>
          <label className="block mb-1 font-semibold">Embedded unit inside an overflow-hidden input group</label>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white w-48" data-testid="qty-group">
            <input aria-label="Quantity" type="number" defaultValue={1} className="flex-1 min-w-0 px-2.5 py-2 text-sm focus:outline-none" />
            <Select variant="embedded" size="sm" align="end" aria-label="Unit" options={UNITS} value={unit} onChange={setUnit} className="border-l border-slate-200" />
          </div>
          <p data-testid="unit-value">{unit}</p>
        </div>

        <div>
          <label className="block mb-1 font-semibold">Item name (combobox, free text + suggestions)</label>
          <Combobox
            aria-label="Item name"
            options={PRODUCTS.map((p) => ({ value: p.name, label: p.name, hint: `₹${p.price.toFixed(2)}` }))}
            value={item}
            onChange={(v, opt) => {
              setItem(v);
              setPicked(opt ? `${opt.value}:${opt.hint}` : '');
            }}
            placeholder="Enter item name or select product"
            className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
          />
          <p data-testid="item-value">{item}</p>
          <p data-testid="item-picked">{picked}</p>
        </div>

        <div>
          <label className="block mb-1 font-semibold">Disabled</label>
          <Select aria-label="Disabled select" disabled options={['A', 'B']} value="A" onChange={() => {}} />
        </div>
      </section>

      {/* Table cell case: overflow-x-auto wrapper */}
      <section className="max-w-4xl">
        <div className="overflow-x-auto border border-slate-200 rounded-lg" data-testid="table-wrap">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-xs">
                <th className="p-2">Item</th>
                <th className="p-2 w-36">Tax</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2">Row item</td>
                <td className="p-2">
                  <Select aria-label="Row tax" align="end" options={GST_RATES.map((r) => ({ value: String(r), label: `${r}%` }))} value={tax} onChange={setTax} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Bottom-of-viewport case: should open upward */}
      <div style={{ height: '70vh' }} />
      <section className="max-w-xs">
        <label className="block mb-1 font-semibold">Near bottom (should flip up)</label>
        <Select aria-label="Bottom select" options={INDIAN_STATES.map((s) => s.name)} value={bottom} onChange={setBottom} placeholder="Pick" />
      </section>
    </div>
  );
};
