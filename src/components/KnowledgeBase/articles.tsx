import React from 'react';
import { AccountGuide, AppTourGuide } from './guides/start';
import { CreateInvoiceGuide, EditCancelGuide, InvoiceShareGuide, QuotationsGuide, SalesListGuide } from './guides/sales';
import { PaymentsGuide, RemindersGuide } from './guides/payments';
import { CustomersGuide } from './guides/customers';
import { PartyStatementGuide } from './PartyStatementGuide';
import { BulkDeleteGuide, BulkImportGuide, ProductsGuide, StockGuide } from './guides/products';
import { CatalogGuide, PromoteGuide } from './guides/marketing';
import { DashboardGuide } from './guides/dashboard';
import { BankGuide, BusinessProfileGuide, FeaturesGuide, InvoiceDefaultsGuide, PlanGuide, TemplatesGuide } from './guides/settings';
import { FaqGuide, GstBasicsGuide } from './guides/help';
import type { FeatureKey } from '../../types';

export interface KbCategory {
  id: string;
  label: string;
  icon: string;
  tint: string; // icon tile classes
  description: string;
}

export interface KbArticle {
  id: string;
  category: string;
  icon: string;
  title: string;
  summary: string;
  keywords: string;
  minutes: number;
  where?: string; // where to find the feature in the app
  related?: string[];
  feature?: FeatureKey; // hidden when the client's plan doesn't include it
  Body: React.FC;
}

export const CATEGORIES: KbCategory[] = [
  { id: 'start', label: 'Getting Started', icon: 'fa-solid fa-rocket', tint: 'bg-brand-50 text-brand-600', description: 'Create your account, log in and find your way around the app.' },
  { id: 'sales', label: 'Sales & Invoices', icon: 'fa-solid fa-file-invoice', tint: 'bg-violet-50 text-violet-600', description: 'Create GST invoices, share them on WhatsApp and manage your invoice list.' },
  { id: 'payments', label: 'Payments', icon: 'fa-solid fa-indian-rupee-sign', tint: 'bg-emerald-50 text-emerald-600', description: 'Record full and part payments and keep track of what is still due.' },
  { id: 'customers', label: 'Customers', icon: 'fa-solid fa-users', tint: 'bg-sky-50 text-sky-600', description: 'Save customers and suppliers, credit terms and customer-wise statements.' },
  { id: 'products', label: 'Products', icon: 'fa-solid fa-box', tint: 'bg-amber-50 text-amber-600', description: 'Add products one by one or import them from Excel, and clean up your list.' },
  { id: 'marketing', label: 'Marketing & Sharing', icon: 'fa-solid fa-bullhorn', tint: 'bg-rose-50 text-rose-600', description: 'Share an online catalog and create social media posts for your products.' },
  { id: 'dashboard', label: 'Dashboard', icon: 'fa-solid fa-chart-column', tint: 'bg-indigo-50 text-indigo-600', description: 'Read your sales, payments, dues and top customers at a glance.' },
  { id: 'settings', label: 'Settings', icon: 'fa-solid fa-gear', tint: 'bg-slate-100 text-slate-600', description: 'Business details, invoice defaults, GST, bank account and optional features.' },
  { id: 'help', label: 'Help & FAQ', icon: 'fa-solid fa-circle-question', tint: 'bg-teal-50 text-teal-600', description: 'GST basics explained simply, plus answers to common questions.' },
];

export const ARTICLES: KbArticle[] = [
  // ---- Getting Started ----
  {
    id: 'getting-started',
    category: 'start',
    icon: 'fa-solid fa-user-plus',
    title: 'Create your account & log in',
    summary: 'Sign up with your email, log in, reset a forgotten password and log out.',
    keywords: 'register sign up signup login log in email account password forgot reset logout sign out business name',
    minutes: 3,
    where: 'Login page',
    related: ['app-tour', 'settings-business'],
    Body: AccountGuide,
  },
  {
    id: 'app-tour',
    category: 'start',
    icon: 'fa-solid fa-compass',
    title: 'Find your way around',
    summary: 'The sidebar, the top-bar search and New Invoice button, and using the app on a phone.',
    keywords: 'sidebar menu navigation search ctrl k command create new invoice button quick add collapse mobile phone drawer hamburger layout tour logout',
    minutes: 2,
    where: 'Sidebar & top bar',
    related: ['getting-started', 'dashboard'],
    Body: AppTourGuide,
  },
  // ---- Sales ----
  {
    id: 'bills-create',
    category: 'sales',
    icon: 'fa-solid fa-file-circle-plus',
    title: 'Create a sales invoice',
    summary: 'Pick a party, add items with HSN, discount and GST, add charges and record money received.',
    keywords: 'bill invoice create new sales bill to ship to party place of supply prefix number date due payment terms vehicle hsn unit quantity price discount tax gst cgst sgst igst additional charges round off notes terms bank qr received preview save',
    minutes: 6,
    where: 'Top bar → New Invoice',
    related: ['invoice-share', 'payments', 'gst-basics'],
    Body: CreateInvoiceGuide,
  },
  {
    id: 'invoice-share',
    category: 'sales',
    icon: 'fa-brands fa-whatsapp',
    title: 'View, download & share an invoice',
    summary: 'Open an invoice, download the PDF and send it to the customer on WhatsApp with a UPI QR.',
    keywords: 'view open invoice pdf download print share whatsapp send customer qr upi scan pay tax invoice original for recipient',
    minutes: 3,
    where: 'Sales Invoices → invoice number',
    related: ['bills-create', 'payments', 'settings-invoice'],
    Body: InvoiceShareGuide,
  },
  {
    id: 'sales-list',
    category: 'sales',
    icon: 'fa-solid fa-list',
    title: 'Manage your invoice list',
    summary: 'Totals, tabs, search, sorting, export to Excel, and download, share or delete from each row.',
    keywords: 'sales invoices list filter tabs paid unpaid overdue cancelled search sort date range last 30 90 365 all time due delete download pdf whatsapp share menu pagination edit remind export excel xlsx report ca accountant gst',
    minutes: 3,
    where: 'Sidebar → Sales Invoices',
    related: ['invoice-edit-cancel', 'invoice-share', 'payments'],
    Body: SalesListGuide,
  },
  {
    id: 'invoice-edit-cancel',
    category: 'sales',
    icon: 'fa-solid fa-pen-to-square',
    title: 'Edit or cancel an invoice',
    summary: 'Correct a saved invoice, or cancel it while keeping its number. Restore it if needed.',
    keywords: 'edit change correct mistake update saved invoice cancel void cancelled restore undo delete gap number series gst stock',
    minutes: 3,
    where: 'Sales Invoices → ⋯ → Edit / Cancel invoice',
    related: ['sales-list', 'stock', 'payments'],
    Body: EditCancelGuide,
  },
  {
    id: 'quotations',
    category: 'sales',
    icon: 'fa-solid fa-file-signature',
    title: 'Quotations & converting to invoice',
    summary: 'Send a price quote, then turn it into an invoice in one click when the customer agrees.',
    keywords: 'quotation quote estimate proforma price offer valid till expired convert invoice qt',
    minutes: 3,
    where: 'Sidebar → Quotations',
    related: ['bills-create', 'invoice-share'],
    feature: 'quotations',
    Body: QuotationsGuide,
  },
  // ---- Payments ----
  {
    id: 'payments',
    category: 'payments',
    icon: 'fa-solid fa-hand-holding-dollar',
    title: 'Record full & partial payments',
    summary: 'Record each payment when you receive it: amount, date and mode. Instalments are fine.',
    keywords: 'payment record partial part instalment installment paid unpaid received due balance mark fully paid history delete mode cash upi card bank other',
    minutes: 4,
    where: 'Invoice → Record Payment',
    related: ['invoice-share', 'payment-reminders', 'party-statement', 'dashboard'],
    Body: PaymentsGuide,
  },
  {
    id: 'payment-reminders',
    category: 'payments',
    icon: 'fa-regular fa-bell',
    title: 'Send payment reminders on WhatsApp',
    summary: 'A ready-written “payment pending” message with the amount, invoice and your UPI ID.',
    keywords: 'reminder remind whatsapp pending due outstanding overdue collect follow up message bell upi customer balance',
    minutes: 2,
    where: 'Sales Invoices → 🔔 / Customers → 🔔',
    related: ['payments', 'dashboard', 'sales-list'],
    Body: RemindersGuide,
  },
  // ---- Customers ----
  {
    id: 'customers',
    category: 'customers',
    icon: 'fa-solid fa-address-book',
    title: 'Add & manage customers',
    summary: 'Save customers and suppliers with GSTIN, addresses, opening balance and credit terms.',
    keywords: 'customer party supplier add edit delete search phone email address gstin pan billing shipping credit period limit opening balance to collect to pay category save new',
    minutes: 4,
    where: 'Sidebar → Customers',
    related: ['party-statement', 'bills-create'],
    Body: CustomersGuide,
  },
  {
    id: 'party-statement',
    category: 'customers',
    icon: 'fa-solid fa-file-lines',
    title: 'Party statement (ledger)',
    summary: 'A customer-wise statement of invoices, payments and balance. Download, print or share it.',
    keywords: 'party statement ledger customer wise account statement balance outstanding receivable payable debit credit dr cr opening closing pdf print whatsapp share',
    minutes: 5,
    where: 'Customers → customer name',
    related: ['payments', 'customers', 'settings-features'],
    feature: 'partyStatement',
    Body: PartyStatementGuide,
  },
  // ---- Products ----
  {
    id: 'products-manage',
    category: 'products',
    icon: 'fa-solid fa-box-open',
    title: 'Add & edit products',
    summary: 'Add products with price, unit, HSN and a photo, then view, edit, search or delete them.',
    keywords: 'product item add edit delete image photo price unit hsn sac details search pagination',
    minutes: 3,
    where: 'Sidebar → Products',
    related: ['products-bulk-import', 'stock', 'bills-create'],
    Body: ProductsGuide,
  },
  {
    id: 'stock',
    category: 'products',
    icon: 'fa-solid fa-boxes-stacked',
    title: 'Track stock & low-stock alerts',
    summary: 'Invoices reduce stock automatically; see what is running low before you run out.',
    keywords: 'stock inventory quantity count track low stock alert reorder warehouse in stock out of stock reduce cancel restore',
    minutes: 3,
    where: 'Products → Add / Edit Product',
    related: ['products-manage', 'invoice-edit-cancel', 'dashboard'],
    feature: 'stock',
    Body: StockGuide,
  },
  {
    id: 'products-bulk-import',
    category: 'products',
    icon: 'fa-solid fa-file-import',
    title: 'Import products from Excel / CSV',
    summary: 'Download the sample Excel, fill in your products and import hundreds at once, with photos and stock.',
    keywords: 'bulk import excel xlsx xls csv spreadsheet upload images photos columns name price hsn unit image sample template download gst stock low stock',
    minutes: 4,
    where: 'Products → Import',
    related: ['products-manage', 'products-bulk-delete'],
    feature: 'bulkImport',
    Body: BulkImportGuide,
  },
  {
    id: 'products-bulk-delete',
    category: 'products',
    icon: 'fa-solid fa-trash-can',
    title: 'Delete many products at once',
    summary: 'Select several products (or a whole page) and remove them together.',
    keywords: 'bulk delete remove multiple select checkbox select all clear',
    minutes: 1,
    where: 'Products → tick rows',
    related: ['products-manage', 'products-bulk-import'],
    Body: BulkDeleteGuide,
  },
  // ---- Marketing ----
  {
    id: 'catalog',
    category: 'marketing',
    icon: 'fa-solid fa-store',
    title: 'Share your online catalog',
    summary: 'A public shop page with your products. Customers order on WhatsApp, no login needed.',
    keywords: 'catalog storefront shop share link public whatsapp instagram order online store chat',
    minutes: 3,
    where: 'Products → Share Catalog',
    related: ['promote', 'settings-business'],
    feature: 'catalog',
    Body: CatalogGuide,
  },
  {
    id: 'promote',
    category: 'marketing',
    icon: 'fa-solid fa-bullhorn',
    title: 'Promote a product on social media',
    summary: 'Get a ready-made square post and caption for Instagram and WhatsApp.',
    keywords: 'promote marketing post instagram whatsapp caption hashtags image share social status',
    minutes: 2,
    where: 'Products → 📣 icon',
    related: ['catalog', 'products-manage'],
    feature: 'promote',
    Body: PromoteGuide,
  },
  // ---- Dashboard ----
  {
    id: 'dashboard',
    category: 'dashboard',
    icon: 'fa-solid fa-gauge-high',
    title: 'Understand your dashboard',
    summary: 'Sales, payments received, dues, top customers and products, GST and overdue reminders.',
    keywords: 'dashboard metrics sales revenue chart payments received to collect outstanding overdue aging top customers products gst period fiscal year remind whatsapp recent activity',
    minutes: 5,
    where: 'Sidebar → Dashboard',
    related: ['payments', 'sales-list', 'gst-basics'],
    Body: DashboardGuide,
  },
  // ---- Settings ----
  {
    id: 'settings-business',
    category: 'settings',
    icon: 'fa-solid fa-building',
    title: 'Business details, logo & signature',
    summary: 'Everything printed at the top of your invoices: name, address, GSTIN, logo, signature.',
    keywords: 'settings manage business profile logo signature name phone email address state pincode city gst registered gstin pan business type industry registration details msme website fssai',
    minutes: 4,
    where: 'Sidebar → Settings',
    related: ['settings-invoice', 'settings-bank'],
    Body: BusinessProfileGuide,
  },
  {
    id: 'settings-invoice',
    category: 'settings',
    icon: 'fa-solid fa-sliders',
    title: 'Invoice defaults: number, UPI & GST',
    summary: 'Invoice number prefix, UPI ID for the payment QR, default GST rate and terms.',
    keywords: 'invoice defaults prefix number upi id qr gst default tax rate apply gst terms conditions',
    minutes: 3,
    where: 'Settings → Invoice Defaults',
    related: ['settings-business', 'gst-basics', 'bills-create'],
    Body: InvoiceDefaultsGuide,
  },
  {
    id: 'invoice-templates',
    category: 'settings',
    icon: 'fa-solid fa-palette',
    title: 'Invoice design & thermal printing',
    summary: 'Classic, Modern, Minimal and 2"/3" thermal receipts, and how to print on a thermal printer.',
    keywords: 'template design layout theme colour color modern minimal classic thermal receipt 58mm 80mm 2 inch 3 inch printer print bluetooth pos',
    minutes: 2,
    where: 'Settings → Invoice Template',
    related: ['settings-invoice', 'invoice-share'],
    Body: TemplatesGuide,
  },
  {
    id: 'settings-bank',
    category: 'settings',
    icon: 'fa-solid fa-building-columns',
    title: 'Add your bank account',
    summary: 'Print your bank details on invoices so customers can pay by bank transfer.',
    keywords: 'bank account holder name number ifsc branch print invoice neft rtgs imps',
    minutes: 1,
    where: 'Settings → Bank Account',
    related: ['settings-invoice', 'bills-create'],
    Body: BankGuide,
  },
  {
    id: 'settings-features',
    category: 'settings',
    icon: 'fa-solid fa-toggle-on',
    title: 'Turn optional features on or off',
    summary: 'Keep the app simple and switch on extra tools like Party Statement only when you need them.',
    keywords: 'features optional toggle switch on off party statement ledger enable disable',
    minutes: 1,
    where: 'Settings → Features',
    related: ['party-statement', 'plan'],
    feature: 'partyStatement',
    Body: FeaturesGuide,
  },
  {
    id: 'plan',
    category: 'settings',
    icon: 'fa-solid fa-crown',
    title: 'Your plan, trial & renewal',
    summary: 'What the trial and expiry banners mean, and why some features may be hidden.',
    keywords: 'plan subscription trial free expired expiry renew renewal upgrade banner read only blocked features locked hidden price pay',
    minutes: 2,
    related: ['settings-features', 'faq'],
    Body: PlanGuide,
  },
  // ---- Help ----
  {
    id: 'gst-basics',
    category: 'help',
    icon: 'fa-solid fa-percent',
    title: 'GST on invoices, explained simply',
    summary: 'When CGST + SGST applies, when IGST applies, and how HSN, taxable amount and rates work.',
    keywords: 'gst cgst sgst igst intra inter state place of supply hsn sac taxable amount rate 5 12 18 28 tax invoice gstin',
    minutes: 4,
    related: ['bills-create', 'settings-invoice', 'settings-business'],
    Body: GstBasicsGuide,
  },
  {
    id: 'faq',
    category: 'help',
    icon: 'fa-solid fa-circle-question',
    title: 'FAQ & troubleshooting',
    summary: 'Answers to common questions: editing invoices, expired plan, missing QR, WhatsApp attachments and more.',
    keywords: 'faq help problem troubleshoot error edit invoice qr missing whatsapp attach pdf popup blocked password logo not showing reload plan expired stock wrong feature missing',
    minutes: 4,
    related: ['getting-started', 'invoice-share'],
    Body: FaqGuide,
  },
];

// "New here?" checklist on the Help Center home.
export const START_HERE: { id: string; label: string; hint: string }[] = [
  { id: 'getting-started', label: 'Create your account', hint: 'Email & password sign-up' },
  { id: 'settings-business', label: 'Add business details', hint: 'Name, address, logo, GSTIN' },
  { id: 'products-manage', label: 'Add your products', hint: 'Or import them from Excel' },
  { id: 'bills-create', label: 'Create an invoice', hint: 'Party, items, GST, total' },
  { id: 'invoice-share', label: 'Share it on WhatsApp', hint: 'PDF with a pay-by-UPI QR' },
];
