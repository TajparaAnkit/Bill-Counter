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
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { Product, Bill, UserProfile, Customer, PaymentStatus, PaymentMethod } from '../types';

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
      const storageRef = ref(storage, `products/${userId}/${productId}`);
      const snapshot = await uploadBytes(storageRef, imageFile);
      imageUrl = await getDownloadURL(snapshot.ref);
    } catch (err) {
      console.error('Failed to upload image to Firebase Storage, saving without image:', err);
      // Fallback: we could read as base64 or just leave empty
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
  userId: string,
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
      const storageRef = ref(storage, `products/${userId}/${productId}`);
      const snapshot = await uploadBytes(storageRef, newImageFile);
      updatedImageUrl = await getDownloadURL(snapshot.ref);
    } catch (err) {
      console.error('Failed to upload new image:', err);
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
