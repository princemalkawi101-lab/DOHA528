import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export type BookingStatus = 'pending' | 'completed' | 'cancelled';

export type Booking = {
  itemId: string;
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

export async function createBooking(b: Booking): Promise<string> {
  const ref = await addDoc(collection(db, 'bookings'), {
    ...b,
    status: 'pending' as BookingStatus,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateBookingStatus(id: string, status: BookingStatus): Promise<void> {
  await updateDoc(doc(db, 'bookings', id), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteBooking(id: string): Promise<void> {
  await deleteDoc(doc(db, 'bookings', id));
}
