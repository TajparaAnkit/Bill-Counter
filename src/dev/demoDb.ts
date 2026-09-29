// DEV-ONLY stand-in for src/services/db.ts, swapped in by vite.config.ts when
// the dev server runs with BC_DEMO=1. Same exports, in-memory sample data, no
// Firebase/Cloudinary calls — used to preview and screenshot real pages
// without logging in. Never bundled into production builds.

import type { Account, Bill, BillPayment, Customer, Product, PublicProfile, Quotation, UserProfile } from '../types';
import { summarizePayments } from '../utils/payment';

export type CustomerInput = Omit<Customer, 'id' | 'userId' | 'createdAt'>;
export type StockDeltas = Record<string, number>;
export interface StockInput {
  stock: number | null;
  lowStock: number | null;
}

const UID = 'demo-user';
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const wait = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 150));
let seq = 1;
// `_` keeps generated ids apart from the seeded ones (b1…b48, p1…, c1…).
const id = (p: string) => `${p}_${seq++}`;

let profile: UserProfile = {
  uid: UID,
  email: 'owner@demo.shop',
  businessName: 'Dwarkadhish Marketing',
  address: '12, Station Road',
  city: 'Rajkot',
  state: 'Gujarat',
  pincode: '360001',
  phone: '9712717273',
  gstRegistered: true,
  gstin: '24AORPT2645F1ZN',
  pan: 'AORPT2645F',
  upiId: 'dwarkadhish@okhdfcbank',
  billPrefix: 'INV',
  taxEnabled: true,
  defaultTaxRate: 18,
  invoiceNotes: 'Goods once sold cannot be returned. Payment due within 15 days.',
  bankName: 'HDFC Bank',
  bankAccountNo: '50100123456789',
  bankIfsc: 'HDFC0001234',
  bankBranch: 'Rajkot',
  bankAccountHolder: 'Dwarkadhish Marketing',
  partyStatementEnabled: true,
  createdAt: new Date(),
};

const CUSTS: [string, string, string, string][] = [
  ['Ramesh Traders', '9825012345', 'ramesh@traders.in', '24AAYFG2879D1ZZ'],
  ['Sita Stores', '9909954321', 'sita@stores.in', ''],
  ['Patel Hardware', '9898011122', 'accounts@patelhw.com', '24AABCP1234C1Z5'],
  ['Om Electricals', '9727000111', '', '27AAACO4567E1Z2'],
  ['Shree Krishna Mart', '9824455667', 'skmart@gmail.com', ''],
  ['Jay Ambe Kirana', '9879012345', '', ''],
];
let customers: Customer[] = CUSTS.map(([name, phone, email, gstin], i) => ({
  id: `c${i + 1}`,
  userId: UID,
  name,
  phone,
  email,
  gstin,
  address: `${10 + i}, Market Yard, Rajkot`,
  partyType: i === 5 ? 'supplier' : 'customer',
  category: i % 2 ? 'Retail' : 'Wholesale',
  creditPeriod: 15,
  creditLimit: 50000,
  openingBalance: i === 0 ? 5000 : 0,
  openingBalanceType: 'to_collect',
  createdAt: new Date(),
}));

const PRODS: [string, number, string][] = [
  ['EPOXY NORMAL 5 KG', 1059, '3814'],
  ['Swastik border', 70, ''],
  ['Kitty rakhi', 80, ''],
  ['Flower hairclip', 60, ''],
  ['Morpankh rakhi', 90, ''],
  ['Rudraksha Rakhi', 60, ''],
  ['Cotton Saree', 1450, '5208'],
  ['Steel Water Bottle', 349, '7323'],
];
// A few products track stock (Cotton Saree starts below its alert level).
const STOCK: Record<string, [number, number]> = { p1: [25, 5], p7: [3, 5], p8: [40, 10] };
let products: Product[] = PRODS.map(([name, price, hsn], i) => ({
  id: `p${i + 1}`,
  userId: UID,
  name,
  price,
  hsn,
  unit: 'PCS',
  ...(STOCK[`p${i + 1}`] ? { stock: STOCK[`p${i + 1}`][0], lowStock: STOCK[`p${i + 1}`][1] } : {}),
  createdAt: new Date(Date.now() - i * 86400000),
}));

const applyStock = (deltas: StockDeltas = {}) => {
  products = products.map((p) => (deltas[p.id] && typeof p.stock === 'number' ? { ...p, stock: p.stock + deltas[p.id] } : p));
};
const withStock = (s?: StockInput) => (s ? (s.stock != null ? { stock: s.stock, lowStock: s.lowStock ?? 0 } : { stock: undefined, lowStock: undefined }) : {});

let bills: Bill[] = (() => {
  const out: Bill[] = [];
  let s = 11;
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < 48; i++) {
    const d = new Date();
    d.setDate(d.getDate() - Math.floor(rnd() * 90));
    const c = customers[Math.floor(rnd() * 5)];
    const items = [0, 1].slice(0, 1 + Math.floor(rnd() * 2)).map(() => {
      const p = products[Math.floor(rnd() * products.length)];
      const qty = 1 + Math.floor(rnd() * 8);
      const taxable = qty * p.price;
      const taxAmount = Math.round(taxable * 0.18 * 100) / 100;
      return { productName: p.name, hsn: p.hsn, unit: 'PCS', quantity: qty, price: p.price, taxRate: 18, taxable, taxAmount, total: taxable + taxAmount };
    });
    const taxableAmount = items.reduce((a, x) => a + x.taxable, 0);
    const tax = items.reduce((a, x) => a + x.taxAmount, 0);
    const total = Math.round(taxableAmount + tax);
    const due = new Date(d);
    due.setDate(due.getDate() + 15);
    const r = rnd();
    const pays: BillPayment[] = r > 0.5 ? [{ id: id('pay'), amount: total, date: iso(d), method: rnd() > 0.5 ? 'upi' : 'cash' }] : r > 0.28 ? [{ id: id('pay'), amount: Math.round(total / 2), date: iso(d), method: 'upi' }] : [];
    const sum = summarizePayments(total, pays);
    out.push({
      id: `b${i + 1}`,
      userId: UID,
      billNo: `INV-${String(i + 1).padStart(4, '0')}`,
      billSeqNum: i + 1,
      billPrefix: 'INV',
      customerId: c.id,
      customerName: c.name,
      customerPhone: c.phone,
      billTo: { name: c.name, phone: c.phone, address: c.address, gstin: c.gstin },
      items,
      subtotal: total,
      tax,
      cgst: tax / 2,
      sgst: tax / 2,
      taxableAmount,
      total,
      invoiceDate: iso(d),
      dueDate: iso(due),
      paymentTerms: 15,
      placeOfSupply: 'Gujarat',
      createdAt: d,
      showPaymentQr: true,
      ...sum,
      paidAt: sum.paidAt || undefined,
    } as Bill);
  }
  return out.sort((a, b) => (b.invoiceDate || '').localeCompare(a.invoiceDate || ''));
})();

// ---- profile ----
export const uploadImageToCloudinary = async (file: File): Promise<string> => wait(URL.createObjectURL(file));
export const getBusinessProfile = async (_uid: string): Promise<UserProfile | null> => wait({ ...profile });
export const updateBusinessProfile = async (_uid: string, data: Partial<UserProfile>): Promise<void> => {
  profile = { ...profile, ...data };
  await wait(null);
};
export const getPublicCatalog = async (_uid: string): Promise<{ profile: PublicProfile | null; products: Product[] }> =>
  wait({ profile: { userId: UID, businessName: profile.businessName, phone: profile.phone, upiId: profile.upiId }, products: [...products] });

// ---- products ----
export const getProducts = async (_uid: string) => wait([...products]);
export const addProduct = async (_uid: string, name: string, price: number, _img?: File | null, hsn?: string, unit?: string, s?: StockInput): Promise<Product> => {
  const p: Product = { id: id('p'), userId: UID, name, price, hsn: hsn || '', unit: unit || 'PCS', ...withStock(s), createdAt: new Date() };
  products = [p, ...products];
  return wait(p);
};
export const updateProduct = async (_uid: string, pid: string, name: string, price: number, imageUrl?: string, _f?: File | null, hsn?: string, unit?: string, s?: StockInput) => {
  products = products.map((p) => (p.id === pid ? { ...p, name, price, imageUrl, hsn: hsn || '', unit: unit || 'PCS', ...withStock(s) } : p));
  await wait(null);
};
export const deleteProduct = async (pid: string) => {
  products = products.filter((p) => p.id !== pid);
  await wait(null);
};
export const bulkDeleteProducts = async (ids: string[]) => {
  products = products.filter((p) => !ids.includes(p.id));
  await wait(null);
};
export const bulkImportProducts = async (_uid: string, items: { name: string; price: number; imageUrl?: string; hsn?: string; unit?: string; taxRate?: number; stock?: number; lowStock?: number }[]) => {
  products = [
    ...items.map((x) => ({
      id: id('p'),
      userId: UID,
      name: x.name,
      price: x.price,
      imageUrl: x.imageUrl,
      hsn: x.hsn || '',
      unit: x.unit || 'PCS',
      ...(x.taxRate != null ? { taxRate: x.taxRate } : {}),
      ...(x.stock != null ? { stock: x.stock, lowStock: x.lowStock ?? 0 } : {}),
      createdAt: new Date(),
    })),
    ...products,
  ];
  await wait(null);
};

// ---- bills ----
export const getBills = async (_uid: string) => wait([...bills]);
export const getNextBillNumber = async (_uid: string, prefix = 'INV') => {
  const next = Math.max(0, ...bills.map((b) => b.billSeqNum || 0)) + 1;
  return wait({ billNo: `${prefix}-${String(next).padStart(4, '0')}`, billSeqNum: next });
};
export const addBill = async (_uid: string, data: Omit<Bill, 'id' | 'userId' | 'createdAt'>, deltas?: StockDeltas): Promise<Bill> => {
  const b = { ...data, id: id('b'), userId: UID, createdAt: new Date() } as Bill;
  bills = [b, ...bills];
  applyStock(deltas);
  return wait(b);
};
export const updateBill = async (bill: Bill, data: Omit<Bill, 'id' | 'userId' | 'createdAt'>, deltas?: StockDeltas): Promise<Bill> => {
  const b = { ...data, id: bill.id, userId: bill.userId, createdAt: bill.createdAt } as Bill;
  bills = bills.map((x) => (x.id === bill.id ? b : x));
  applyStock(deltas);
  return wait(b);
};
export const setBillCancelled = async (bill: Bill, cancelled: boolean, deltas?: StockDeltas): Promise<Bill> => {
  const b = { ...bill, cancelled, cancelledAt: cancelled ? new Date() : null };
  bills = bills.map((x) => (x.id === bill.id ? b : x));
  applyStock(deltas);
  return wait(b);
};
export const deleteBill = async (bid: string, deltas?: StockDeltas) => {
  bills = bills.filter((b) => b.id !== bid);
  applyStock(deltas);
  await wait(null);
};
export const saveBillPayments = async (bill: Bill, payments: BillPayment[]): Promise<Bill> => {
  const s = summarizePayments(bill.total || 0, payments);
  const updated = { ...bill, ...s, paidAt: s.paidAt || undefined } as Bill;
  bills = bills.map((b) => (b.id === bill.id ? updated : b));
  return wait(updated);
};

// ---- customers ----
export const getCustomers = async (_uid: string) => wait([...customers].sort((a, b) => a.name.localeCompare(b.name)));
export const getCustomer = async (cid: string) => wait(customers.find((c) => c.id === cid) || null);
export const addCustomer = async (_uid: string, data: CustomerInput): Promise<Customer> => {
  const c = { ...data, id: id('c'), userId: UID, createdAt: new Date() } as Customer;
  customers = [...customers, c];
  return wait(c);
};
export const updateCustomer = async (cid: string, data: CustomerInput) => {
  customers = customers.map((c) => (c.id === cid ? { ...c, ...data } : c));
  await wait(null);
};
export const deleteCustomer = async (cid: string) => {
  customers = customers.filter((c) => c.id !== cid);
  await wait(null);
};

// ---- accounts (demo user is an admin so the Admin page can be previewed) ----
const inDays = (n: number) => new Date(Date.now() + n * 86400000);
let accounts: Account[] = [
  { uid: UID, email: 'owner@demo.shop', businessName: 'Dwarkadhish Marketing', plan: 'pro', status: 'active', validTill: inDays(200), createdAt: inDays(-165) },
  { uid: 'client-b', email: 'sita@stores.in', businessName: 'Sita Stores', plan: 'basic', status: 'active', validTill: inDays(5), features: { catalog: true }, notes: 'Paid ₹999 by UPI', createdAt: inDays(-60) },
  { uid: 'client-c', email: 'om@electricals.in', businessName: 'Om Electricals', plan: 'trial', status: 'active', validTill: inDays(-3), createdAt: inDays(-17) },
];
export const getOrCreateAccount = async (uid: string, _email: string, _name?: string): Promise<Account> => wait({ ...accounts.find((a) => a.uid === uid)! });
export const isAdminUser = async (_uid: string) => wait(true);
export const listAccounts = async (): Promise<Account[]> => wait(accounts.map((a) => ({ ...a })));
export const getClientAccount = async (uid: string): Promise<Account | null> => wait(accounts.find((a) => a.uid === uid) ? { ...accounts.find((a) => a.uid === uid)! } : null);
export const updateAccount = async (uid: string, data: Pick<Account, 'plan' | 'status' | 'validTill' | 'features' | 'notes' | 'invoice'>, _catalogEnabled: boolean) => {
  accounts = accounts.map((a) => (a.uid === uid ? { ...a, ...data } : a));
  await wait(null);
};

// ---- quotations ----
let quotations: Quotation[] = [
  {
    ...bills[0],
    id: 'q1',
    docType: 'quotation',
    billNo: 'QT-0001',
    billSeqNum: 1,
    billPrefix: 'QT',
    payments: [],
    amountPaid: 0,
    paymentStatus: 'unpaid',
    paymentMethod: undefined,
    paidAt: undefined,
    showPaymentQr: false,
  },
];
export const getQuotations = async (_uid: string) => wait([...quotations]);
export const getQuotation = async (qid: string) => wait(quotations.find((q) => q.id === qid) || null);
export const getNextQuotationNumber = async (_uid: string, prefix = 'QT') => {
  const next = Math.max(0, ...quotations.map((q) => q.billSeqNum || 0)) + 1;
  return wait({ billNo: `${prefix}-${String(next).padStart(4, '0')}`, billSeqNum: next });
};
export const addQuotation = async (_uid: string, data: Omit<Quotation, 'id' | 'userId' | 'createdAt'>): Promise<Quotation> => {
  const q = { ...data, docType: 'quotation', id: id('q'), userId: UID, createdAt: new Date() } as Quotation;
  quotations = [q, ...quotations];
  return wait(q);
};
export const updateQuotation = async (quotation: Quotation, data: Omit<Quotation, 'id' | 'userId' | 'createdAt'>): Promise<Quotation> => {
  const q = { ...data, docType: 'quotation', id: quotation.id, userId: quotation.userId, createdAt: quotation.createdAt } as Quotation;
  quotations = quotations.map((x) => (x.id === quotation.id ? q : x));
  return wait(q);
};
export const deleteQuotation = async (qid: string) => {
  quotations = quotations.filter((q) => q.id !== qid);
  await wait(null);
};
export const convertQuotationToBill = async (_uid: string, quotation: Quotation, data: Omit<Bill, 'id' | 'userId' | 'createdAt'>, deltas?: StockDeltas): Promise<Bill> => {
  const b = { ...data, fromQuotationId: quotation.id, fromQuotationNo: quotation.billNo, id: id('b'), userId: UID, createdAt: new Date() } as Bill;
  bills = [b, ...bills];
  quotations = quotations.map((q) => (q.id === quotation.id ? { ...q, convertedBillId: b.id, convertedBillNo: b.billNo } : q));
  applyStock(deltas);
  return wait(b);
};

// ---- admin: clean up / delete a client (only the demo owner has data) ----
export const getClientDataCounts = async (uid: string) =>
  wait(
    uid === UID
      ? { bills: bills.length, quotations: quotations.length, products: products.length, customers: customers.length }
      : { bills: 0, quotations: 0, products: 0, customers: 0 }
  );
export const cleanupClientData = async (uid: string) => {
  if (uid === UID) {
    bills = [];
    quotations = [];
    products = [];
    customers = [];
  }
  await wait(null);
};
export const deleteClientAccount = async (uid: string) => {
  await cleanupClientData(uid);
  accounts = accounts.map((a) => (a.uid === uid ? { ...a, status: 'deleted' as const, deletedAt: new Date() } : a));
  await wait(null);
};
