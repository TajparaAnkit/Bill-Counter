export interface Product {
  id: string;
  userId: string;
  name: string;
  price: number;
  imageUrl?: string;
  // GST fields (optional — used to prefill invoice line items)
  hsn?: string; // HSN / SAC code
  unit?: string; // e.g. PCS, KGS, MTR
  taxRate?: number; // default GST % for this product
  createdAt: any; // Firestore Timestamp or Date
}

export interface BillItem {
  productId?: string;
  productName: string;
  description?: string;
  hsn?: string;
  unit?: string;
  quantity: number;
  price: number; // price per unit (before tax)
  // Per-line discount (optional). `discount` is the ₹ amount actually applied.
  discount?: number;
  discountPercent?: number;
  // Per-line tax (optional)
  taxRate?: number; // GST % for this line
  taxable?: number; // qty*price - discount
  taxAmount?: number; // taxable * taxRate/100
  total: number; // line amount. New bills: taxable + taxAmount. Legacy bills: qty*price.
}

export type PaymentStatus = 'paid' | 'partial' | 'unpaid';
export type PaymentMethod = 'cash' | 'upi' | 'card' | 'bank' | 'other';

// Snapshot of the party at the time of billing so later edits to the customer
// don't rewrite historical invoices.
export interface PartySnapshot {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  pan?: string;
}

export interface AdditionalCharge {
  label: string;
  amount: number;
}

export interface Bill {
  id: string;
  userId: string;
  billNo: string;
  billSeqNum: number;
  billPrefix?: string;
  customerName: string;
  customerId?: string;
  customerPhone?: string;
  items: BillItem[];
  subtotal: number; // sum of line totals
  discount?: number; // total discount in ₹ (line-level + bill-level) — kept for legacy readers
  taxRate?: number; // bill-wide tax % (legacy). Set only when all lines share one rate.
  tax: number; // total tax amount in ₹
  total: number; // grand total actually payable
  // Payment tracking
  paymentStatus: PaymentStatus;
  amountPaid: number;
  paymentMethod?: PaymentMethod;
  paidAt?: any; // Firestore Timestamp or Date
  createdAt: any; // Firestore Timestamp or Date
  notes?: string;

  // ---- GST-style invoice fields (all optional; absent on legacy bills) ----
  invoiceDate?: string; // ISO date (yyyy-mm-dd) chosen by the user
  dueDate?: string; // ISO date
  paymentTerms?: number; // days
  vehicleNo?: string;
  placeOfSupply?: string; // state name
  billTo?: PartySnapshot;
  shipTo?: PartySnapshot;
  taxableAmount?: number; // sum of line taxable amounts
  itemDiscount?: number; // sum of line discounts
  billDiscount?: number; // bill-level discount applied after tax
  cgst?: number;
  sgst?: number;
  igst?: number;
  additionalCharges?: AdditionalCharge[];
  roundOff?: number; // signed amount added to reach a whole rupee
  termsAndConditions?: string;
  showBankDetails?: boolean;
  showPaymentQr?: boolean;
}

export type PartyType = 'customer' | 'supplier';
export type OpeningBalanceType = 'to_collect' | 'to_pay';

export interface Customer {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string; // billing address
  // ---- Party details (optional; absent on legacy customers) ----
  partyType?: PartyType; // defaults to 'customer'
  category?: string;
  gstin?: string;
  pan?: string;
  shippingAddress?: string;
  shippingSameAsBilling?: boolean;
  openingBalance?: number;
  openingBalanceType?: OpeningBalanceType;
  creditPeriod?: number; // days
  creditLimit?: number; // ₹
  createdAt: any; // Firestore Timestamp or Date
}

// Public-safe subset of the profile, mirrored to the `publicProfiles` collection
// and readable by anyone for the shareable storefront catalog.
export interface PublicProfile {
  userId: string;
  businessName: string;
  phone?: string;        // used for "Order on WhatsApp"
  upiId?: string;        // optional, shown as a pay-to hint
  tagline?: string;      // optional short shop description
  catalogTheme?: string; // chosen storefront theme id (see catalogThemes.ts)
  logoUrl?: string;      // optional shop logo
  updatedAt?: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  businessName: string;
  address?: string;
  phone?: string;
  invoiceNotes?: string; // default Terms & Conditions printed on invoices
  upiId?: string; // e.g. yourname@okhdfcbank — used to generate the invoice payment QR
  billPrefix?: string; // invoice number prefix, e.g. "INV" -> INV-0001
  // Tax / GST (all optional — off by default)
  taxEnabled?: boolean; // when true, invoices can apply a tax rate
  defaultTaxRate?: number; // default GST % prefilled on new invoices, e.g. 18
  gstin?: string; // GST identification number shown on invoices
  state?: string; // business state — decides CGST+SGST (same state) vs IGST
  // Manage Business (all optional)
  companyEmail?: string; // shown on invoices; defaults to the account email
  city?: string;
  pincode?: string;
  gstRegistered?: boolean; // false hides GSTIN on invoices; undefined => derived from gstin
  pan?: string;
  businessTypes?: string[]; // e.g. ['Wholesaler', 'Distributor']
  industryType?: string;
  registrationType?: string; // e.g. 'One Person Company'
  logoUrl?: string; // Cloudinary URL; falls back to the Bill Counter mark
  signatureUrl?: string; // Cloudinary URL; printed above "Authorised Signature"
  businessDetails?: { label: string; value: string }[]; // extra lines printed on invoices (MSME, Website…)
  // Bank details printed on invoices (optional)
  bankName?: string;
  bankAccountNo?: string;
  bankIfsc?: string;
  bankBranch?: string;
  bankAccountHolder?: string;
  // Public storefront catalog
  tagline?: string; // short shop description shown on the catalog
  catalogTheme?: string; // chosen catalog theme id (see catalogThemes.ts)
  createdAt: any; // Firestore Timestamp or Date
}
