// Shared by the guide and marketing image scripts: demo server, brand, fonts and
// screenshot recipes (real app pages in demo mode, with optional highlights).

import { spawn, execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const PORT = 5197;
export const BASE = `http://localhost:${PORT}/Bill-Counter/`;


// ---------------------------------------------------------------------------
// Brand (read from the app config so the images follow any rename)
// ---------------------------------------------------------------------------
const brandSrc = readFileSync(join(ROOT, 'src/config/brand.ts'), 'utf8');
const constOf = (name) => (brandSrc.match(new RegExp(`${name}\\s*=\\s*'([^']*)'`)) || [])[1] || '';
export const BRAND = constOf('BRAND_NAME') || 'myBillCounter';
export const SUPPORT = [constOf('SUPPORT_PHONE'), constOf('SUPPORT_EMAIL')].filter(Boolean).join('  ·  ');

export const inter = readFileSync(join(ROOT, 'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2')).toString('base64');

// ---------------------------------------------------------------------------
// Demo server
// ---------------------------------------------------------------------------
const up = async () => {
  try {
    return (await fetch(BASE)).ok;
  } catch {
    return false;
  }
};

export const startServer = async () => {
  if (await up()) return null;
  const child = spawn(`npx vite --mode demo --port ${PORT} --strictPort --open false`, { cwd: ROOT, shell: true, stdio: 'ignore' });
  for (let i = 0; i < 90; i++) {
    if (await up()) return child;
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('Demo server did not start');
};

export const stopServer = (child) => {
  if (!child) return;
  try {
    if (process.platform === 'win32') execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' });
    else child.kill('SIGTERM');
  } catch {
    // already gone
  }
};

// ---------------------------------------------------------------------------
// Screenshot recipes: navigate, set the scene, and outline what matters
// ---------------------------------------------------------------------------
const STILL = `*,*::before,*::after{animation:none!important;transition:none!important}
.guide-hl{outline:4px solid #e8620e!important;outline-offset:3px!important;border-radius:10px}
[role="alert"]{display:none!important}
nav > div:has(a[href$="#/admin"]){display:none!important}`;

// The demo user is an admin; clients never see the Admin menu, so it's removed from the shots.
const go = async (page, hash) => {
  await page.goto(BASE + hash);
  await page.addStyleTag({ content: STILL });
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.querySelectorAll('nav a[href$="#/admin"]').forEach((a) => a.closest('nav > div')?.remove()));
};
// Guides outline the button to press; marketing shots stay clean (capture(..., { highlight: false })).
let highlight = true;
const mark = (loc) => (highlight ? loc.first().evaluate((el) => el.classList.add('guide-hl')) : Promise.resolve());
const openInvoice = async (page, status) => {
  await go(page, `#/bills${status ? `?status=${status}` : ''}`);
  await page.locator('tbody tr').first().getByRole('button').first().click();
  await page.getByRole('heading', { name: /^Invoice:/ }).waitFor();
};

// Turns invoice designs on for the demo account through the admin screen. Later navigation
// only changes the URL hash, so the in-memory demo data (and this setting) is kept.
const configureTemplates = async (page, { def, canChoose = false }) => {
  await go(page, '#/admin/clients/demo-user');
  await page.getByRole('heading', { name: 'Dwarkadhish Marketing', level: 1 }).waitFor();
  for (const l of ['Modern', 'Minimal', 'Thermal 3"', 'Thermal 2"']) await page.getByLabel(`Allow ${l}`).check();
  await page.getByLabel(`Default ${def}`).check();
  const sw = page.getByRole('switch', { name: 'Client can change template' });
  if ((await sw.getAttribute('aria-checked')) !== String(canChoose)) await sw.click();
  await page.getByRole('button', { name: 'Save changes' }).first().click();
  await page.getByText('You have unsaved changes').waitFor({ state: 'detached' });
};

export const SHOTS = {
  dashboard: async (p) => {
    await go(p, '#/dashboard');
    await p.getByRole('heading', { name: /Good (morning|afternoon|evening)/ }).waitFor();
  },
  invoiceForm: async (p) => {
    await go(p, '#/bills?new=1');
    await p.getByPlaceholder('Search party by name, phone or GSTIN…').fill('Ramesh');
    await p.getByRole('button', { name: /^Ramesh Traders/ }).click();
    const item = p.getByLabel('Item 1 name');
    await item.fill('Steel Water Bottle');
    await item.press('Escape');
    await p.getByLabel('Item 1 quantity').fill('4');
    await mark(p.getByRole('button', { name: /Save Sales Invoice/ }));
  },
  invoiceView: async (p) => {
    await openInvoice(p);
    await mark(p.getByTitle('Share invoice PDF on WhatsApp'));
  },
  recordPayment: async (p) => {
    await openInvoice(p, 'unpaid');
    await p.getByRole('button', { name: 'Record Payment' }).click();
    await p.waitForTimeout(300);
  },
  reminder: async (p) => {
    await go(p, '#/bills?status=unpaid');
    await mark(p.getByRole('button', { name: 'Send payment reminder on WhatsApp' }));
  },
  rowMenu: async (p) => {
    await go(p, '#/bills');
    await p.getByRole('button', { name: 'More actions' }).first().click();
    await mark(p.getByRole('menu'));
  },
  export: async (p) => {
    await go(p, '#/bills');
    await mark(p.getByRole('button', { name: 'Export', exact: true }));
  },
  quotation: async (p) => {
    await go(p, '#/quotations');
    await p.getByRole('button', { name: 'QT-0001', exact: true }).click();
    await mark(p.getByRole('dialog').getByRole('button', { name: 'Convert to Invoice' }));
  },
  stock: async (p) => {
    await go(p, '#/products');
    await mark(p.getByRole('button', { name: /Low stock/ }));
    await mark(p.getByRole('columnheader', { name: 'Stock' }));
  },
  statement: async (p) => {
    await go(p, '#/customers/c1/statement');
    await p.getByText('Ramesh Traders').first().waitFor();
  },
  products: async (p) => {
    await go(p, '#/products');
    await mark(p.getByRole('button', { name: 'Import' }));
  },
  catalog: async (p) => {
    await go(p, '#/catalog/demo-user');
    await p.getByText(/Order on WhatsApp/).first().waitFor();
  },
  promote: async (p) => {
    await go(p, '#/products');
    await p.getByRole('button', { name: 'Promote (Instagram/WhatsApp)' }).first().click();
    await p.waitForTimeout(800);
  },
  templatePicker: async (p) => {
    await configureTemplates(p, { def: 'Modern', canChoose: true });
    await go(p, '#/settings');
    await p.getByRole('radiogroup', { name: 'Invoice template' }).waitFor();
    await p.getByRole('radiogroup', { name: 'Invoice template' }).getByRole('radio', { name: /Modern/ }).click();
    await mark(p.getByRole('radiogroup', { name: 'Invoice template' }));
    // Crop to the Invoice Template section (it sits far down the Settings page).
    return p.locator('section', { has: p.getByRole('heading', { name: 'Invoice Template' }) });
  },
  modernPaper: async (p) => {
    await configureTemplates(p, { def: 'Modern' });
    await openInvoice(p);
    return p.locator('#invoice-pdf-content');
  },
  thermalPaper: async (p) => {
    await configureTemplates(p, { def: 'Thermal 3"' });
    await openInvoice(p);
    return p.locator('#invoice-pdf-content');
  },
  settings: async (p) => {
    await go(p, '#/settings');
    await p.getByText('Manage Business').first().waitFor();
  },
  // ---- Phone-sized shots for the landing page's "Why" section ----
  phoneInvoiceForm: async (p) => {
    await go(p, '#/bills?new=1');
    await p.getByPlaceholder('Search party by name, phone or GSTIN…').fill('Ramesh');
    await p.getByRole('button', { name: /^Ramesh Traders/ }).click();
    const item = p.getByLabel('Item 1 name');
    await item.fill('Steel Water Bottle');
    await item.press('Escape');
    await p.getByLabel('Item 1 quantity').fill('4');
    await p.getByLabel('Item 1 quantity').blur();
    await p.evaluate(() => window.scrollTo(0, 0));
  },
  phoneReminders: async (p) => {
    await go(p, '#/bills?status=unpaid');
    await p.getByText('All invoices').waitFor();
  },
  phoneStock: async (p) => {
    await go(p, '#/products');
    await p.getByText('All products').waitFor();
  },
  phoneQuotation: async (p) => {
    await go(p, '#/quotations');
    await p.getByRole('button', { name: /QT-0001/ }).first().click();
    await p.getByRole('dialog').waitFor();
  },
  phoneDashboard: async (p) => {
    await go(p, '#/dashboard');
    await p.getByRole('heading', { name: /Good (morning|afternoon|evening)/ }).waitFor();
  },
  // The invoice as a customer sees it on a phone (for phone mockups).
  invoiceMobile: async (p) => {
    await openInvoice(p);
    await p.evaluate(() => document.querySelector('.fixed.inset-0')?.classList.remove('p-4'));
  },
  // Just the printed invoice (for document mockups).
  invoicePaper: async (p) => {
    await openInvoice(p);
    return p.locator('#invoice-pdf-content');
  },
  quotationPaper: async (p) => {
    await go(p, '#/quotations');
    await p.getByRole('button', { name: 'QT-0001', exact: true }).click();
    return p.getByRole('dialog').locator('#invoice-pdf-content');
  },
};
const PHONE_SHOTS = new Set(['catalog', 'invoiceMobile', 'phoneInvoiceForm', 'phoneReminders', 'phoneStock', 'phoneQuotation', 'phoneDashboard']);

// Returns { data: base64 PNG, phone }. A recipe may return a locator to crop to that element.
export const capture = async (browser, key, { highlight: hl = true, jpeg = false } = {}) => {
  const phone = PHONE_SHOTS.has(key);
  const page = await browser.newPage({ viewport: phone ? { width: 390, height: 780 } : { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  highlight = hl;
  try {
    const target = await SHOTS[key](page);
    await page.waitForTimeout(250);
    const opts = jpeg ? { type: 'jpeg', quality: 78 } : { type: 'png' };
    const png = target ? await target.screenshot(opts) : await page.screenshot(opts);
    return { data: png.toString('base64'), phone };
  } finally {
    highlight = true;
    await page.close();
  }
};

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const FONT_FACE = `@font-face{font-family:'Inter';src:url(data:font/woff2;base64,${inter}) format('woff2');font-weight:100 900}`;
export const FONT_STACK = `'Inter','Nirmala UI','Noto Sans Devanagari','Mangal',system-ui,sans-serif`;
