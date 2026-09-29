import { test, expect, Page } from '@playwright/test';
import * as XLSX from 'xlsx';
import { readFileSync } from 'node:fs';

// End-to-end flows against the demo data (src/dev/demoDb.ts). Every test loads the
// app fresh, so it starts from the same data:
// - 48 invoices INV-0001..INV-0048 (next is INV-0049), one quotation QT-0001
// - stock: "Steel Water Bottle" 40, "EPOXY NORMAL 5 KG" 25, "Cotton Saree" 3 (alert at 5 → low)
// Navigation inside a test uses the sidebar (no reload) so the in-memory changes are kept.

const errors: string[] = [];

test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on('pageerror', (e) => errors.push(e.message));
  // Capture WhatsApp links instead of opening new tabs.
  await page.addInitScript(() => {
    (window as any).__opened = [];
    window.open = ((url: string) => {
      (window as any).__opened.push(url);
      return null;
    }) as any;
  });
});

test.afterEach(() => {
  expect(errors, 'uncaught page errors').toEqual([]);
});

const nav = async (page: Page, label: string) => {
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: label, exact: true }).click();
};

// Product rows: checkbox | product | HSN | unit | stock | price | actions
const productRow = (page: Page, product: string) => page.getByRole('row').filter({ hasText: product });
const stockOf = async (page: Page, product: string) => (await productRow(page, product).locator('td').nth(4).innerText()).trim();

// Fills the invoice/quotation form with one party and one line item.
const fillForm = async (page: Page, party: string, item: string, qty: number) => {
  await page.getByPlaceholder('Search party by name, phone or GSTIN…').fill(party.split(' ')[0]);
  await page.getByRole('button', { name: new RegExp(`^${party}`) }).click();
  const name = page.getByLabel('Item 1 name');
  await name.fill(item);
  await name.press('Escape');
  await page.getByLabel('Item 1 quantity').fill(String(qty));
};

const createInvoice = async (page: Page, qty: number, opts: { received?: number } = {}) => {
  await page.goto('#/bills?new=1');
  await fillForm(page, 'Ramesh Traders', 'Steel Water Bottle', qty);
  if (opts.received) await page.getByLabel('Amount received').fill(String(opts.received));
  await page.getByRole('button', { name: /Save Sales Invoice/ }).click();
  await expect(page.getByRole('heading', { name: 'Invoice: INV-0049' })).toBeVisible();
};

const closeInvoice = (page: Page) => page.locator('.fixed.inset-0').getByRole('button').filter({ has: page.locator('.fa-xmark') }).last().click();

const rowMenu = async (page: Page, billNo: string) => {
  const row = page.getByRole('row').filter({ has: page.getByRole('button', { name: billNo, exact: true }) });
  await row.getByRole('button', { name: 'More actions' }).click();
  return row;
};

test.describe('Stock', () => {
  test('saving an invoice reduces stock and shows a live stock hint', async ({ page }) => {
    await page.goto('#/bills?new=1');
    await fillForm(page, 'Ramesh Traders', 'Steel Water Bottle', 4);
    await expect(page.getByText('In stock: 40')).toBeVisible();
    await expect(page.getByLabel('Item 1 price')).toHaveValue('349');
    await page.getByRole('button', { name: /Save Sales Invoice/ }).click();
    await expect(page.getByRole('heading', { name: 'Invoice: INV-0049' })).toBeVisible();
    await closeInvoice(page);
    await nav(page, 'Products');
    expect(await stockOf(page, 'Steel Water Bottle')).toBe('36');
  });

  test('warns when a line asks for more than is in stock', async ({ page }) => {
    await page.goto('#/bills?new=1');
    await fillForm(page, 'Ramesh Traders', 'Cotton Saree', 5);
    await expect(page.getByText('Only 3 in stock')).toBeVisible();
  });

  test('dashboard low-stock alert opens the filtered product list', async ({ page }) => {
    await page.goto('#/dashboard');
    await page.getByRole('link', { name: /1 product is low on stock/ }).click();
    await expect(page.getByRole('button', { name: 'Low stock (1)' })).toHaveAttribute('aria-pressed', 'true');
    await expect(productRow(page, 'Cotton Saree')).toBeVisible();
    await expect(productRow(page, 'Steel Water Bottle')).toHaveCount(0);
  });

  test('a new product can track stock', async ({ page }) => {
    await page.goto('#/products?new=1');
    await page.getByPlaceholder('e.g. Wireless Mouse').fill('Test Mug');
    await page.getByPlaceholder('0.00').fill('120');
    await page.getByLabel('Track stock for this product').check();
    await page.getByLabel('Current Stock').fill('12');
    await page.getByLabel('Low Stock Alert At').fill('2');
    await page.getByRole('button', { name: 'Save Product' }).click();
    await expect(productRow(page, 'Test Mug')).toBeVisible();
    expect(await stockOf(page, 'Test Mug')).toBe('12');
  });
});

test.describe('Edit / cancel / delete invoice', () => {
  test('edit keeps the number and moves stock by the difference', async ({ page }) => {
    await createInvoice(page, 4);
    await page.getByRole('button', { name: 'Edit', exact: true }).click();
    await expect(page.getByRole('heading', { name: /Edit Sales Invoice\s*INV-0049/ })).toBeVisible();
    await expect(page.getByLabel('Item 1 quantity')).toHaveValue('4');
    await expect(page.getByText('In stock: 40')).toBeVisible(); // 36 left + 4 already on this invoice
    await page.getByLabel('Item 1 quantity').fill('10');
    await page.getByRole('button', { name: /Update Sales Invoice/ }).click();
    await expect(page.getByRole('heading', { name: 'Invoice: INV-0049' })).toBeVisible();
    await closeInvoice(page);
    await expect(page.getByRole('button', { name: 'INV-0050', exact: true })).toHaveCount(0);
    await nav(page, 'Products');
    expect(await stockOf(page, 'Steel Water Bottle')).toBe('30');
  });

  test('edit keeps payments already recorded', async ({ page }) => {
    await createInvoice(page, 2, { received: 100 });
    await page.getByRole('button', { name: 'Edit', exact: true }).click();
    await expect(page.getByText('Payments are added or removed from the invoice view')).toBeVisible();
    await page.getByLabel('Item 1 quantity').fill('3');
    await page.getByRole('button', { name: /Update Sales Invoice/ }).click();
    await expect(page.getByText(/Payment History \(1\) · Received ₹100\.00/)).toBeVisible();
  });

  test('cancel keeps the invoice, drops it from totals and returns stock; restore undoes it', async ({ page }) => {
    await createInvoice(page, 5);
    await closeInvoice(page);
    const received = page.getByText('Total sales').locator('..');
    const before = await received.innerText();

    await rowMenu(page, 'INV-0049');
    await page.getByRole('menuitem', { name: 'Cancel invoice' }).click();
    await page.getByRole('button', { name: 'Cancel Invoice' }).click();
    const row = page.getByRole('row').filter({ has: page.getByRole('button', { name: 'INV-0049', exact: true }) });
    await expect(row.getByText('Cancelled')).toBeVisible();
    await expect(page.getByRole('tab', { name: /Cancelled/ }).or(page.getByRole('button', { name: /Cancelled/ })).first()).toBeVisible();
    await expect.poll(() => received.innerText()).not.toBe(before);

    // no edit / payment on a cancelled invoice
    await rowMenu(page, 'INV-0049');
    await expect(page.getByRole('menuitem', { name: 'Edit' })).toHaveCount(0);
    await page.getByRole('menuitem', { name: 'Restore invoice' }).click();
    await expect(row.getByText('Cancelled')).toHaveCount(0);
    await expect.poll(() => received.innerText()).toBe(before);

    await rowMenu(page, 'INV-0049');
    await page.getByRole('menuitem', { name: 'Cancel invoice' }).click();
    await page.getByRole('button', { name: 'Cancel Invoice' }).click();
    await expect(row.getByText('Cancelled')).toBeVisible();
    await nav(page, 'Products');
    expect(await stockOf(page, 'Steel Water Bottle')).toBe('40');
  });

  test('a cancelled invoice still downloads as PDF', async ({ page }) => {
    await createInvoice(page, 1);
    await closeInvoice(page);
    await rowMenu(page, 'INV-0049');
    await page.getByRole('menuitem', { name: 'Cancel invoice' }).click();
    await page.getByRole('button', { name: 'Cancel Invoice' }).click();
    const row = page.getByRole('row').filter({ has: page.getByRole('button', { name: 'INV-0049', exact: true }) });
    await expect(row.getByText('Cancelled')).toBeVisible();
    const download = page.waitForEvent('download');
    await row.getByRole('button', { name: 'Download PDF' }).click();
    expect((await download).suggestedFilename()).toBe('Invoice_INV-0049.pdf');
  });

  test('delete removes the invoice and returns stock', async ({ page }) => {
    await createInvoice(page, 6);
    await closeInvoice(page);
    await rowMenu(page, 'INV-0049');
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByRole('button', { name: 'INV-0049', exact: true })).toHaveCount(0);
    await nav(page, 'Products');
    expect(await stockOf(page, 'Steel Water Bottle')).toBe('40');
  });
});

test.describe('WhatsApp payment reminders', () => {
  const opened = (page: Page) => page.evaluate(() => (window as any).__opened as string[]);

  test('from an unpaid invoice row', async ({ page }) => {
    await createInvoice(page, 2);
    await closeInvoice(page);
    const row = page.getByRole('row').filter({ has: page.getByRole('button', { name: 'INV-0049', exact: true }) });
    await row.getByRole('button', { name: 'Send payment reminder on WhatsApp' }).click();
    const [url] = await opened(page);
    expect(url).toMatch(/^https:\/\/wa\.me\/919825012345\?text=/);
    const text = decodeURIComponent(url.split('?text=')[1]);
    expect(text).toContain('Dear Ramesh Traders');
    expect(text).toContain('₹823.64 is pending on invoice INV-0049');
    expect(text).toContain('dwarkadhish@okhdfcbank');
  });

  test('from the invoice view', async ({ page }) => {
    await createInvoice(page, 2);
    const link = page.getByRole('link', { name: 'Remind' });
    await expect(link).toHaveAttribute('href', /wa\.me\/919825012345\?text=.*INV-0049/);
  });

  test('from a customer with an outstanding balance', async ({ page }) => {
    await page.goto('#/customers');
    const row = page.getByRole('row').filter({ hasText: 'Ramesh Traders' });
    await row.getByRole('button', { name: 'Send payment reminder on WhatsApp' }).click();
    const [url] = await opened(page);
    const text = decodeURIComponent(url.split('?text=')[1]);
    expect(url).toContain('wa.me/919825012345');
    expect(text).toMatch(/Dear Ramesh Traders,\nThis is a friendly reminder that ₹[\d,]+\.\d\d is pending on your account/);
  });

  test('not offered on paid or cancelled invoices', async ({ page }) => {
    await page.goto('#/bills?status=paid');
    await expect(page.getByRole('button', { name: 'Send payment reminder on WhatsApp' })).toHaveCount(0);
  });
});

test.describe('Export invoices to Excel', () => {
  const readExport = async (page: Page) => {
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export', exact: true }).click();
    const file = await download;
    const wb = XLSX.read(readFileSync(await file.path()), { type: 'buffer' });
    return {
      name: file.suggestedFilename(),
      invoices: XLSX.utils.sheet_to_json<Record<string, any>>(wb.Sheets['Invoices']),
      items: XLSX.utils.sheet_to_json<Record<string, any>>(wb.Sheets['Items']),
    };
  };
  const shownCount = async (page: Page) => Number((await page.getByText('All invoices').locator('span').innerText()).replace(/\D/g, ''));

  test('exports the chosen date range with a totals row and an items sheet', async ({ page }) => {
    await page.goto('#/bills');
    await page.getByLabel('Date range').click();
    await page.getByRole('option', { name: 'Last 30 Days' }).click();
    const n = await shownCount(page);
    const x = await readExport(page);
    expect(x.name).toMatch(/^Sales_Invoices_Last_30_Days_\d{4}-\d{2}-\d{2}\.xlsx$/);
    expect(x.invoices).toHaveLength(n + 1); // + totals row
    const total = x.invoices[n];
    expect(total['Invoice No.']).toBe(`TOTAL (${n} invoices)`);
    const sum = x.invoices.slice(0, n).reduce((s, r) => s + r['Invoice Total'], 0);
    expect(total['Invoice Total']).toBeCloseTo(sum, 2);
    expect(Object.keys(x.invoices[0])).toEqual(expect.arrayContaining(['GSTIN', 'Taxable Amount', 'CGST', 'SGST', 'IGST', 'Balance', 'Status']));
    expect(x.items.length).toBeGreaterThanOrEqual(n);
    expect(Object.keys(x.items[0])).toEqual(expect.arrayContaining(['Item', 'HSN', 'Qty', 'GST %', 'Amount']));

    await page.getByLabel('Date range').click();
    await page.getByRole('option', { name: 'All Time' }).click();
    const all = await readExport(page);
    expect(all.name).toMatch(/^Sales_Invoices_All_Time_/);
    expect(all.invoices).toHaveLength(48 + 1);
  });

  test('follows the status tab and leaves cancelled invoices out of the totals', async ({ page }) => {
    await createInvoice(page, 2);
    await closeInvoice(page);
    await rowMenu(page, 'INV-0049');
    await page.getByRole('menuitem', { name: 'Cancel invoice' }).click();
    await page.getByRole('button', { name: 'Cancel Invoice' }).click();
    await expect(page.getByRole('row').filter({ has: page.getByRole('button', { name: 'INV-0049', exact: true }) }).getByText('Cancelled')).toBeVisible();

    const x = await readExport(page); // All tab, Last 365 Days
    const cancelled = x.invoices.find((r) => r['Invoice No.'] === 'INV-0049')!;
    expect(cancelled.Status).toBe('Cancelled');
    const total = x.invoices[x.invoices.length - 1];
    expect(total['Invoice No.']).toBe('TOTAL (48 invoices, 1 cancelled excluded)');
    expect(x.items.some((r) => r['Invoice No.'] === 'INV-0049')).toBe(false);

    await page.getByRole('tab', { name: /^Paid/ }).click();
    const paid = await readExport(page);
    expect(paid.name).toMatch(/^Sales_Invoices_Last_365_Days_paid_/);
    expect(paid.invoices.slice(0, -1).every((r) => r.Status === 'Paid')).toBe(true);
  });
});

test.describe('Quotations', () => {
  test('create a quotation, then convert it into an invoice', async ({ page }) => {
    await page.goto('#/quotations');
    await expect(page.getByRole('button', { name: 'QT-0001', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Create Quotation' }).click();
    await expect(page.getByRole('heading', { name: 'Create Quotation' })).toBeVisible();
    await expect(page.getByText('Valid Till')).toBeVisible();
    await expect(page.getByLabel('Amount received')).toHaveCount(0);
    await fillForm(page, 'Ramesh Traders', 'Steel Water Bottle', 2);
    await page.getByRole('button', { name: /Save Quotation/ }).click();
    const view = page.getByRole('dialog', { name: 'Quotation QT-0002' });
    await expect(view).toBeVisible();
    await expect(view.getByText('Quotation No.')).toBeVisible();
    await expect(view.getByText('Received Amount')).toHaveCount(0);

    // quotations don't touch stock
    await view.getByRole('button', { name: 'Close' }).click();
    await nav(page, 'Products');
    expect(await stockOf(page, 'Steel Water Bottle')).toBe('40');

    await nav(page, 'Quotations');
    const qRow = page.getByRole('row').filter({ has: page.getByRole('button', { name: 'QT-0002', exact: true }) });
    await qRow.getByRole('button', { name: 'Convert to Invoice' }).click();
    await expect(page.getByRole('heading', { name: 'Create Sales Invoice' })).toBeVisible();
    await expect(page.getByLabel('Item 1 name')).toHaveValue('Steel Water Bottle');
    await expect(page.getByLabel('Item 1 quantity')).toHaveValue('2');
    await page.getByRole('button', { name: /Save Sales Invoice/ }).click();
    await expect(page.getByRole('heading', { name: 'Invoice: INV-0049' })).toBeVisible();
    await closeInvoice(page);

    await nav(page, 'Quotations');
    await expect(qRow.getByText('Converted · INV-0049')).toBeVisible();
    await expect(qRow.getByRole('button', { name: 'Convert to Invoice' })).toHaveCount(0);
    await nav(page, 'Products');
    expect(await stockOf(page, 'Steel Water Bottle')).toBe('38');
  });

  test('a quotation downloads as PDF', async ({ page }) => {
    await page.goto('#/quotations');
    const row = page.getByRole('row').filter({ has: page.getByRole('button', { name: 'QT-0001', exact: true }) });
    const download = page.waitForEvent('download');
    await row.getByRole('button', { name: 'Download PDF' }).click();
    expect((await download).suggestedFilename()).toBe('Quotation_QT-0001.pdf');
  });

  test('is in the sidebar and the New Invoice menu', async ({ page }) => {
    await page.goto('#/dashboard');
    await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Quotations' })).toBeVisible();
    await page.getByRole('button', { name: 'More create options' }).click();
    await page.getByRole('menuitem', { name: 'New Quotation' }).click();
    await expect(page.getByRole('heading', { name: 'Create Quotation' })).toBeVisible();
  });
});

test.describe('Admin: client screen', () => {
  const openClient = async (page: Page, name: string) => {
    await page.goto('#/admin');
    await page.getByRole('row').filter({ hasText: name }).getByRole('button', { name: 'Edit plan & features' }).click();
    await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible();
  };

  test('switch features, save, and see them on the Clients list', async ({ page }) => {
    await openClient(page, 'Sita Stores');
    await expect(page).toHaveURL(/#\/admin\/clients\/client-b$/);
    await expect(page.getByRole('button', { name: 'Save changes' }).first()).toBeDisabled();

    await page.getByRole('switch', { name: 'Quotations' }).click();
    await expect(page.getByRole('switch', { name: 'Quotations' })).toHaveAttribute('aria-checked', 'true');
    await page.getByRole('switch', { name: 'Stock Tracking' }).click();
    await expect(page.getByText('You have unsaved changes')).toBeVisible();
    await expect(page.getByText('Custom', { exact: true })).toHaveCount(3); // catalog (existing override) + quotations + stock

    await page.getByRole('button', { name: 'Save changes' }).first().click();
    await expect(page.getByText('You have unsaved changes')).toHaveCount(0);

    await page.getByRole('button', { name: 'Back' }).click();
    const row = page.getByRole('row').filter({ hasText: 'Sita Stores' });
    await expect(row).toContainText('Quotations');
    await expect(row).not.toContainText('Stock Tracking');
  });

  test('picking a plan resets features; Reset and Discard work', async ({ page }) => {
    await openClient(page, 'Sita Stores');
    await page.getByRole('radio', { name: /^Pro/ }).click();
    await expect(page.getByRole('radio', { name: /^Pro/ })).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByText('Custom', { exact: true })).toHaveCount(0);
    for (const f of ['Quotations', 'Stock Tracking', 'Party Statement (Ledger)']) {
      await expect(page.getByRole('switch', { name: f })).toHaveAttribute('aria-checked', 'true');
    }
    await page.getByRole('switch', { name: 'Promote Product' }).click();
    await page.getByRole('button', { name: 'Reset to plan' }).click();
    await expect(page.getByRole('switch', { name: 'Promote Product' })).toHaveAttribute('aria-checked', 'true');

    await page.getByRole('button', { name: 'Discard' }).click();
    await expect(page.getByRole('radio', { name: /^Basic/ })).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByText('You have unsaved changes')).toHaveCount(0);
  });

  test('renewing an expired client and blocking an active one', async ({ page }) => {
    await openClient(page, 'Om Electricals');
    await expect(page.getByText(/Expired on .* can't create or edit/)).toBeVisible();
    await expect(page.getByText('Read-only', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: '+1 month' }).click();
    await expect(page.getByText(/Access until .* days from today/)).toBeVisible();
    await expect(page.getByText('Full access', { exact: true })).toBeVisible();

    await page.getByRole('radio', { name: /^Blocked/ }).click();
    await expect(page.getByText('Read-only', { exact: true })).toBeVisible();
    await expect(page.getByText('Blocked by you')).toBeVisible();
    await page.getByRole('button', { name: 'Save changes' }).first().click();
    await expect(page.getByText('You have unsaved changes')).toHaveCount(0);
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByRole('row').filter({ hasText: 'Om Electricals' })).toContainText('Blocked');
  });
});

test('Help Center has the new articles and finds them by search', async ({ page }) => {
  await page.goto('#/knowledge-base');
  const search = page.getByLabel('Search help articles');
  for (const [q, title] of [
    ['quotation', 'Quotations & converting to invoice'],
    ['cancel invoice', 'Edit or cancel an invoice'],
    ['low stock', 'Track stock & low-stock alerts'],
    ['reminder', 'Send payment reminders on WhatsApp'],
    ['expired', 'Your plan, trial & renewal'],
  ]) {
    await search.fill(q);
    await expect(page.getByText(title).first()).toBeVisible();
  }
  await page.goto('#/knowledge-base?a=invoice-edit-cancel');
  await expect(page.getByRole('heading', { name: 'Edit or cancel an invoice' }).first()).toBeVisible();
});

test.describe('Invoice templates (admin-controlled)', () => {
  const paper = (page: Page) => page.locator('#invoice-pdf-content');
  const openB1 = async (page: Page) => {
    await page.goto('#/bills?open=b1');
    await expect(page.getByRole('heading', { name: /INV-0001/ })).toBeVisible();
  };
  // Admin screen for the demo owner's own account.
  const configure = async (page: Page, opts: { allow?: string[]; deny?: string[]; def?: string; canChoose?: boolean }) => {
    await page.goto('#/admin/clients/demo-user');
    await expect(page.getByRole('heading', { name: 'Dwarkadhish Marketing', level: 1 })).toBeVisible();
    for (const t of opts.allow || []) await page.getByLabel(`Allow ${t}`).check();
    for (const t of opts.deny || []) await page.getByLabel(`Allow ${t}`).uncheck();
    if (opts.def) await page.getByLabel(`Default ${opts.def}`).check();
    if (opts.canChoose !== undefined) {
      const sw = page.getByRole('switch', { name: 'Client can change template' });
      if ((await sw.getAttribute('aria-checked')) !== String(opts.canChoose)) await sw.click();
    }
    await page.getByRole('button', { name: 'Save changes' }).first().click();
    await expect(page.getByText('You have unsaved changes')).toHaveCount(0);
  };
  const downloadPdf = async (page: Page) => {
    const dl = page.waitForEvent('download');
    await page.locator('.fixed.inset-0').getByRole('button', { name: /Download PDF/ }).first().click();
    return readFileSync(await (await dl).path(), 'latin1');
  };

  test('everyone gets Classic by default, and clients see no template picker', async ({ page }) => {
    await openB1(page);
    await expect(paper(page)).not.toHaveAttribute('data-template', /.+/);
    await expect(paper(page).getByText('Original for Recipient')).toBeVisible();
    const pdf = await downloadPdf(page);
    expect(pdf).toContain('ORIGINAL FOR RECIPIENT');
    await page.goto('#/settings');
    await expect(page.getByText('Manage Business').first()).toBeVisible();
    await expect(page.getByText('Invoice Template', { exact: true })).toHaveCount(0);
  });

  test('admin sets Modern as the default: invoice, PDF and quotation use it', async ({ page }) => {
    await configure(page, { allow: ['Modern'], def: 'Modern' });
    await openB1(page);
    await expect(paper(page)).toHaveAttribute('data-template', 'modern');
    const pdf = await downloadPdf(page);
    expect(pdf).not.toContain('ORIGINAL FOR RECIPIENT');
    expect(pdf).toMatch(/\/MediaBox \[0 0 595\.2\d* 841\.8\d*\]/); // A4
    await page.goto('#/quotations');
    await page.getByRole('button', { name: 'QT-0001', exact: true }).click();
    await expect(page.getByRole('dialog').locator('#invoice-pdf-content')).toHaveAttribute('data-template', 'modern');
  });

  test('thermal receipts come out 80 mm and 58 mm wide', async ({ page }) => {
    await configure(page, { allow: ['Thermal 3"', 'Thermal 2"'], def: 'Thermal 3"' });
    await openB1(page);
    await expect(paper(page)).toHaveAttribute('data-template', 'thermal80');
    expect(await downloadPdf(page)).toMatch(/\/MediaBox \[0 0 226\.77/); // 80 mm in points
    await configure(page, { def: 'Thermal 2"' });
    await openB1(page);
    await expect(paper(page)).toHaveAttribute('data-template', 'thermal58');
    expect(await downloadPdf(page)).toMatch(/\/MediaBox \[0 0 164\.4/); // 58 mm in points
  });

  test('when allowed, the client picks a design in Settings; removing access falls back', async ({ page }) => {
    await configure(page, { allow: ['Modern', 'Minimal'], def: 'Modern', canChoose: true });
    await page.goto('#/settings');
    const picker = page.getByRole('radiogroup', { name: 'Invoice template' });
    await expect(picker.getByRole('radio')).toHaveCount(3); // Classic + the two allowed
    await picker.getByRole('radio', { name: /Minimal/ }).click();
    await page.getByRole('radiogroup', { name: 'Invoice colour' }).getByRole('radio', { name: 'Green' }).click();
    await page.getByRole('button', { name: /Save Changes/ }).first().click();
    await expect(page.getByRole('alert').filter({ hasText: 'Settings saved' })).toBeVisible();
    await openB1(page);
    await expect(paper(page)).toHaveAttribute('data-template', 'minimal');

    // Admin takes Minimal away: the client's choice is no longer allowed, so the admin default applies.
    await configure(page, { deny: ['Minimal'] });
    await openB1(page);
    await expect(paper(page)).toHaveAttribute('data-template', 'modern');
  });
});

test.describe('Sample products Excel', () => {
  const readSample = async (page: Page, click: () => Promise<void>) => {
    const dl = page.waitForEvent('download');
    await click();
    const file = await dl;
    expect(file.suggestedFilename()).toBe('myBillCounter-Sample-Products.xlsx');
    const path = await file.path();
    return { path, wb: XLSX.read(readFileSync(path), { type: 'buffer' }) };
  };

  test('downloads from the Help Center with every import column and instructions', async ({ page }) => {
    await page.goto('#/knowledge-base?a=products-bulk-import');
    const { wb } = await readSample(page, () => page.getByRole('button', { name: 'Download sample Excel' }).click());
    expect(wb.SheetNames).toEqual(['Products', 'Instructions']);
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(wb.Sheets['Products']);
    expect(Object.keys(rows[0])).toEqual(['name', 'price', 'unit', 'hsn', 'gst', 'stock', 'low_stock', 'image']);
    expect(rows).toHaveLength(5);
    const help = XLSX.utils.sheet_to_json<string[]>(wb.Sheets['Instructions'], { header: 1 }).flat().join(' ');
    expect(help).toContain('Only "name" and "price" are required');
  });

  test('the sample imports as is, with GST and stock', async ({ page }) => {
    await page.goto('#/products');
    await page.getByRole('button', { name: 'Import' }).click();
    const { path } = await readSample(page, () => page.getByRole('button', { name: 'Download sample Excel' }).click());
    await page.locator('input[type="file"][accept=".csv,.xlsx,.xls"]').setInputFiles({ name: 'products.xlsx', mimeType: 'application/octet-stream', buffer: readFileSync(path) });
    await expect(page.getByRole('alert').filter({ hasText: 'Successfully imported 5 item(s)' })).toBeVisible();
    expect(await stockOf(page, 'Cotton T-Shirt')).toBe('100');
    expect(await stockOf(page, 'Wall Paint 20L')).toBe('—'); // blank stock = not tracked
    // GST from the sheet is used when the product goes on an invoice
    await page.goto('#/bills?new=1');
    await page.getByLabel('Item 1 name').fill('Cotton T-Shirt');
    await page.getByLabel('Item 1 name').press('Escape');
    await expect(page.getByLabel('Tax rate').first()).toContainText('5%');
  });
});

test.describe('Admin: clean up / delete a client', () => {
  const row = (page: Page, name: string) => page.getByRole('row').filter({ hasText: name });

  test('Cancel on the confirmation changes nothing', async ({ page }) => {
    await page.goto('#/admin');
    await row(page, 'Dwarkadhish Marketing').getByRole('button', { name: 'Clean up data' }).click();
    await expect(page.getByText(/48 invoices, 1 quotation, 8 products, 6 customers/)).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await nav(page, 'Sales Invoices');
    await expect(page.getByRole('button', { name: 'INV-0048', exact: true })).toBeVisible();
  });

  test('clean up empties the account but keeps Business Settings', async ({ page }) => {
    await page.goto('#/admin');
    await row(page, 'Dwarkadhish Marketing').getByRole('button', { name: 'Clean up data' }).click();
    await expect(page.getByText(/Business Settings, plan and validity are kept/)).toBeVisible();
    await page.getByRole('button', { name: 'Yes, clean up' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'data cleaned up' })).toBeVisible();

    await nav(page, 'Sales Invoices');
    await expect(page.getByRole('cell').getByText('No invoices in this period')).toBeVisible();
    await nav(page, 'Products');
    await expect(page.getByRole('cell').getByText('No products available')).toBeVisible();
    await nav(page, 'Customers');
    await expect(page.getByRole('row').filter({ hasText: 'Ramesh Traders' })).toHaveCount(0);
    await nav(page, 'Quotations');
    await expect(page.getByRole('cell').getByText('No quotations yet')).toBeVisible();
    await nav(page, 'Settings');
    await expect(page.locator('input[value="Dwarkadhish Marketing"]').first()).toBeVisible();
    await nav(page, 'Sales Invoices');
    await page.getByRole('button', { name: 'Create Invoice' }).first().click();
    await expect(page.getByLabel('Invoice number')).toHaveValue('1');
  });

  test('delete marks the account Deleted; you cannot delete yourself', async ({ page }) => {
    await page.goto('#/admin');
    await expect(row(page, 'Dwarkadhish Marketing').getByRole('button', { name: 'Delete account' })).toHaveCount(0);
    await row(page, 'Sita Stores').getByRole('button', { name: 'Delete account' }).click();
    await expect(page.getByText(/Permanently delete the account of Sita Stores/)).toBeVisible();
    await page.getByRole('button', { name: 'Yes, delete account' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'account deleted' })).toBeVisible();
    await expect(row(page, 'Sita Stores')).toContainText('Deleted');
    await expect(row(page, 'Sita Stores').getByRole('button', { name: 'Clean up data' })).toHaveCount(0);
    await row(page, 'Sita Stores').getByRole('button', { name: 'Edit plan & features' }).click();
    await expect(page.getByText(/This account was deleted/)).toBeVisible();
  });
});

test.describe('Landing page', () => {
  const signedOut = (page: Page) => page.addInitScript(() => sessionStorage.setItem('demo.signedOut', '1'));
  const header = (page: Page) => page.getByRole('banner');

  test('a visitor sees Login and Start free trial, and each opens its page', async ({ page }) => {
    await signedOut(page);
    await page.goto('');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Billing that gets you paid faster.');
    await header(page).getByRole('link', { name: 'Login' }).click();
    await expect(page).toHaveURL(/#\/login$/);
    await expect(page.getByRole('button', { name: /Sign in|Log in|Login/ }).first()).toBeVisible();

    await page.goto('');
    await page.getByRole('link', { name: 'Start free trial' }).first().click();
    await expect(page).toHaveURL(/#\/register$/);
  });

  test('section links scroll without changing the page, and Hindi switches the text', async ({ page }) => {
    await signedOut(page);
    await page.goto('');
    await header(page).getByRole('button', { name: 'Plans' }).click();
    await expect(page.locator('#plans')).toBeInViewport();
    await expect(page).toHaveURL(/Bill-Counter\/(#\/)?$/);
    await expect(page.locator('#plans')).toContainText('Contact us for pricing');

    await page.getByRole('button', { name: 'हिं' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('बिलिंग जो दिलाए');
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('बिलिंग जो दिलाए'); // remembered
  });

  test('a signed-in user gets Open Dashboard, and Login / Register go straight to the dashboard', async ({ page }) => {
    await page.goto('');
    await expect(header(page).getByRole('link', { name: 'Login' })).toHaveCount(0);
    await header(page).getByRole('link', { name: 'Open Dashboard' }).click();
    await expect(page.getByRole('heading', { name: /Good (morning|afternoon|evening)/ })).toBeVisible();
    await page.goto('#/login');
    await expect(page).toHaveURL(/#\/dashboard$/);
    await page.goto('#/register');
    await expect(page).toHaveURL(/#\/dashboard$/);
  });

  test('"Why myBillCounter": click an item to show its phone screen', async ({ page }) => {
    await signedOut(page);
    await page.goto('');
    const why = page.locator('#features');
    await why.scrollIntoViewIfNeeded();
    await expect(why.getByRole('heading', { level: 2 })).toContainText('Why myBillCounter');
    await expect(why.getByRole('tab')).toHaveCount(7);
    await expect(why.getByRole('tab', { selected: true })).toContainText('Create GST & non-GST invoices');
    await why.getByRole('tab', { name: /Track stock in real time/ }).click();
    await expect(why.getByRole('tab', { selected: true })).toContainText('Low-stock alerts tell you what to reorder');
    await expect(why.getByRole('tabpanel').getByRole('img', { name: 'Track stock in real time' })).toBeVisible();
    await expect(why.getByRole('tabpanel')).toContainText('Low stock: Cotton Saree');
    await expect(page.locator('footer')).toContainText('mybillcounter@gmail.com');
  });

  test('fits a phone screen, with every screenshot loaded', async ({ page }) => {
    await signedOut(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('');
    await expect(header(page).getByRole('link', { name: 'Login' })).toBeVisible();
    for (let y = 0; y < 16000; y += 800) await page.mouse.wheel(0, 800);
    await page.waitForTimeout(600);
    const broken = await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src));
    expect(broken).toEqual([]);
    const extra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(extra).toBeLessThanOrEqual(0);
  });
});

test.describe('Responsive: no sideways scrolling', () => {
  const PAGES = [
    '#/dashboard',
    '#/bills',
    '#/bills?open=b1',
    '#/bills?new=1',
    '#/quotations',
    '#/quotations?new=1',
    '#/customers',
    '#/products',
    '#/products?new=1',
    '#/admin',
    '#/admin/clients/client-b',
    '#/settings',
    '#/knowledge-base?a=stock',
  ];
  for (const width of [375, 768]) {
    test(`all pages fit a ${width}px screen`, async ({ page }) => {
      test.slow(); // visits every page
      await page.setViewportSize({ width, height: 812 });
      for (const path of PAGES) {
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(400);
        const extra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(extra, `${path} scrolls sideways at ${width}px`).toBeLessThanOrEqual(0);
      }
    });
  }

  test('phones get cards on the Clients and Quotations lists', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('#/quotations');
    await expect(page.getByRole('button', { name: /QT-0001.*Ramesh Traders/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Convert to Invoice' })).toBeVisible();
    await expect(page.getByRole('table')).toBeHidden();
    await page.goto('#/admin');
    await page.getByRole('link', { name: /Sita Stores/ }).click();
    await expect(page.getByRole('heading', { name: 'Sita Stores', level: 1 })).toBeVisible();
  });
});

test('every page loads without errors', async ({ page }) => {
  test.slow(); // visits every page
  for (const [path, heading] of [
    ['#/dashboard', /Good (morning|afternoon|evening)/],
    ['#/bills', 'Sales Invoices'],
    ['#/quotations', 'Quotations'],
    ['#/customers', 'Customers'],
    ['#/customers/c1/statement', /Ramesh Traders/],
    ['#/products', 'Products'],
    ['#/settings', /Settings/],
    ['#/knowledge-base', /Knowledge Base|Help/],
    ['#/admin', 'Clients'],
    ['#/admin/clients/client-b', 'Sita Stores'],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible();
  }
});
