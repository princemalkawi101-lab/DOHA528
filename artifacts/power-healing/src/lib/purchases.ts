import { collection, deleteDoc, doc, getDocs, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { db } from './firebase';
import { readJson, serverApi } from './serverApi';

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

export async function fetchAllPurchases(): Promise<Purchase[]> {
  const [serverResult, legacyResult] = await Promise.allSettled([
    readJson<Array<Omit<Purchase, 'createdAt'> & { createdAt: string }>>(await serverApi('/api/admin/purchases')),
    getDocs(query(collection(db, 'purchases'), orderBy('createdAt', 'desc'))),
  ]);
  if (serverResult.status === 'rejected' && legacyResult.status === 'rejected') {
    throw new Error('Unable to load purchases from either data source');
  }
  const rows = serverResult.status === 'fulfilled' ? serverResult.value : [];
  const legacyDocs = legacyResult.status === 'fulfilled' ? legacyResult.value.docs : [];
  return [
    ...rows.map((row) => ({ ...row, paidJod: Number(row.paidJod), createdAt: Timestamp.fromDate(new Date(row.createdAt)) })),
    ...legacyDocs.map((entry) => ({ id: entry.id, ...(entry.data() as Omit<Purchase, 'id'>) })),
  ];
}

export async function fetchUserPurchases(userId: string): Promise<Purchase[]> {
  const [serverResult, legacyResult] = await Promise.allSettled([
    readJson<Array<Omit<Purchase, 'createdAt'> & { createdAt: string }>>(await serverApi('/api/purchases/me')),
    getDocs(query(collection(db, 'purchases'), where('userId', '==', userId), orderBy('createdAt', 'desc'))),
  ]);
  if (serverResult.status === 'rejected' && legacyResult.status === 'rejected') {
    throw new Error('Unable to load purchases from either data source');
  }
  const rows = serverResult.status === 'fulfilled' ? serverResult.value : [];
  const legacyDocs = legacyResult.status === 'fulfilled' ? legacyResult.value.docs : [];
  return [
    ...rows.map((row) => ({ ...row, paidJod: Number(row.paidJod), createdAt: Timestamp.fromDate(new Date(row.createdAt)) })),
    ...legacyDocs.map((entry) => ({ id: entry.id, ...(entry.data() as Omit<Purchase, 'id'>) })),
  ];
}

export async function deletePurchase(id: string): Promise<void> {
  const response = await serverApi(`/api/admin/purchases/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (response.status === 404) {
    await deleteDoc(doc(db, 'purchases', id));
    return;
  }
  await readJson(response);
}
