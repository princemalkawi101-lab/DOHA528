import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from './firebase';

export type PurchaseKind = 'course' | 'workshop' | 'recorded' | 'individual-online';

export interface Purchase {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  itemId: string;
  itemTitleAr: string;
  itemTitleEn: string;
  itemKind: PurchaseKind;
  paidJod: number;
  status: 'pending';
  createdAt: Timestamp | null;
}

export interface NewPurchase {
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  itemId: string;
  itemTitleAr: string;
  itemTitleEn: string;
  itemKind: PurchaseKind;
  paidJod: number;
}

export async function savePurchase(data: NewPurchase): Promise<string> {
  const ref = await addDoc(collection(db, 'purchases'), {
    ...data,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function fetchAllPurchases(): Promise<Purchase[]> {
  const snap = await getDocs(
    query(collection(db, 'purchases'), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Purchase, 'id'>),
  }));
}

export async function fetchUserPurchases(userId: string): Promise<Purchase[]> {
  const snap = await getDocs(
    query(
      collection(db, 'purchases'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )
  );
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Purchase, 'id'>),
  }));
}

export async function deletePurchase(id: string): Promise<void> {
  await deleteDoc(doc(db, 'purchases', id));
}
