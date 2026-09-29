// Real app screenshots for the landing page, saved to public/landing/*.jpg.
//
//   npm run landing-shots
//
// Uses the demo app (sample data) and the same recipes as the guide images, without
// highlights. Re-run after changing the app so the landing page stays current.

import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, capture, startServer, stopServer } from './shared.mjs';

const OUT = join(ROOT, 'public', 'landing');
// file name -> screenshot recipe
const SHOTS = {
  dashboard: 'dashboard',
  invoice: 'invoiceForm',
  'invoice-phone': 'invoiceMobile',
  reminders: 'reminder',
  stock: 'stock',
  quotation: 'quotation',
  statement: 'statement',
  catalog: 'catalog',
  'design-modern': 'modernPaper',
  'design-thermal': 'thermalPaper',
  export: 'export',
  // phone screens for the "Why" section
  'phone-invoice': 'phoneInvoiceForm',
  'phone-reminders': 'phoneReminders',
  'phone-stock': 'phoneStock',
  'phone-quotation': 'phoneQuotation',
  'phone-dashboard': 'phoneDashboard',
};

mkdirSync(OUT, { recursive: true });
const server = await startServer();
const browser = await chromium.launch();
try {
  for (const [file, key] of Object.entries(SHOTS)) {
    const shot = await capture(browser, key, { highlight: false, jpeg: true });
    writeFileSync(join(OUT, `${file}.jpg`), Buffer.from(shot.data, 'base64'));
    console.log(`wrote public/landing/${file}.jpg`);
  }
} finally {
  await browser.close();
  stopServer(server);
}
