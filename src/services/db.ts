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
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Product, Bill, UserProfile, PublicProfile, Customer, PaymentStatus, PaymentMethod } from '../types';

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
  await setDoc(docRef, {
    ...data,
    uid: userId,
    updatedAt: serverTimestamp()
  }, { merge: true });

  // Mirror only public-safe fields to the publicly readable catalog profile.
  const publicData: Record<string, any> = { userId, updatedAt: serverTimestamp() };
  if (data.businessName !== undefined) publicData.businessName = data.businessName;
  if (data.phone !== undefined) publicData.phone = data.phone;
  if (data.upiId !== undefined) publicData.upiId = data.upiId;
  if (data.tagline !== undefined) publicData.tagline = data.tagline;
  if (data.catalogTheme !== undefined) publicData.catalogTheme = data.catalogTheme;
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

export const addProduct = async (
  userId: string,
  name: string,
  price: number,
  imageFile?: File | null
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
  newImageFile?: File | null
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
  items: { name: string; price: number; imageUrl?: string }[]
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

export const addBill = async (
  userId: string,
  billData: Omit<Bill, 'id' | 'userId' | 'createdAt'>
): Promise<Bill> => {
  const billRef = doc(collection(db, 'bills'));
  const finalBill: Bill = {
    ...billData,
    id: billRef.id,
    userId,
    createdAt: serverTimestamp()
  };

  // Firestore rejects `undefined` field values — strip them before writing.
  const sanitized: Record<string, any> = {};
  Object.entries(finalBill).forEach(([k, v]) => {
    if (v !== undefined) sanitized[k] = v;
  });

  await setDoc(billRef, sanitized);
  return { ...finalBill, createdAt: new Date() };
};

export const deleteBill = async (billId: string): Promise<void> => {
  const billRef = doc(db, 'bills', billId);
  await deleteDoc(billRef);
};

export const updateBillPayment = async (
  billId: string,
  payment: {
    paymentStatus: PaymentStatus;
    amountPaid: number;
    paymentMethod?: PaymentMethod;
  }
): Promise<void> => {
  const billRef = doc(db, 'bills', billId);
  await updateDoc(billRef, {
    paymentStatus: payment.paymentStatus,
    amountPaid: payment.amountPaid,
    paymentMethod: payment.paymentMethod || null,
    paidAt: payment.paymentStatus === 'paid' ? serverTimestamp() : null,
    updatedAt: serverTimestamp(),
  });
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

export const addCustomer = async (
  userId: string,
  data: { name: string; phone?: string; email?: string; address?: string }
): Promise<Customer> => {
  const customerRef = doc(collection(db, 'customers'));
  const customerData = {
    id: customerRef.id,
    userId,
    name: data.name,
    phone: data.phone || '',
    email: data.email || '',
    address: data.address || '',
    createdAt: serverTimestamp(),
  };
  await setDoc(customerRef, customerData);
  return { ...customerData, createdAt: new Date() };
};

export const updateCustomer = async (
  customerId: string,
  data: { name: string; phone?: string; email?: string; address?: string }
): Promise<void> => {
  const customerRef = doc(db, 'customers', customerId);
  await updateDoc(customerRef, {
    name: data.name,
    phone: data.phone || '',
    email: data.email || '',
    address: data.address || '',
    updatedAt: serverTimestamp(),
  });
};

export const deleteCustomer = async (customerId: string): Promise<void> => {
  const customerRef = doc(db, 'customers', customerId);
  await deleteDoc(customerRef);
};
