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

export interface Bill {
  id: string;
  userId: string;
  billNo: string;
  billSeqNum: number;
  customerName: string;
  items: BillItem[];
  subtotal: number;
  tax: number;
  total: number;
  createdAt: any; // Firestore Timestamp or Date
  notes?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  businessName: string;
  address?: string;
  phone?: string;
  invoiceNotes?: string;
  createdAt: any; // Firestore Timestamp or Date
}

