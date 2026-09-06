import { readJson, serverApi } from './serverApi';
import { collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export type BookingStatus = 'pending' | 'completed' | 'cancelled';

export type Booking = {
  itemId: string;
  purchaseVariant?: 'standard' | 'vip';
  itemTitleAr: string;
  itemTitleEn: string;
  buyerUid: string | null;
  buyerEmail: string | null;
  name: string;
  description: string;
  whatsappCountryCode: string;
  whatsappNumber: string;
  sessionDate?: string;
  sessionTime?: string;
};

export type StoredBooking = Booking & {
  id: string;
  status: BookingStatus;
  createdAt: string;
};

export async function fetchAllBookings(): Promise<StoredBooking[]> {
  const [serverResult, legacyResult] = await Promise.allSettled([
    readJson<StoredBooking[]>(await serverApi('/api/admin/bookings')),
    getDocs(query(collection(db, 'bookings'), orderBy('createdAt', 'desc'))),
  ]);
  if (serverResult.status === 'rejected' && legacyResult.status === 'rejected') {
    throw new Error('Unable to load bookings from either data source');
  }
  const serverRows = serverResult.status === 'fulfilled' ? serverResult.value : [];
  const legacyDocs = legacyResult.status === 'fulfilled' ? legacyResult.value.docs : [];
  return [
    ...serverRows,
    ...legacyDocs.map((entry) => ({ id: entry.id, ...(entry.data() as Omit<StoredBooking, 'id'>) })),
  ];
}

export async function createBooking(b: Booking): Promise<string> {
  const { itemId, purchaseVariant, name, description, whatsappCountryCode, whatsappNumber, sessionDate, sessionTime } = b;
  const result = await readJson<{ id: string }>(await serverApi('/api/bookings', {
    method: 'POST',
    body: JSON.stringify({ itemId, variant: purchaseVariant || 'standard', name, description, whatsappCountryCode, whatsappNumber, sessionDate, sessionTime }),
  }));
  return result.id;
}

export async function updateBookingStatus(id: string, status: BookingStatus): Promise<void> {
  const response = await serverApi(`/api/admin/bookings/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  if (response.status === 404) {
    await updateDoc(doc(db, 'bookings', id), { status, updatedAt: serverTimestamp() });
    return;
  }
  await readJson(response);
}

export async function deleteBooking(id: string): Promise<void> {
  const response = await serverApi(`/api/admin/bookings/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (response.status === 404) {
    await deleteDoc(doc(db, 'bookings', id));
    return;
  }
  await readJson(response);
}
