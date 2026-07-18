export interface Product {
  id: string;
  userId: string;
  name: string;
  price: number;
  imageUrl?: string;
  createdAt: any; // Firestore Timestamp or Date
}

export interface BillItem {
  productId?: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export type PaymentStatus = 'paid' | 'partial' | 'unpaid';
export type PaymentMethod = 'cash' | 'upi' | 'card' | 'bank' | 'other';

export interface Bill {
  id: string;
  userId: string;
  billNo: string;
  billSeqNum: number;
  customerName: string;
  customerId?: string;
  customerPhone?: string;
  items: BillItem[];
  subtotal: number;
  discount?: number; // discount amount in ₹ applied to the bill (optional)
  taxRate?: number; // tax/GST percentage applied, e.g. 18 (optional)
  tax: number; // computed tax amount in ₹
  total: number;
  // Payment tracking
  paymentStatus: PaymentStatus;
  amountPaid: number;
  paymentMethod?: PaymentMethod;
  paidAt?: any; // Firestore Timestamp or Date
  createdAt: any; // Firestore Timestamp or Date
  notes?: string;
}

export interface Customer {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: any; // Firestore Timestamp or Date
}

export interface UserProfile {
  uid: string;
  email: string;
  businessName: string;
  address?: string;
  phone?: string;
  invoiceNotes?: string;
  upiId?: string; // e.g. yourname@okhdfcbank — used to generate the invoice payment QR
  billPrefix?: string; // invoice number prefix, e.g. "INV" -> INV-0001
  // Tax / GST (all optional — off by default)
  taxEnabled?: boolean; // when true, invoices can apply a tax rate
  defaultTaxRate?: number; // default GST % prefilled on new invoices, e.g. 18
  gstin?: string; // GST identification number shown on invoices
  createdAt: any; // Firestore Timestamp or Date
}
