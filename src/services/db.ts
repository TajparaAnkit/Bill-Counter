import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  serverTimestamp,
  Timestamp,
  increment,
  deleteField,
  WriteBatch,
  getCountFromServer
} from 'firebase/firestore';
import { db } from './firebase';
import { Product, Bill, BillPayment, UserProfile, PublicProfile, Customer, Account, Quotation } from '../types';
import { TRIAL_DAYS } from '../config/features';
import { summarizePayments } from '../utils/payment';

// Cloudinary config (free plan — no Firebase Blaze billing required).
// Change these to your own Cloudinary cloud name + an UNSIGNED upload preset.
const CLOUDINARY_CLOUD_NAME = 'gwegtq0e';
const CLOUDINARY_UPLOAD_PRESET = 'naitu_products';

/**
 * Uploads an image to Cloudinary using an unsigned upload preset and returns
 * the hosted secure URL. Works entirely from the browser, no billing needed.
 */
export const uploadImageToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  // Cloudinary returns a JSON body with the precise reason on failure.
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const reason = data?.error?.message || `HTTP ${response.status}`;
    console.error('Cloudinary upload error:', reason, data);
    throw new Error(reason);
  }

  return data.secure_url as string;
};

// Recursively remove `undefined` values (Firestore rejects them). Leaves
// Firestore sentinels (serverTimestamp etc.), Dates and primitives untouched.
const stripUndefined = <T,>(value: T): T => {
  if (Array.isArray(value)) return value.map((v) => stripUndefined(v)) as any;
  if (value && typeof value === 'object') {
    const proto = Object.getPrototypeOf(value);
    if (proto === Object.prototype || proto === null) {
      const out: Record<string, any> = {};
      Object.entries(value as any).forEach(([k, v]) => {
        if (v !== undefined) out[k] = stripUndefined(v);
      });
      return out as T;
    }
  }
  return value;
};

// ==========================================
// BUSINESS PROFILE SETTINGS
// ==========================================

export const getBusinessProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting business profile:', error);
    return null;
  }
};

export const updateBusinessProfile = async (userId: string, data: Partial<UserProfile>): Promise<void> => {
  const docRef = doc(db, 'users', userId);
  await setDoc(docRef, stripUndefined({
    ...data,
    uid: userId,
    updatedAt: serverTimestamp()
  }), { merge: true });

  // Mirror only public-safe fields to the publicly readable catalog profile.
  const publicData: Record<string, any> = { userId, updatedAt: serverTimestamp() };
  if (data.businessName !== undefined) publicData.businessName = data.businessName;
  if (data.phone !== undefined) publicData.phone = data.phone;
  if (data.upiId !== undefined) publicData.upiId = data.upiId;
  if (data.tagline !== undefined) publicData.tagline = data.tagline;
  if (data.catalogTheme !== undefined) publicData.catalogTheme = data.catalogTheme;
  if (data.logoUrl !== undefined) publicData.logoUrl = data.logoUrl;
  await setDoc(doc(db, 'publicProfiles', userId), publicData, { merge: true });
};

// Public storefront: anyone can read a seller's catalog (profile + products).
export const getPublicCatalog = async (
  userId: string
): Promise<{ profile: PublicProfile | null; products: Product[] }> => {
  const profileSnap = await getDoc(doc(db, 'publicProfiles', userId));
  const profile = profileSnap.exists() ? (profileSnap.data() as PublicProfile) : null;

  const q = query(
    collection(db, 'products'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  const products: Product[] = [];
  snap.forEach((d) => products.push({ id: d.id, ...d.data() } as Product));

  return { profile, products };
};

// ==========================================
// PRODUCTS CRUD
// ==========================================

export const getProducts = async (userId: string): Promise<Product[]> => {
  try {
    const q = query(
      collection(db, 'products'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const products: Product[] = [];
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() } as Product);
    });
    return products;
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
};

// Stock settings from the product form. `stock: null` = stop tracking.
export interface StockInput {
  stock: number | null;
  lowStock: number | null;
}

export const addProduct = async (
  userId: string,
  name: string,
  price: number,
  imageFile?: File | null,
  hsn?: string,
  unit?: string,
  stockInput?: StockInput
): Promise<Product> => {
  const productRef = doc(collection(db, 'products'));
  const productId = productRef.id;
  let imageUrl = '';

  if (imageFile) {
    try {
      imageUrl = await uploadImageToCloudinary(imageFile);
    } catch (err) {
      console.error('Failed to upload image to Cloudinary, saving without image:', err);
      // Fallback: save without image
    }
  }

  const productData = {
    id: productId,
    userId,
    name,
    price,
    imageUrl,
    hsn: (hsn || '').trim(),
    unit: (unit || 'PCS').trim().toUpperCase(),
    ...(stockInput?.stock != null ? { stock: stockInput.stock, lowStock: stockInput.lowStock ?? 0 } : {}),
    createdAt: serverTimestamp()
  };

  await setDoc(productRef, productData);
  return { ...productData, createdAt: new Date() };
};

export const updateProduct = async (
  _userId: string,
  productId: string,
  name: string,
  price: number,
  imageUrl?: string,
  newImageFile?: File | null,
  hsn?: string,
  unit?: string,
  stockInput?: StockInput
): Promise<void> => {
  const productRef = doc(db, 'products', productId);
  let updatedImageUrl = imageUrl || '';

  if (newImageFile) {
    try {
      updatedImageUrl = await uploadImageToCloudinary(newImageFile);
    } catch (err) {
      console.error('Failed to upload new image to Cloudinary:', err);
      // Keep existing image URL on error
    }
  }

  await updateDoc(productRef, {
    name,
    price,
    imageUrl: updatedImageUrl,
    hsn: (hsn || '').trim(),
    unit: (unit || 'PCS').trim().toUpperCase(),
    ...(stockInput
      ? stockInput.stock != null
        ? { stock: stockInput.stock, lowStock: stockInput.lowStock ?? 0 }
        : { stock: deleteField(), lowStock: deleteField() }
      : {}),
    updatedAt: serverTimestamp()
  });
};

export const deleteProduct = async (productId: string): Promise<void> => {
  const productRef = doc(db, 'products', productId);
  await deleteDoc(productRef);
};

// Deletes many products in one atomic batch (Firestore caps a batch at 500 ops).
export const bulkDeleteProducts = async (productIds: string[]): Promise<void> => {
  const CHUNK = 500;
  for (let i = 0; i < productIds.length; i += CHUNK) {
    const batch = writeBatch(db);
    productIds.slice(i, i + CHUNK).forEach((id) => {
      batch.delete(doc(db, 'products', id));
    });
    await batch.commit();
  }
};

export const bulkImportProducts = async (
  userId: string,
  items: { name: string; price: number; imageUrl?: string; hsn?: string; unit?: string; taxRate?: number; stock?: number; lowStock?: number }[]
): Promise<void> => {
  const batch = writeBatch(db);

  items.forEach((item) => {
    const productRef = doc(collection(db, 'products'));
    batch.set(productRef, {
      id: productRef.id,
      userId,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl || '',
      hsn: (item.hsn || '').trim(),
      unit: (item.unit || 'PCS').trim().toUpperCase(),
      ...(item.taxRate != null ? { taxRate: item.taxRate } : {}),
      ...(item.stock != null ? { stock: item.stock, lowStock: item.lowStock ?? 0 } : {}),
      createdAt: serverTimestamp()
    });
  });

  await batch.commit();
};

// ==========================================
// BILLS MANAGEMENT
// ==========================================

export const getBills = async (userId: string): Promise<Bill[]> => {
  try {
    const q = query(
      collection(db, 'bills'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const bills: Bill[] = [];
    querySnapshot.forEach((doc) => {
      bills.push({ id: doc.id, ...doc.data() } as Bill);
    });
    return bills;
  } catch (error) {
    console.error('Error getting bills:', error);
    throw error;
  }
};

export const getNextBillNumber = async (
  userId: string,
  prefix = 'INV'
): Promise<{ billNo: string; billSeqNum: number }> => {
  const safePrefix = (prefix || 'INV').trim() || 'INV';
  try {
    const q = query(
      collection(db, 'bills'),
      where('userId', '==', userId),
      orderBy('billSeqNum', 'desc'),
      limit(1)
    );
    const querySnapshot = await getDocs(q);

    let lastSeqNum = 0;
    if (!querySnapshot.empty) {
      const lastBill = querySnapshot.docs[0].data() as Bill;
      lastSeqNum = lastBill.billSeqNum || 0;
    }

    const nextSeqNum = lastSeqNum + 1;
    // Format: INV-0001, INV-0002, etc. (prefix configurable in Settings)
    const billNo = `${safePrefix}-${String(nextSeqNum).padStart(4, '0')}`;
    return { billNo, billSeqNum: nextSeqNum };
  } catch (error) {
    console.error('Error calculating next bill number:', error);
    const fallbackSeq = Date.now();
    return { billNo: `${safePrefix}-${fallbackSeq}`, billSeqNum: fallbackSeq };
  }
};

// Stock changes (see utils/stock.ts stockDeltas) are written in the same
// batch as the bill, so stock and invoices never drift apart.
export type StockDeltas = Record<string, number>;

const addStockOps = (batch: WriteBatch, deltas: StockDeltas = {}) => {
  Object.entries(deltas).forEach(([productId, change]) => {
    if (change) batch.update(doc(db, 'products', productId), { stock: increment(change), updatedAt: serverTimestamp() });
  });
};

export const addBill = async (
  userId: string,
  billData: Omit<Bill, 'id' | 'userId' | 'createdAt'>,
  deltas?: StockDeltas
): Promise<Bill> => {
  const billRef = doc(collection(db, 'bills'));
  const finalBill: Bill = {
    ...billData,
    id: billRef.id,
    userId,
    createdAt: serverTimestamp()
  };

  // Firestore rejects `undefined` field values (including nested ones inside
  // billTo/shipTo/items) — strip them deeply before writing.
  const batch = writeBatch(db);
  batch.set(billRef, stripUndefined(finalBill));
  addStockOps(batch, deltas);
  await batch.commit();
  return { ...finalBill, createdAt: new Date() };
};

// Replaces an invoice's contents; keeps its id, owner and creation time.
export const updateBill = async (
  bill: Bill,
  billData: Omit<Bill, 'id' | 'userId' | 'createdAt'>,
  deltas?: StockDeltas
): Promise<Bill> => {
  const updated: Bill = { ...billData, id: bill.id, userId: bill.userId, createdAt: bill.createdAt };
  const batch = writeBatch(db);
  batch.set(doc(db, 'bills', bill.id), stripUndefined({ ...updated, updatedAt: serverTimestamp() }));
  addStockOps(batch, deltas);
  await batch.commit();
  return updated;
};

// Cancel (or restore) an invoice. Its number stays used so the series has no gaps.
export const setBillCancelled = async (bill: Bill, cancelled: boolean, deltas?: StockDeltas): Promise<Bill> => {
  const batch = writeBatch(db);
  batch.update(doc(db, 'bills', bill.id), {
    cancelled,
    cancelledAt: cancelled ? serverTimestamp() : null,
    updatedAt: serverTimestamp(),
  });
  addStockOps(batch, deltas);
  await batch.commit();
  return { ...bill, cancelled, cancelledAt: cancelled ? new Date() : null };
};

export const deleteBill = async (billId: string, deltas?: StockDeltas): Promise<void> => {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'bills', billId));
  addStockOps(batch, deltas);
  await batch.commit();
};

// Replaces a bill's payment list and the fields derived from it (amountPaid,
// status, method, paidAt). Returns the updated bill for local state.
export const saveBillPayments = async (bill: Bill, payments: BillPayment[]): Promise<Bill> => {
  const summary = summarizePayments(bill.total || 0, payments);
  await updateDoc(doc(db, 'bills', bill.id), {
    payments: stripUndefined(summary.payments),
    amountPaid: summary.amountPaid,
    paymentStatus: summary.paymentStatus,
    paymentMethod: summary.paymentMethod || null,
    paidAt: summary.paidAt,
    updatedAt: serverTimestamp(),
  });
  return { ...bill, ...summary, paymentMethod: summary.paymentMethod, paidAt: summary.paidAt || undefined };
};

// ==========================================
// CUSTOMERS CRUD
// ==========================================

export const getCustomers = async (userId: string): Promise<Customer[]> => {
  try {
    // Filter by userId only (uses the automatic single-field index), then sort
    // by name client-side. This avoids needing a composite Firestore index.
    const q = query(collection(db, 'customers'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const customers: Customer[] = [];
    querySnapshot.forEach((docSnap) => {
      customers.push({ id: docSnap.id, ...docSnap.data() } as Customer);
    });
    customers.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    return customers;
  } catch (error) {
    console.error('Error getting customers:', error);
    throw error;
  }
};

export const getCustomer = async (customerId: string): Promise<Customer | null> => {
  const snap = await getDoc(doc(db, 'customers', customerId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Customer) : null;
};

export type CustomerInput = Omit<Customer, 'id' | 'userId' | 'createdAt'>;

// Firestore rejects `undefined` values — drop them, and normalise optional
// strings to '' so legacy readers keep working.
const buildCustomerData = (data: CustomerInput): Record<string, any> => {
  const out: Record<string, any> = {
    name: data.name,
    phone: data.phone || '',
    email: data.email || '',
    address: data.address || '',
    partyType: data.partyType || 'customer',
    category: data.category || '',
    gstin: (data.gstin || '').toUpperCase(),
    pan: (data.pan || '').toUpperCase(),
    shippingAddress: data.shippingSameAsBilling ? data.address || '' : data.shippingAddress || '',
    shippingSameAsBilling: data.shippingSameAsBilling !== false,
    openingBalance: Math.max(0, data.openingBalance || 0),
    openingBalanceType: data.openingBalanceType || 'to_collect',
    creditPeriod: Math.max(0, data.creditPeriod || 0),
    creditLimit: Math.max(0, data.creditLimit || 0),
  };
  Object.keys(out).forEach((k) => out[k] === undefined && delete out[k]);
  return out;
};

export const addCustomer = async (
  userId: string,
  data: CustomerInput
): Promise<Customer> => {
  const customerRef = doc(collection(db, 'customers'));
  const customerData = {
    id: customerRef.id,
    userId,
    ...buildCustomerData(data),
    createdAt: serverTimestamp(),
  };
  await setDoc(customerRef, customerData);
  return { ...(customerData as any), createdAt: new Date() } as Customer;
};

export const updateCustomer = async (
  customerId: string,
  data: CustomerInput
): Promise<void> => {
  const customerRef = doc(db, 'customers', customerId);
  await updateDoc(customerRef, {
    ...buildCustomerData(data),
    updatedAt: serverTimestamp(),
  });
};

export const deleteCustomer = async (customerId: string): Promise<void> => {
  const customerRef = doc(db, 'customers', customerId);
  await deleteDoc(customerRef);
};

// ==========================================
// CLIENT ACCOUNTS (plan, validity, features)
// ==========================================

const toAccount = (data: any): Account => ({
  ...data,
  validTill: data.validTill?.toDate ? data.validTill.toDate() : new Date(data.validTill),
});

// Loads the signed-in client's account, creating the free trial on first use
// (new signups and clients who registered before plans existed).
export const getOrCreateAccount = async (userId: string, email: string, businessName?: string): Promise<Account> => {
  const ref = doc(db, 'accounts', userId);
  const snap = await getDoc(ref);
  if (snap.exists()) return toAccount(snap.data());

  // Only these fields may be set by the client (see firestore.rules).
  const trial = {
    uid: userId,
    email,
    businessName: businessName || '',
    plan: 'trial',
    status: 'active',
    validTill: Timestamp.fromMillis(Date.now() + TRIAL_DAYS * 86_400_000),
    createdAt: serverTimestamp(),
  };
  await setDoc(ref, trial);
  return toAccount(trial);
};

// True when `admins/{uid}` exists. Admins are added by hand in the Firebase Console.
export const isAdminUser = async (userId: string): Promise<boolean> => {
  try {
    return (await getDoc(doc(db, 'admins', userId))).exists();
  } catch {
    return false;
  }
};

// ---- Admin only (rules reject everyone else) ----

export const listAccounts = async (): Promise<Account[]> => {
  const [accSnap, userSnap] = await Promise.all([getDocs(collection(db, 'accounts')), getDocs(collection(db, 'users'))]);
  const names = new Map<string, string>();
  userSnap.forEach((d) => names.set(d.id, (d.data() as UserProfile).businessName || ''));
  const out: Account[] = [];
  accSnap.forEach((d) => {
    const a = toAccount(d.data());
    out.push({ ...a, businessName: names.get(d.id) || a.businessName });
  });
  return out.sort((a, b) => a.validTill.getTime() - b.validTill.getTime());
};

export const getClientAccount = async (userId: string): Promise<Account | null> => {
  const [accSnap, userSnap] = await Promise.all([getDoc(doc(db, 'accounts', userId)), getDoc(doc(db, 'users', userId))]);
  if (!accSnap.exists()) return null;
  const a = toAccount(accSnap.data());
  return { ...a, businessName: (userSnap.data() as UserProfile | undefined)?.businessName || a.businessName };
};

export const updateAccount = async (
  userId: string,
  data: Pick<Account, 'plan' | 'status' | 'validTill' | 'features' | 'notes' | 'invoice'>,
  catalogEnabled: boolean
): Promise<void> => {
  await updateDoc(doc(db, 'accounts', userId), stripUndefined({
    ...data,
    validTill: Timestamp.fromDate(data.validTill),
    updatedAt: serverTimestamp(),
  }));
  // The public storefront can't read `accounts`, so the catalog flag is mirrored here.
  await setDoc(doc(db, 'publicProfiles', userId), { userId, catalogEnabled }, { merge: true });
};

// ==========================================
// QUOTATIONS (same shape as a bill, own collection and number series)
// ==========================================

export const getQuotations = async (userId: string): Promise<Quotation[]> => {
  const q = query(collection(db, 'quotations'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  const out: Quotation[] = [];
  snap.forEach((d) => out.push({ id: d.id, ...d.data() } as Quotation));
  return out;
};

export const getQuotation = async (quotationId: string): Promise<Quotation | null> => {
  const snap = await getDoc(doc(db, 'quotations', quotationId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Quotation) : null;
};

export const getNextQuotationNumber = async (userId: string, prefix = 'QT'): Promise<{ billNo: string; billSeqNum: number }> => {
  const safePrefix = (prefix || 'QT').trim() || 'QT';
  const q = query(collection(db, 'quotations'), where('userId', '==', userId), orderBy('billSeqNum', 'desc'), limit(1));
  const snap = await getDocs(q);
  const next = (snap.empty ? 0 : (snap.docs[0].data() as Quotation).billSeqNum || 0) + 1;
  return { billNo: `${safePrefix}-${String(next).padStart(4, '0')}`, billSeqNum: next };
};

export const addQuotation = async (userId: string, data: Omit<Quotation, 'id' | 'userId' | 'createdAt'>): Promise<Quotation> => {
  const ref = doc(collection(db, 'quotations'));
  const quotation: Quotation = { ...data, docType: 'quotation', id: ref.id, userId, createdAt: serverTimestamp() };
  await setDoc(ref, stripUndefined(quotation));
  return { ...quotation, createdAt: new Date() };
};

export const updateQuotation = async (quotation: Quotation, data: Omit<Quotation, 'id' | 'userId' | 'createdAt'>): Promise<Quotation> => {
  const updated: Quotation = { ...data, docType: 'quotation', id: quotation.id, userId: quotation.userId, createdAt: quotation.createdAt };
  await setDoc(doc(db, 'quotations', quotation.id), stripUndefined({ ...updated, updatedAt: serverTimestamp() }));
  return updated;
};

export const deleteQuotation = async (quotationId: string): Promise<void> => {
  await deleteDoc(doc(db, 'quotations', quotationId));
};

// Saves the invoice made from a quotation and links the two, atomically.
export const convertQuotationToBill = async (
  userId: string,
  quotation: Quotation,
  billData: Omit<Bill, 'id' | 'userId' | 'createdAt'>,
  deltas?: StockDeltas
): Promise<Bill> => {
  const billRef = doc(collection(db, 'bills'));
  const bill: Bill = {
    ...billData,
    fromQuotationId: quotation.id,
    fromQuotationNo: quotation.billNo,
    id: billRef.id,
    userId,
    createdAt: serverTimestamp(),
  };
  const batch = writeBatch(db);
  batch.set(billRef, stripUndefined(bill));
  batch.update(doc(db, 'quotations', quotation.id), { convertedBillId: billRef.id, convertedBillNo: bill.billNo, updatedAt: serverTimestamp() });
  addStockOps(batch, deltas);
  await batch.commit();
  return { ...bill, createdAt: new Date() };
};

// ==========================================
// ADMIN: clean up or delete a client (admin only; see firestore.rules)
// ==========================================

// Everything a client creates; business settings (users/…), plan and validity (accounts/…) are separate.
const CLIENT_DATA = ['bills', 'quotations', 'products', 'customers'] as const;
export type ClientDataCounts = Record<(typeof CLIENT_DATA)[number], number>;

export const getClientDataCounts = async (userId: string): Promise<ClientDataCounts> => {
  const counts = await Promise.all(
    CLIENT_DATA.map(async (c) => (await getCountFromServer(query(collection(db, c), where('userId', '==', userId)))).data().count)
  );
  return Object.fromEntries(CLIENT_DATA.map((c, i) => [c, counts[i]])) as ClientDataCounts;
};

// Deletes the client's invoices, quotations, products and customers (batches of 400).
export const cleanupClientData = async (userId: string): Promise<void> => {
  for (const c of CLIENT_DATA) {
    const snap = await getDocs(query(collection(db, c), where('userId', '==', userId)));
    for (let i = 0; i < snap.docs.length; i += 400) {
      const batch = writeBatch(db);
      snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }
};

// Removes all the client's data including business settings, and marks the account deleted.
// The accounts/{uid} record is kept (status 'deleted') so the same login can't start a new
// free trial; the login itself can only be removed in Firebase Console → Authentication.
export const deleteClientAccount = async (userId: string): Promise<void> => {
  await cleanupClientData(userId);
  const batch = writeBatch(db);
  batch.delete(doc(db, 'users', userId));
  batch.delete(doc(db, 'publicProfiles', userId));
  batch.update(doc(db, 'accounts', userId), { status: 'deleted', deletedAt: serverTimestamp(), updatedAt: serverTimestamp() });
  await batch.commit();
};
